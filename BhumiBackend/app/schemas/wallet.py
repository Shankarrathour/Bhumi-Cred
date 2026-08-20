from typing import Literal, Optional
from datetime import datetime
from pydantic import BaseModel, field_validator, model_validator

from app.models.wallet import TransactionType, TransactionStatus, WithdrawalStatus
from app.validators.indian import validate_ifsc


# ── Farmer: bank account ──────────────────────────────────────────────────────

class AddBankAccountRequest(BaseModel):
    bank_name: str
    account_number: str          # frontend sends pre-masked (e.g. ******5432)
    ifsc_code: str
    account_holder_name: str

    @field_validator("bank_name")
    @classmethod
    def _bank_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Bank name must be at least 2 characters.")
        return v

    @field_validator("account_number")
    @classmethod
    def _account_number(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Account number is required.")
        return v

    @field_validator("ifsc_code")
    @classmethod
    def _ifsc_code(cls, v: str) -> str:
        return validate_ifsc(v)

    @field_validator("account_holder_name")
    @classmethod
    def _holder_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Account holder name must be at least 2 characters.")
        return v


class UpdateBankAccountRequest(BaseModel):
    bank_name: str
    account_number: str          # frontend sends pre-masked (e.g. ******5432)
    ifsc_code: str
    account_holder_name: str

    @field_validator("bank_name")
    @classmethod
    def _bank_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Bank name must be at least 2 characters.")
        return v

    @field_validator("account_number")
    @classmethod
    def _account_number(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Account number is required.")
        return v

    @field_validator("ifsc_code")
    @classmethod
    def _ifsc_code(cls, v: str) -> str:
        return validate_ifsc(v)

    @field_validator("account_holder_name")
    @classmethod
    def _holder_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Account holder name must be at least 2 characters.")
        return v


class BankAccountResponse(BaseModel):
    id: str
    bank_name: str
    account_number: str          # masked form stored and returned
    ifsc_code: str
    account_holder_name: str
    is_active: bool = True
    is_primary: bool = False
    created_at: Optional[datetime] = None


# ── Farmer: transactions ──────────────────────────────────────────────────────

class TransactionResponse(BaseModel):
    id: str
    amount: float
    type: TransactionType
    status: TransactionStatus
    description: str
    reference_id: Optional[str] = None
    created_at: Optional[datetime] = None


# ── Farmer: wallet ────────────────────────────────────────────────────────────

class AddUpiRequest(BaseModel):
    upi_id: str


class WalletResponse(BaseModel):
    id: str
    farmer_id: str
    balance: float
    total_earnings: float
    total_withdrawn: float
    upi_id: Optional[str] = None
    bank_account: Optional[BankAccountResponse] = None       # primary account (backward compat)
    bank_accounts: list[BankAccountResponse] = []             # all accounts (up to 3)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ── Farmer: withdrawal ────────────────────────────────────────────────────────

class WithdrawRequest(BaseModel):
    amount: float
    payment_method: Literal["bank", "upi"] = "bank"
    bank_account_id: Optional[str] = None   # required when payment_method == "bank"
    upi_id: Optional[str] = None            # required when payment_method == "upi"

    @field_validator("amount")
    @classmethod
    def _amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Withdrawal amount must be greater than zero.")
        return v

    @model_validator(mode="after")
    def _method_requires_matching_field(self) -> "WithdrawRequest":
        if self.payment_method == "bank" and not self.bank_account_id:
            raise ValueError("bank_account_id is required when payment_method is 'bank'.")
        if self.payment_method == "upi" and not self.upi_id:
            raise ValueError("upi_id is required when payment_method is 'upi'.")
        return self


class WithdrawalRequestResponse(BaseModel):
    id: str
    farmer_id: str
    amount: float
    status: WithdrawalStatus
    payment_method: str
    bank_name: Optional[str] = None
    account_number_masked: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_holder_name: Optional[str] = None
    is_primary_account: Optional[bool] = None
    upi_id: Optional[str] = None
    rejection_reason: Optional[str] = None
    payout_reference: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ── Admin: wallet overview ────────────────────────────────────────────────────

class AdminWalletFarmerResponse(BaseModel):
    farmer_id: str
    farmer_public_id: Optional[str] = None
    farmer_name: str
    mobile: str
    carbon_credits: float
    estimated_value: float       # credits * 400
    wallet_balance: float
    total_withdrawn: float


# ── Admin: withdrawal management ─────────────────────────────────────────────

class AdminWithdrawalResponse(BaseModel):
    id: str
    farmer_id: str
    farmer_name: str
    amount: float
    status: WithdrawalStatus
    payment_method: str
    bank_name: Optional[str] = None
    account_number_masked: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_holder_name: Optional[str] = None
    is_primary_account: Optional[bool] = None
    upi_id: Optional[str] = None
    processed_by: Optional[str] = None
    processed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    payout_reference: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ApproveWithdrawalRequest(BaseModel):
    remarks: Optional[str] = None


class RejectWithdrawalRequest(BaseModel):
    reason: str

    @field_validator("reason")
    @classmethod
    def _reason(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Rejection reason must be at least 3 characters.")
        return v
