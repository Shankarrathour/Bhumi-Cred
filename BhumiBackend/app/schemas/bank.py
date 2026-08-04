from typing import Optional
from datetime import datetime
from pydantic import BaseModel, field_validator

from app.validators.indian import validate_ifsc


class UpdateBankRequest(BaseModel):
    bank_name: str
    ifsc_code: str
    account_number: str
    account_holder_name: str

    @field_validator("bank_name")
    @classmethod
    def validate_bank_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Bank name must be at least 2 characters.")
        return v

    @field_validator("ifsc_code")
    @classmethod
    def validate_ifsc_field(cls, v: str) -> str:
        return validate_ifsc(v)

    @field_validator("account_number")
    @classmethod
    def validate_account_number(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or not (9 <= len(v) <= 18):
            raise ValueError("Account number must be 9-18 digits.")
        return v

    @field_validator("account_holder_name")
    @classmethod
    def validate_holder_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Account holder name must be at least 2 characters.")
        return v


class BankResponse(BaseModel):
    bank_name: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_number_masked: Optional[str] = None
    account_holder_name: Optional[str] = None
    is_verified: bool = False
    added_at: Optional[datetime] = None
