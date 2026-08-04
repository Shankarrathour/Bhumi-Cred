import logging
from datetime import datetime, timezone
from typing import Optional

from app.models.farmer import Farmer
from app.models.wallet import (
    Wallet,
    WalletBankAccount,
    WalletTransaction,
    WithdrawalRequest,
    TransactionType,
    TransactionStatus,
    WithdrawalStatus,
)
from app.repositories.farmer import FarmerRepository
from app.repositories.wallet import (
    WalletRepository,
    WalletTransactionRepository,
    WalletBankAccountRepository,
    WithdrawalRequestRepository,
)
from app.schemas.wallet import (
    AddBankAccountRequest,
    UpdateBankAccountRequest,
    BankAccountResponse,
    TransactionResponse,
    WalletResponse,
    WithdrawRequest,
    WithdrawalRequestResponse,
)
from app.core.exceptions import (
    FarmerNotFoundException,
    WalletNotFoundException,
    BankAccountNotFoundException,
    InsufficientBalanceException,
    PendingWithdrawalExistsException,
    MaxBankAccountsException,
)
from app.repositories.notification import NotificationRepository
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)

MAX_BANK_ACCOUNTS = 3




class WalletService:
    def __init__(
        self,
        wallet_repo: WalletRepository,
        tx_repo: WalletTransactionRepository,
        bank_repo: WalletBankAccountRepository,
        withdrawal_repo: WithdrawalRequestRepository,
        farmer_repo: FarmerRepository,
        notification_service: Optional[NotificationService] = None,
    ):
        self._notifications = notification_service or NotificationService(NotificationRepository())
        self._wallets = wallet_repo
        self._txs = tx_repo
        self._banks = bank_repo
        self._withdrawals = withdrawal_repo
        self._farmers = farmer_repo

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def _get_farmer(self, farmer_id: str) -> Farmer:
        farmer = await self._farmers.get_by_id(farmer_id)
        if not farmer:
            raise FarmerNotFoundException()
        return farmer

    async def _get_or_create_wallet(self, farmer_id: str) -> Wallet:
        return await self._wallets.get_or_create(farmer_id)

    @staticmethod
    def _bank_response(account: WalletBankAccount) -> BankAccountResponse:
        return BankAccountResponse(
            id=str(account.id),
            bank_name=account.bank_name,
            account_number=account.account_number_masked,
            ifsc_code=account.ifsc_code,
            account_holder_name=account.account_holder_name,
            is_active=account.is_active,
            is_primary=account.is_primary,
            created_at=account.created_at,
        )

    async def _ensure_primary_assigned(self, farmer_id: str) -> None:
        """
        Self-heals legacy/edge-case data: if a farmer has at least one active
        account but none is flagged primary, promote the oldest one.
        """
        accounts = await self._banks.list_active_by_farmer(farmer_id)
        if accounts and not any(a.is_primary for a in accounts):
            accounts[0].is_primary = True
            await accounts[0].save()

    async def _get_owned_bank_account(self, farmer_id: str, account_id: str) -> WalletBankAccount:
        account = await self._banks.get_by_id(account_id)
        if not account or account.farmer_id != farmer_id or not account.is_active:
            raise BankAccountNotFoundException()
        return account

    

    @staticmethod
    def _tx_response(tx: WalletTransaction) -> TransactionResponse:
        return TransactionResponse(
            id=str(tx.id),
            amount=tx.amount,
            type=tx.type,
            status=tx.status,
            description=tx.description,
            reference_id=tx.reference_id,
            created_at=tx.created_at,
        )

    @staticmethod
    def _withdrawal_response(w: WithdrawalRequest) -> WithdrawalRequestResponse:
        return WithdrawalRequestResponse(
            id=str(w.id),
            farmer_id=w.farmer_id,
            amount=w.amount,
            status=w.status,
            payment_method=w.payment_method,
            bank_name=w.bank_name,
            account_number_masked=w.account_number_masked,
            ifsc_code=w.ifsc_code,
            account_holder_name=w.account_holder_name,
            is_primary_account=w.is_primary_account,
            upi_id=w.upi_id,
            rejection_reason=w.rejection_reason,
            payout_reference=w.payout_reference,
            created_at=w.created_at,
            updated_at=w.updated_at,
        )

    async def _build_wallet_response(self, wallet: Wallet) -> WalletResponse:
        bank_account = await self._banks.get_active_by_farmer(wallet.farmer_id)
        return WalletResponse(
            id=str(wallet.id),
            farmer_id=wallet.farmer_id,
            balance=wallet.balance,
            total_earnings=wallet.total_earnings,
            total_withdrawn=wallet.total_withdrawn,
            bank_account=self._bank_response(bank_account) if bank_account else None,
            created_at=wallet.created_at,
            updated_at=wallet.updated_at,
        )

    # ── Wallet ────────────────────────────────────────────────────────────────

    async def get_wallet(self, farmer_id: str) -> WalletResponse:
        await self._get_farmer(farmer_id)
        wallet = await self._get_or_create_wallet(farmer_id)
        return await self._build_wallet_response(wallet)

    # ── Transactions ──────────────────────────────────────────────────────────

    async def get_transactions(
        self,
        farmer_id: str,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[TransactionResponse], int]:
        await self._get_farmer(farmer_id)
        skip = (page - 1) * limit
        txs = await self._txs.get_by_farmer(farmer_id, skip=skip, limit=limit)
        total = await self._txs.count_by_farmer(farmer_id)
        return [self._tx_response(tx) for tx in txs], total

    # ── Bank account ──────────────────────────────────────────────────────────

    async def get_bank_account(self, farmer_id: str) -> BankAccountResponse:
        await self._get_farmer(farmer_id)
        account = await self._banks.get_active_by_farmer(farmer_id)
        if not account:
            raise BankAccountNotFoundException()
        return self._bank_response(account)

    async def list_bank_accounts(self, farmer_id: str) -> list[BankAccountResponse]:
        await self._get_farmer(farmer_id)
        await self._ensure_primary_assigned(farmer_id)
        accounts = await self._banks.list_active_by_farmer(farmer_id)
        return [self._bank_response(a) for a in accounts]

    async def add_bank_account(
        self, farmer_id: str, data: AddBankAccountRequest
    ) -> BankAccountResponse:
        await self._get_farmer(farmer_id)

        existing_count = await self._banks.count_active_by_farmer(farmer_id)
        if existing_count >= MAX_BANK_ACCOUNTS:
            raise MaxBankAccountsException()

        now = datetime.now(timezone.utc)
        account = WalletBankAccount(
            farmer_id=farmer_id,
            bank_name=data.bank_name,
            account_number_masked=data.account_number,
            ifsc_code=data.ifsc_code,
            account_holder_name=data.account_holder_name,
            is_active=True,
            is_primary=existing_count == 0,  # first account is automatically primary
            created_at=now,
            updated_at=now,
        )
        await self._banks.create(account)
        return self._bank_response(account)

    async def update_bank_account(
        self, farmer_id: str, account_id: str, data: UpdateBankAccountRequest
    ) -> BankAccountResponse:
        await self._get_farmer(farmer_id)
        account = await self._get_owned_bank_account(farmer_id, account_id)

        account.bank_name = data.bank_name
        account.account_number_masked = data.account_number
        account.ifsc_code = data.ifsc_code
        account.account_holder_name = data.account_holder_name
        account.updated_at = datetime.now(timezone.utc)
        await account.save()
        return self._bank_response(account)

    async def delete_bank_account(self, farmer_id: str, account_id: str) -> None:
        await self._get_farmer(farmer_id)
        account = await self._get_owned_bank_account(farmer_id, account_id)
        was_primary = account.is_primary

        await self._banks.delete(account)

        if was_primary:
            remaining = await self._banks.list_active_by_farmer(farmer_id)
            if remaining:
                remaining[0].is_primary = True
                await remaining[0].save()

    async def set_primary_bank_account(
        self, farmer_id: str, account_id: str
    ) -> BankAccountResponse:
        await self._get_farmer(farmer_id)
        account = await self._get_owned_bank_account(farmer_id, account_id)

        await self._banks.unset_primary_for_farmer(farmer_id)
        account.is_primary = True
        account.updated_at = datetime.now(timezone.utc)
        await account.save()
        return self._bank_response(account)

    # ── Withdrawal ────────────────────────────────────────────────────────────

    async def request_withdrawal(
        self, farmer_id: str, data: WithdrawRequest
    ) -> WithdrawalRequestResponse:
        farmer = await self._get_farmer(farmer_id)
        wallet = await self._get_or_create_wallet(farmer_id)

        if wallet.balance < data.amount:
            raise InsufficientBalanceException()

        # Only one pending withdrawal at a time
        pending = await self._withdrawals.get_pending_by_farmer(farmer_id)
        if pending:
            raise PendingWithdrawalExistsException()

        bank_account = await self._banks.get_active_by_farmer(farmer_id)
        if not bank_account:
            raise BankAccountNotFoundException()

        now = datetime.now(timezone.utc)
        withdrawal = WithdrawalRequest(
            farmer_id=farmer_id,
            farmer_name=farmer.full_name or "Unknown",
            wallet_id=str(wallet.id),
            amount=data.amount,
            status=WithdrawalStatus.PENDING,
            payment_method=data.payment_method,
            created_at=now,
            updated_at=now,
        )

        if data.payment_method == "bank":
            # bank_account_id presence already guaranteed by WithdrawRequest validator
            bank_account = await self._get_owned_bank_account(farmer_id, data.bank_account_id)
            withdrawal.bank_account_id = str(bank_account.id)
            withdrawal.bank_name = bank_account.bank_name
            withdrawal.account_number_masked = bank_account.account_number_masked
            withdrawal.ifsc_code = bank_account.ifsc_code
            withdrawal.account_holder_name = bank_account.account_holder_name
            withdrawal.is_primary_account = bank_account.is_primary
        else:
            withdrawal.upi_id = data.upi_id

        await self._withdrawals.create(withdrawal)

        try:
            await self._notifications.create_admin_notification(
                "Withdrawal",
                f"Farmer {farmer.farmer_id} requested wallet withdrawal.",
                type="withdrawal",
                actor_type="farmer",
            )
        except Exception:
            logger.exception(f"Failed to create admin notification for withdrawal {withdrawal.id}")

        return self._withdrawal_response(withdrawal)

    # ── Internal: called by admin service after approval ──────────────────────

    async def credit_wallet(
        self,
        farmer_id: str,
        amount: float,
        description: str,
        reference_id: str,
    ) -> None:
        """
        Credits a farmer's wallet. Also syncs Farmer.wallet_balance.
        Intended for use by Carbon Credit issuance (future step).
        """
        wallet = await self._get_or_create_wallet(farmer_id)
        now = datetime.now(timezone.utc)

        wallet.balance += amount
        wallet.total_earnings += amount
        wallet.updated_at = now
        await wallet.save()

        tx = WalletTransaction(
            farmer_id=farmer_id,
            wallet_id=str(wallet.id),
            amount=amount,
            type=TransactionType.CREDIT,
            status=TransactionStatus.COMPLETED,
            description=description,
            reference_id=reference_id,
            created_at=now,
            updated_at=now,
        )
        await self._txs.create(tx)

        # Keep denormalised balance in sync
        farmer = await self._farmers.get_by_id(farmer_id)
        if farmer:
            farmer.wallet_balance = wallet.balance
            farmer.updated_at = now
            await farmer.save()
