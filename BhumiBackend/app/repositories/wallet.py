from typing import Optional

from app.models.wallet import (
    Wallet,
    WalletTransaction,
    WalletBankAccount,
    WithdrawalRequest,
    WithdrawalStatus,
)
from app.repositories.base import BaseRepository


class WalletRepository(BaseRepository[Wallet]):
    def __init__(self):
        super().__init__(Wallet)

    async def get_by_farmer(self, farmer_id: str) -> Optional[Wallet]:
        return await Wallet.find_one(Wallet.farmer_id == farmer_id)

    async def get_or_create(self, farmer_id: str) -> Wallet:
        """
        Returns the existing wallet for this farmer, or creates and persists a new one.
        Idempotent: calling multiple times is safe because the farmer_id index is unique.

        New wallets always start at zero balance. Balance only increases when an
        admin approves a Carbon Credit sale (see WalletService.credit_wallet).
        """
        from datetime import datetime, timezone
        wallet = await self.get_by_farmer(farmer_id)
        if wallet:
            return wallet
        now = datetime.now(timezone.utc)
        wallet = Wallet(
            farmer_id=farmer_id,
            balance=0.0,
            total_earnings=0.0,
            total_withdrawn=0.0,
            created_at=now,
            updated_at=now,
        )
        return await self.create(wallet)


class WalletTransactionRepository(BaseRepository[WalletTransaction]):
    def __init__(self):
        super().__init__(WalletTransaction)

    async def get_by_farmer(
        self,
        farmer_id: str,
        skip: int = 0,
        limit: int = 50,
    ) -> list[WalletTransaction]:
        return (
            await WalletTransaction.find(WalletTransaction.farmer_id == farmer_id)
            .sort("-created_at")
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    async def count_by_farmer(self, farmer_id: str) -> int:
        return await WalletTransaction.find(
            WalletTransaction.farmer_id == farmer_id
        ).count()


class WalletBankAccountRepository(BaseRepository[WalletBankAccount]):
    def __init__(self):
        super().__init__(WalletBankAccount)

    async def list_active_by_farmer(self, farmer_id: str) -> list[WalletBankAccount]:
        return (
            await WalletBankAccount.find(
                WalletBankAccount.farmer_id == farmer_id,
                WalletBankAccount.is_active == True,
            )
            .sort("+created_at")
            .to_list()
        )

    async def count_active_by_farmer(self, farmer_id: str) -> int:
        return await WalletBankAccount.find(
            WalletBankAccount.farmer_id == farmer_id,
            WalletBankAccount.is_active == True,
        ).count()

    async def get_primary_by_farmer(self, farmer_id: str) -> Optional[WalletBankAccount]:
        return await WalletBankAccount.find_one(
            WalletBankAccount.farmer_id == farmer_id,
            WalletBankAccount.is_active == True,
            WalletBankAccount.is_primary == True,
        )

    async def get_active_by_farmer(self, farmer_id: str) -> Optional[WalletBankAccount]:
        """Legacy single-account accessor — returns the primary account, if any."""
        return await self.get_primary_by_farmer(farmer_id)

    async def unset_primary_for_farmer(self, farmer_id: str) -> None:
        accounts = await WalletBankAccount.find(
            WalletBankAccount.farmer_id == farmer_id,
            WalletBankAccount.is_active == True,
            WalletBankAccount.is_primary == True,
        ).to_list()
        for account in accounts:
            account.is_primary = False
            await account.save()


class WithdrawalRequestRepository(BaseRepository[WithdrawalRequest]):
    def __init__(self):
        super().__init__(WithdrawalRequest)

    async def get_pending_by_farmer(self, farmer_id: str) -> Optional[WithdrawalRequest]:
        return await WithdrawalRequest.find_one(
            WithdrawalRequest.farmer_id == farmer_id,
            WithdrawalRequest.status == WithdrawalStatus.PENDING,
        )

    async def list_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[WithdrawalStatus] = None,
    ) -> tuple[list[WithdrawalRequest], int]:
        query: dict = {}
        if status is not None:
            query["status"] = status

        results = (
            await WithdrawalRequest.find(query)
            .sort("-created_at")
            .skip(skip)
            .limit(limit)
            .to_list()
        )
        total = await WithdrawalRequest.find(query).count()
        return results, total
