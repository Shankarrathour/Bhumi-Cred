from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Dict, Any
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field, EmailStr
from pymongo import IndexModel, ASCENDING, DESCENDING


# ── Enums ──────────────────────────────────────────────────────────────────────

class AccountType(str, Enum):
    FARMER = "farmer"
    PARTNER = "partner"
    VENDOR = "vendor"
    BUYER = "buyer"
    ADMIN = "admin"

class TransactionType(str, Enum):
    CREDIT = "credit"
    DEBIT = "debit"

class TransactionCategory(str, Enum):
    INSURANCE = "insurance"
    MARKETPLACE = "marketplace"
    CARBON = "carbon"
    SUBSIDY = "subsidy"
    REFUND = "refund"
    TOPUP = "topup"
    PLATFORM_FEE = "platform_fee"
    TAX_DEDUCTION = "tax_deduction"
    WITHDRAWAL = "withdrawal"

class PayoutStatus(str, Enum):
    REQUESTED = "requested"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class SettlementStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DISBURSED = "disbursed"
    FAILED = "failed"

class FeeType(str, Enum):
    PERCENTAGE = "percentage"
    FLAT = "flat"
    HYBRID = "hybrid"

class TaxType(str, Enum):
    CGST = "cgst"
    SGST = "sgst"
    IGST = "igst"
    TDS = "tds"
    TCS = "tcs"

class InvoiceStatus(str, Enum):
    UNPAID = "unpaid"
    PAID = "paid"
    PARTIALLY_REFUNDED = "partially_refunded"
    CANCELLED = "cancelled"


# ── Embedded Sub-Document Schemas ───────────────────────────────────────────

class BankAccount(BaseModel):
    account_number: str = Field(..., pattern=r"^\d{9,18}$")
    account_holder_name: str
    bank_name: str
    branch_name: Optional[str] = None
    ifsc_code: str = Field(..., pattern=r"^[A-Z]{4}0[A-Z0-9]{6}$")

class LineItem(BaseModel):
    description: str
    quantity: int = Field(..., gt=0)
    unit_price_inr: float = Field(..., ge=0)
    total_amount_inr: float = Field(..., ge=0)

class TaxBreakdown(BaseModel):
    cgst_rate_percent: float = Field(default=9.0, ge=0)
    cgst_amount_inr: float = Field(default=0.0, ge=0)
    sgst_rate_percent: float = Field(default=9.0, ge=0)
    sgst_amount_inr: float = Field(default=0.0, ge=0)
    igst_rate_percent: float = Field(default=0.0, ge=0)
    igst_amount_inr: float = Field(default=0.0, ge=0)


# ── Top-Level Beanie Document Collections ───────────────────────────────────

class FinancialAuditLog(Document):
    audit_id: str = Field(..., description="Unique Audit Ref, e.g., AUD-2026-0091")
    wallet_id: PydanticObjectId
    actor_id: PydanticObjectId
    event_type: str
    previous_balance_inr: float = Field(..., ge=0)
    new_balance_inr: float = Field(..., ge=0)
    ip_address: Optional[str] = None
    remarks: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "financial_audit_logs"
        indexes = [
            IndexModel([("audit_id", ASCENDING)], unique=True),
            IndexModel([("wallet_id", ASCENDING), ("timestamp", DESCENDING)])
        ]


class EscrowAccount(Document):
    escrow_id: str = Field(..., description="Unique Escrow Ref, e.g., ESC-2026-MP-001")
    project_id: PydanticObjectId
    escrow_bank_account: str
    holding_balance_inr: float = Field(default=0.0, ge=0)
    holding_balance_usd: float = Field(default=0.0, ge=0)
    status: str = "active"
    last_reconciled_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "escrow_accounts"
        indexes = [
            IndexModel([("escrow_id", ASCENDING)], unique=True),
            IndexModel([("project_id", ASCENDING)], unique=True)
        ]


class TaxDeductionCertificate(Document):
    certificate_id: str = Field(..., description="Unique Cert Ref, e.g., TDS-FORM16A-2026-Q1")
    pan_number: str = Field(..., pattern=r"^[A-Z]{5}\d{4}[A-Z]{1}$")
    financial_year: str = "2026-2027"
    quarter: str = "Q1"
    total_tds_deducted_inr: float = Field(..., ge=0)
    form_16a_url: str
    issued_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "tax_deduction_certificates"
        indexes = [
            IndexModel([("certificate_id", ASCENDING)], unique=True),
            IndexModel([("pan_number", ASCENDING), ("financial_year", ASCENDING), ("quarter", ASCENDING)], unique=True)
        ]


