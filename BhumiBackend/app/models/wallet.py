from typing import Optional
from datetime import datetime, timezone
from enum import Enum
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class TransactionType(str, Enum):
    CREDIT = "credit"
    DEBIT = "debit"


class TransactionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    REJECTED = "rejected"


class WithdrawalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Wallet(Document):
    """
    One wallet per farmer. Stores the live balance and cumulative earnings.
    wallet_balance on the Farmer document is kept in sync as a denormalised
    fast-read field — always update both together.
    """
    farmer_id: str
    balance: float = 0.0
    total_earnings: float = 0.0   # cumulative lifetime credits received
    total_withdrawn: float = 0.0  # cumulative amount successfully disbursed
    upi_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "wallets"
        indexes = [
            IndexModel([("farmer_id", ASCENDING)], unique=True),
        ]


class WalletTransaction(Document):
    """
    Immutable ledger entry. One row per money-in or money-out event.
    reference_id links to the originating document (e.g. a WithdrawalRequest ID
    or a future CarbonCreditBatch ID).
    """
    farmer_id: str
    wallet_id: str
    amount: float
    type: TransactionType
    status: TransactionStatus
    description: str
    reference_id: Optional[str] = None
    category: Optional[str] = None
    payment_method: Optional[str] = None
    bank_name: Optional[str] = None
    upi_id: Optional[str] = None
    utr: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "wallet_transactions"
        indexes = [
            IndexModel([("farmer_id", ASCENDING)]),
            IndexModel([("wallet_id", ASCENDING)]),
            IndexModel([("farmer_id", ASCENDING), ("created_at", ASCENDING)]),
            IndexModel([("reference_id", ASCENDING)]),
        ]


class WalletBankAccount(Document):
    """
    Payout bank account linked to a farmer's wallet.
    account_number_masked stores only the masked form (e.g. ******5432)
    as sent by the client — no raw account number is persisted here.

    A farmer may hold up to 3 accounts at once (enforced in the service layer).
    is_active now means "not deleted" (accounts are hard-deleted, so this stays
    True for the lifetime of the record — kept for backward compatibility with
    existing queries/documents). Exactly one account should have is_primary=True
    at any time; this is enforced and self-healed in the service layer.
    """
    farmer_id: str
    bank_name: str
    account_number_masked: str
    ifsc_code: str
    account_holder_name: str
    is_active: bool = True
    is_primary: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "wallet_bank_accounts"
        indexes = [
            IndexModel([("farmer_id", ASCENDING)]),
            IndexModel([("farmer_id", ASCENDING), ("is_active", ASCENDING)]),
        ]


class WithdrawalRequest(Document):
    """
    A farmer-initiated payout request.

    Balance deduction flow:
      - Created  → status=pending,  balance unchanged.
      - Approved → status=approved, balance deducted, payout_service called.
      - Rejected → status=rejected, balance unchanged.

    Bank details are snapshotted at creation time so that a later change of bank
    account does not alter the audit trail for existing requests.

    payment_method distinguishes a bank payout from a UPI payout. bank_* fields
    are populated (and bank_account_id set) only for "bank"; upi_id is populated
    only for "upi". Both sets are Optional so either shape can be stored.
    """
    farmer_id: str
    farmer_name: str              # snapshot for admin display without extra JOIN
    wallet_id: str
    bank_account_id: Optional[str] = None
    amount: float
    status: WithdrawalStatus = WithdrawalStatus.PENDING
    payment_method: str = "bank"  # "bank" | "upi"

    # Bank detail snapshot (immutable audit trail) — set only when payment_method == "bank"
    bank_name: Optional[str] = None
    account_number_masked: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_holder_name: Optional[str] = None
    is_primary_account: Optional[bool] = None

    # UPI snapshot — set only when payment_method == "upi"
    upi_id: Optional[str] = None

    # Processing metadata
    processed_by: Optional[str] = None       # admin user ID
    processed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    payout_reference: Optional[str] = None   # returned by payout_service

    # Linked ledger entry
    transaction_id: Optional[str] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "withdrawal_requests"
        indexes = [
            IndexModel([("farmer_id", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("farmer_id", ASCENDING), ("status", ASCENDING)]),
            IndexModel([("wallet_id", ASCENDING)]),
            IndexModel([("created_at", ASCENDING)]),
        ]
