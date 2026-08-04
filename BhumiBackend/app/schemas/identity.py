from typing import Optional
from datetime import datetime
from pydantic import BaseModel, field_validator

from app.validators.indian import validate_aadhaar, validate_pan
from app.models.farmer import KYCStatus


class UpdateIdentityRequest(BaseModel):
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None

    @field_validator("aadhaar_number")
    @classmethod
    def validate_aadhaar_field(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_aadhaar(v)
        return v

    @field_validator("pan_number")
    @classmethod
    def validate_pan_field(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_pan(v)
        return v


class IdentityResponse(BaseModel):
    aadhaar_masked: Optional[str] = None
    pan_number: Optional[str] = None
    aadhaar_url: Optional[str] = None
    pan_url: Optional[str] = None
    submitted_at: Optional[datetime] = None


class KYCStatusResponse(BaseModel):
    kyc_status: KYCStatus
    kyc_remarks: Optional[str] = None
    kyc_reviewed_at: Optional[datetime] = None
    has_aadhaar: bool = False
    has_pan: bool = False
    has_bank_details: bool = False
    onboarding_completed: bool = False