class Wallet(Document):
    wallet_id: str = Field(..., description="Unique Wallet ID, e.g., WAL-2026-0091")
    user_id: PydanticObjectId
    account_type: AccountType = AccountType.FARMER
    currency: str = "INR"
    balance: float = Field(default=0.0, ge=0.0)
    pending_credits: float = Field(default=0.0, ge=0.0)
    total_withdrawn: float = Field(default=0.0, ge=0.0)
    transaction_pin_hash: Optional[str] = None
    locked_until: Optional[datetime] = None
    bank_account: Optional[BankAccount] = None
    razorpay_customer_id: Optional[str] = None
    is_locked: bool = False

    # Audit & Security Fields
    created_by_id: Optional[PydanticObjectId] = None
    updated_by_id: Optional[PydanticObjectId] = None

    # Soft Delete Support
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by_id: Optional[PydanticObjectId] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    async def soft_delete(self, deleted_by: Optional[PydanticObjectId] = None):
        """Soft delete wallet."""
        self.is_deleted = True
        self.is_locked = True
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by_id = deleted_by
        self.updated_at = datetime.now(timezone.utc)
        await self.save()

    class Settings:
        name = "financial_wallets"
        indexes = [
            IndexModel([("wallet_id", ASCENDING)], unique=True),
            IndexModel([("user_id", ASCENDING)], unique=True),
            IndexModel([("is_deleted", ASCENDING), ("is_locked", ASCENDING)])
        ]


class WalletTransaction(Document):
    transaction_id: str = Field(..., description="Unique Tx ID, e.g., TRX-2026-081299")
    wallet_id: PydanticObjectId
    user_id: PydanticObjectId
    type: TransactionType
    amount: float = Field(..., gt=0)
    amount_usd: Optional[float] = Field(None, ge=0)
    exchange_rate_usd_inr: Optional[float] = Field(83.5, gt=0)
    currency: str = "INR"
    category: TransactionCategory
    reference_id: Optional[str] = Field(None, description="order_id, policy_id, or settlement_id")
    gateway_tx_id: Optional[str] = None
    description: str
    status: str = "success"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "financial_wallet_transactions"
        indexes = [
            IndexModel([("transaction_id", ASCENDING)], unique=True),
            IndexModel([("wallet_id", ASCENDING), ("created_at", DESCENDING)]),
            IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)]),
            IndexModel([("reference_id", ASCENDING)])
        ]


class WalletWithdrawal(Document):
    withdrawal_id: str = Field(..., description="Unique Payout ID, e.g., WTH-2026-0012")
    wallet_id: PydanticObjectId
    user_id: PydanticObjectId
    amount: float = Field(..., gt=0)
    payout_method: str = "UPI"
    bank_account: BankAccount
    payout_status: PayoutStatus = PayoutStatus.REQUESTED
    gateway_payout_id: Optional[str] = None
    failure_reason: Optional[str] = None
    requested_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

    class Settings:
        name = "financial_wallet_withdrawals"
        indexes = [
            IndexModel([("withdrawal_id", ASCENDING)], unique=True),
            IndexModel([("wallet_id", ASCENDING), ("requested_at", DESCENDING)]),
            IndexModel([("payout_status", ASCENDING)])
        ]


class FinancialSettlement(Document):
    settlement_id: str = Field(..., description="Unique Settlement Ref, e.g., STL-2026-08-01")
    partner_id: PydanticObjectId
    settlement_period_start: datetime
    settlement_period_end: datetime
    gross_amount_inr: float = Field(..., ge=0)
    commission_deducted_inr: float = Field(default=0.0, ge=0)
    tax_deducted_inr: float = Field(default=0.0, ge=0)
    platform_fee_deducted_inr: float = Field(default=0.0, ge=0)
    net_payout_inr: float = Field(..., ge=0)
    settlement_status: SettlementStatus = SettlementStatus.PENDING
    disbursed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "financial_settlements"
        indexes = [
            IndexModel([("settlement_id", ASCENDING)], unique=True),
            IndexModel([("partner_id", ASCENDING), ("created_at", DESCENDING)]),
            IndexModel([("settlement_status", ASCENDING)])
        ]


