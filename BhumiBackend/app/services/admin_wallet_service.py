import logging
from datetime import datetime, timezone

from app.models.farmer import Farmer
from app.models.wallet import (
    WalletTransaction,
    TransactionType,
    TransactionStatus,
    WithdrawalStatus,
)
from app.repositories.farmer import FarmerRepository
from app.repositories.wallet import (
    WalletRepository,
    WalletTransactionRepository,
    WithdrawalRequestRepository,
)
from app.schemas.wallet import (
    AdminWalletFarmerResponse,
    AdminWithdrawalResponse,
    ApproveWithdrawalRequest,
    RejectWithdrawalRequest,
)
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.core.exceptions import (
    FarmerNotFoundException,
    WithdrawalNotFoundException,
    WithdrawalAlreadyProcessedException,
    InsufficientBalanceException,
)
from app.services.payout_service import process_bank_transfer
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)

_CREDIT_VALUE_PER_UNIT = 400.0  # INR per carbon credit


class AdminWalletService:
    def __init__(
        self,
        wallet_repo: WalletRepository,
        tx_repo: WalletTransactionRepository,
        withdrawal_repo: WithdrawalRequestRepository,
        farmer_repo: FarmerRepository,
        notification_service: NotificationService,
    ):
        self._wallets = wallet_repo
        self._txs = tx_repo
        self._withdrawals = withdrawal_repo
        self._farmers = farmer_repo
        self._notifications = notification_service

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _farmer_wallet_response(
        farmer: Farmer, wallet_balance: float, total_withdrawn: float
    ) -> AdminWalletFarmerResponse:
        credits = farmer.carbon_credits_generated or 0.0
        return AdminWalletFarmerResponse(
            farmer_id=str(farmer.id),
            farmer_public_id=farmer.farmer_id,
            farmer_name=farmer.full_name or "—",
            mobile=farmer.mobile,
            carbon_credits=credits,
            estimated_value=round(credits * _CREDIT_VALUE_PER_UNIT, 2),
            wallet_balance=wallet_balance,
            total_withdrawn=total_withdrawn,
        )

    @staticmethod
    def _withdrawal_response(w) -> AdminWithdrawalResponse:
        return AdminWithdrawalResponse(
            id=str(w.id),
            farmer_id=w.farmer_id,
            farmer_name=w.farmer_name,
            amount=w.amount,
            status=w.status,
            payment_method=w.payment_method,
            bank_name=w.bank_name,
            account_number_masked=w.account_number_masked,
            ifsc_code=w.ifsc_code,
            account_holder_name=w.account_holder_name,
            is_primary_account=w.is_primary_account,
            upi_id=w.upi_id,
            processed_by=w.processed_by,
            processed_at=w.processed_at,
            rejection_reason=w.rejection_reason,
            payout_reference=w.payout_reference,
            created_at=w.created_at,
            updated_at=w.updated_at,
        )

    # ── Wallet overview ───────────────────────────────────────────────────────

    async def list_farmer_wallets(
        self,
        page: int = 1,
        limit: int = 20,
    ) -> PaginatedResponse[AdminWalletFarmerResponse]:
        skip = (page - 1) * limit
        farmers, total = await self._farmers.list_paginated(skip=skip, limit=limit)

        items: list[AdminWalletFarmerResponse] = []
        for farmer in farmers:
            wallet = await self._wallets.get_by_farmer(str(farmer.id))
            balance = wallet.balance if wallet else 0.0
            settled = wallet.total_withdrawn if wallet else 0.0
            items.append(self._farmer_wallet_response(farmer, balance, settled))

        return PaginatedResponse(
            data=items,
            meta=PaginationMeta(
                total=total,
                page=page,
                limit=limit,
                total_pages=-(-total // limit),  # ceiling division
            ),
        )

    # ── Withdrawals ───────────────────────────────────────────────────────────

    async def list_withdrawals(
        self,
        page: int = 1,
        limit: int = 20,
        status: WithdrawalStatus | None = None,
    ) -> PaginatedResponse[AdminWithdrawalResponse]:
        skip = (page - 1) * limit
        withdrawals, total = await self._withdrawals.list_paginated(
            skip=skip, limit=limit, status=status
        )
        items = [self._withdrawal_response(w) for w in withdrawals]
        return PaginatedResponse(
            data=items,
            meta=PaginationMeta(
                total=total,
                page=page,
                limit=limit,
                total_pages=-(-total // limit),
            ),
        )

    async def approve_withdrawal(
        self,
        withdrawal_id: str,
        admin_id: str,
        data: ApproveWithdrawalRequest,
    ) -> AdminWithdrawalResponse:
        withdrawal = await self._withdrawals.get_by_id(withdrawal_id)
        if not withdrawal:
            raise WithdrawalNotFoundException()

        if withdrawal.status != WithdrawalStatus.PENDING:
            raise WithdrawalAlreadyProcessedException()

        wallet = await self._wallets.get_by_farmer(withdrawal.farmer_id)
        if not wallet or wallet.balance < withdrawal.amount:
            raise InsufficientBalanceException()

        # Call payout service (currently returns dummy response). UPI payouts have
        # no bank-transfer integration yet, so the stub is only invoked for "bank".
        if withdrawal.payment_method == "bank":
            from app.models.wallet import WalletBankAccount
            dummy_bank = WalletBankAccount(
                farmer_id=withdrawal.farmer_id,
                bank_name=withdrawal.bank_name,
                account_number_masked=withdrawal.account_number_masked,
                ifsc_code=withdrawal.ifsc_code,
                account_holder_name=withdrawal.account_holder_name,
            )
            payout_result = await process_bank_transfer(dummy_bank, withdrawal.amount)
        else:
            payout_result = {"success": True, "transaction_id": "DUMMY_UPI_TXN_001"}

        now = datetime.now(timezone.utc)

        # Deduct balance — only on approval
        wallet.balance -= withdrawal.amount
        wallet.total_withdrawn += withdrawal.amount
        wallet.updated_at = now
        await wallet.save()

        # Sync denormalised balance on Farmer document
        farmer = await self._farmers.get_by_id(withdrawal.farmer_id)
        if farmer:
            farmer.wallet_balance = wallet.balance
            farmer.updated_at = now
            await farmer.save()

        # Look up existing pending transaction from withdrawal request and update it
        tx = None
        if withdrawal.transaction_id:
            tx = await self._txs.get_by_id(withdrawal.transaction_id)

        if tx:
            tx.status = TransactionStatus.COMPLETED
            tx.description = f"Withdrawal approved by admin"
            tx.updated_at = now
            await tx.save()
        else:
            tx = WalletTransaction(
                farmer_id=withdrawal.farmer_id,
                wallet_id=str(wallet.id),
                amount=withdrawal.amount,
                type=TransactionType.DEBIT,
                status=TransactionStatus.COMPLETED,
                description=f"Withdrawal approved by admin",
                reference_id=str(withdrawal.id),
                created_at=now,
                updated_at=now,
            )
            await self._txs.create(tx)

        # Update withdrawal record
        withdrawal.status = WithdrawalStatus.APPROVED
        withdrawal.processed_by = admin_id
        withdrawal.processed_at = now
        withdrawal.payout_reference = payout_result.get("transaction_id")
        withdrawal.transaction_id = str(tx.id)
        withdrawal.updated_at = now
        await withdrawal.save()

        try:
            await self._notifications.create_notification(
                str(withdrawal.farmer_id),
                "Withdrawal Approved",
                "Your withdrawal request has been approved.",
                type="payout",
            )
        except Exception:
            logger.exception(f"Failed to create withdrawal-approved notification for withdrawal {withdrawal.id}")

        return self._withdrawal_response(withdrawal)

    async def reject_withdrawal(
        self,
        withdrawal_id: str,
        admin_id: str,
        data: RejectWithdrawalRequest,
    ) -> AdminWithdrawalResponse:
        withdrawal = await self._withdrawals.get_by_id(withdrawal_id)
        if not withdrawal:
            raise WithdrawalNotFoundException()

        if withdrawal.status != WithdrawalStatus.PENDING:
            raise WithdrawalAlreadyProcessedException()

        now = datetime.now(timezone.utc)

        # Look up existing pending transaction from withdrawal request and update it
        tx = None
        if withdrawal.transaction_id:
            tx = await self._txs.get_by_id(withdrawal.transaction_id)

        if tx:
            tx.status = TransactionStatus.REJECTED
            tx.description = "Withdrawal rejected by admin"
            tx.updated_at = now
            await tx.save()
        else:
            if wallet:
                tx = WalletTransaction(
                    farmer_id=withdrawal.farmer_id,
                    wallet_id=str(wallet.id),
                    amount=withdrawal.amount,
                    type=TransactionType.DEBIT,
                    status=TransactionStatus.REJECTED,
                    description="Withdrawal rejected by admin",
                    reference_id=str(withdrawal.id),
                    created_at=now,
                    updated_at=now,
                )
                await self._txs.create(tx)
                withdrawal.transaction_id = str(tx.id)

        withdrawal.status = WithdrawalStatus.REJECTED
        withdrawal.processed_by = admin_id
        withdrawal.processed_at = now
        withdrawal.rejection_reason = data.reason
        withdrawal.updated_at = now
        await withdrawal.save()

        try:
            await self._notifications.create_notification(
                str(withdrawal.farmer_id),
                "Withdrawal Rejected",
                "Your withdrawal request has been rejected.",
                type="payout",
            )
        except Exception:
            logger.exception(f"Failed to create withdrawal-rejected notification for withdrawal {withdrawal.id}")

        return self._withdrawal_response(withdrawal)
