from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr, field_validator

from app.models.farmer import KYCStatus, FarmerLocale, Gender, FarmerCategory, Education


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    father_name: Optional[str] = None
    dob: Optional[datetime] = None
    gender: Optional[Gender] = None
    category: Optional[FarmerCategory] = None
    education: Optional[Education] = None
    occupation: Optional[str] = None
    email: Optional[EmailStr] = None
    locale: Optional[FarmerLocale] = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 2:
                raise ValueError("Name must be at least 2 characters.")
        return v

    @field_validator("dob")
    @classmethod
    def validate_dob(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is not None:
            now = datetime.now(timezone.utc)
            if v.tzinfo is None:
                v = v.replace(tzinfo=timezone.utc)
            if v > now:
                raise ValueError("Date of birth cannot be in the future.")
            if (now - v).days < 18 * 365:
                raise ValueError("Farmer must be at least 18 years old.")
        return v


class FarmerProfileResponse(BaseModel):
    id: str
    farmer_id: Optional[str] = None
    mobile: str
    full_name: Optional[str] = None
    father_name: Optional[str] = None
    dob: Optional[datetime] = None
    gender: Optional[Gender] = None
    category: Optional[FarmerCategory] = None
    education: Optional[Education] = None
    occupation: Optional[str] = None
    email: Optional[EmailStr] = None
    farmer_photo_url: Optional[str] = None
    kyc_status: KYCStatus
    is_active: bool
    onboarding_completed: bool
    locale: FarmerLocale
    wallet_balance: float
    sustainability_score: int
    total_acreage: float
    total_trees: int
    carbon_credits_generated: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PhotoUploadResponse(BaseModel):
    url: str
    message: str