class CommissionLedger(Document):
    commission_id: str = Field(..., description="Unique Commission Ref, e.g., COM-2026-0045")
    transaction_id: PydanticObjectId
    partner_id: PydanticObjectId
    commission_type: FeeType = FeeType.PERCENTAGE
    rate_percent: float = Field(default=0.0, ge=0.0, le=100.0)
    flat_fee_inr: float = Field(default=0.0, ge=0.0)
    calculated_commission_inr: float = Field(..., ge=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "commission_ledgers"
        indexes = [
            IndexModel([("commission_id", ASCENDING)], unique=True),
            IndexModel([("transaction_id", ASCENDING)], unique=True),
            IndexModel([("partner_id", ASCENDING), ("created_at", DESCENDING)])
        ]


class FinancialInvoice(Document):
    invoice_number: str = Field(..., description="GST Invoice No., e.g., INV-2026-08-0091")
    transaction_id: Optional[PydanticObjectId] = None
    billing_to_name: str
    billing_to_type: str
    billing_address: str
    gstin: Optional[str] = None
    line_items: List[LineItem] = Field(default_factory=list)
    subtotal_amount: float = Field(..., ge=0)
    tax_breakdown: TaxBreakdown
    total_tax_amount: float = Field(..., ge=0)
    grand_total_amount: float = Field(..., ge=0)
    payment_status: InvoiceStatus = InvoiceStatus.PAID
    pdf_url: Optional[str] = None

    # Soft Delete Support
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by_id: Optional[PydanticObjectId] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    async def soft_delete(self, deleted_by: Optional[PydanticObjectId] = None):
        """Soft delete financial invoice."""
        self.is_deleted = True
        self.payment_status = InvoiceStatus.CANCELLED
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by_id = deleted_by
        self.updated_at = datetime.now(timezone.utc)
        await self.save()

    class Settings:
        name = "financial_invoices"
        indexes = [
            IndexModel([("invoice_number", ASCENDING)], unique=True),
            IndexModel([("transaction_id", ASCENDING)]),
            IndexModel([("is_deleted", ASCENDING)]),
            IndexModel([("payment_status", ASCENDING), ("created_at", DESCENDING)])
        ]


class TaxLedger(Document):
    tax_ledger_id: str = Field(..., description="Unique Tax Entry ID, e.g., TAX-2026-0042")
    invoice_number: str
    tax_type: TaxType
    tax_rate_percent: float = Field(..., ge=0.0, le=100.0)
    taxable_amount_inr: float = Field(..., ge=0)
    tax_amount_inr: float = Field(..., ge=0)
    gstin: Optional[str] = None
    pan_number: Optional[str] = None
    filed_status: str = "unfiled"
    filing_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "tax_ledgers"
        indexes = [
            IndexModel([("tax_ledger_id", ASCENDING)], unique=True),
            IndexModel([("invoice_number", ASCENDING)]),
            IndexModel([("gstin", ASCENDING), ("filed_status", ASCENDING)])
        ]


class PlatformRevenue(Document):
    revenue_id: str = Field(..., description="Unique Revenue Ref, e.g., REV-2026-08")
    period_month: str = Field(..., description="e.g., 2026-08")
    total_gross_volume_inr: float = Field(default=0.0, ge=0)
    total_commission_earned_inr: float = Field(default=0.0, ge=0)
    total_platform_fees_inr: float = Field(default=0.0, ge=0)
    total_tax_collected_inr: float = Field(default=0.0, ge=0)
    net_platform_revenue_inr: float = Field(default=0.0, ge=0)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "platform_revenues"
        indexes = [
            IndexModel([("revenue_id", ASCENDING)], unique=True),
            IndexModel([("period_month", ASCENDING)], unique=True)
        ]


class PlatformFeeConfig(Document):
    config_id: str = Field(..., description="Unique Config Ref, e.g., CFG-CARBON-FEE")
    service_category: str
    fee_type: FeeType = FeeType.PERCENTAGE
    fee_value: float = Field(..., ge=0)
    is_active: bool = True
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "platform_fee_configs"
        indexes = [
            IndexModel([("config_id", ASCENDING)], unique=True),
            IndexModel([("service_category", ASCENDING), ("is_active", ASCENDING)], unique=True)
        ]
