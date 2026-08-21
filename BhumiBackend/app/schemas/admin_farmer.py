from typing import Optional
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, field_validator, model_validator

from app.models.farmer import KYCStatus, FarmerLocale, Gender, FarmerCategory, Education, IdentityType
from app.schemas.address import AddressSchema


class FarmerAccountStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    BLOCKED = "blocked"


class AdminFarmerListItem(BaseModel):
    id: str
    farmer_id: Optional[str] = None
    mobile: str
    full_name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    kyc_status: KYCStatus = KYCStatus.UNVERIFIED
    is_active: bool = True
    onboarding_completed: bool = False
    total_acreage: float = 0.0
    sustainability_score: int = 0
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AdminFarmerLocationTreeResponse(BaseModel):
    """Real, distinct GIS location values derived from farmer records (for filter dropdowns)."""
    states_and_districts: dict[str, list[str]]
    district_blocks: dict[str, list[str]]
    block_villages: dict[str, list[str]]


class AdminFarmerDetailResponse(BaseModel):
    id: str
    farmer_id: Optional[str] = None
    mobile: str
    full_name: Optional[str] = None
    father_name: Optional[str] = None
    dob: Optional[datetime] = None
    email: Optional[EmailStr] = None
    gender: Optional[Gender] = None
    category: Optional[FarmerCategory] = None
    education: Optional[Education] = None
    occupation: Optional[str] = None
    # Current address (flat fields)
    state: Optional[str] = None
    district: Optional[str] = None
    tehsil: Optional[str] = None
    city: Optional[str] = None
    village: Optional[str] = None
    country: str = "India"
    gram_panchayat: Optional[str] = None
    vikash_khand: Optional[str] = None
    full_address: Optional[str] = None
    pincode: Optional[str] = None
    # Permanent address (embedded)
    permanent_address: Optional[AddressSchema] = None
    # Legacy identity type
    identity_type: Optional[IdentityType] = None
    # KYC (full details visible to admin)
    kyc_status: KYCStatus
    kyc_remarks: Optional[str] = None
    kyc_reviewed_by: Optional[str] = None
    kyc_reviewed_at: Optional[datetime] = None
    # File URLs
    farmer_photo_url: Optional[str] = None
    id_proof_url: Optional[str] = None
    # Platform metrics
    sustainability_score: int = 0
    total_acreage: float = 0.0
    total_trees: int = 0
    carbon_credits_generated: float = 0.0
    wallet_balance: float = 0.0
    # App settings
    locale: FarmerLocale = FarmerLocale.EN
    # Status
    is_active: bool = True
    onboarding_completed: bool = False
    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AdminBankResponse(BaseModel):
    """Bank details with full (unmasked) account number and full transaction history — admin only."""
    bank_name: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_number: Optional[str] = None
    account_holder_name: Optional[str] = None
    upi_id: Optional[str] = None
    is_verified: bool = False
    added_at: Optional[datetime] = None
    transactions: Optional[list[dict]] = None


class AdminIdentityResponse(BaseModel):
    """Identity details with full (unmasked) Aadhaar and PAN — admin only."""
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    aadhaar_url: Optional[str] = None
    pan_url: Optional[str] = None
    submitted_at: Optional[datetime] = None


class UpdateIdentityRequest(BaseModel):
    """Request model to manually update / backfill farmer identity details from Admin Panel."""
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    aadhaar_url: Optional[str] = None
    pan_url: Optional[str] = None


class UpdateFarmerStatusRequest(BaseModel):
    status: FarmerAccountStatus
    reason: Optional[str] = None

    @field_validator("reason")
    @classmethod
    def strip_reason(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v else v

    @model_validator(mode="after")
    def require_reason_when_blocking(self) -> "UpdateFarmerStatusRequest":
        if self.status == FarmerAccountStatus.BLOCKED and not self.reason:
            raise ValueError("A reason is required when blocking a farmer.")
        return self


class UpdateFarmerStatusResponse(BaseModel):
    id: str
    is_active: bool
    kyc_status: KYCStatus
    message: str


class RejectRequest(BaseModel):
    kyc_remarks: Optional[str] = None

    @field_validator("kyc_remarks")
    @classmethod
    def strip_remarks(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v else v


class KYCActionResponse(BaseModel):
    id: str
    kyc_status: KYCStatus
    is_active: bool
    kyc_remarks: Optional[str] = None
    kyc_reviewed_by: Optional[str] = None
    kyc_reviewed_at: Optional[datetime] = None
    message: str
