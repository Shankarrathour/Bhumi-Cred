from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field, EmailStr
from pymongo import IndexModel, ASCENDING, DESCENDING

from app.models.cloudinary import CloudinaryAsset


class KYCStatus(str, Enum):
    UNVERIFIED = "unverified"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    BLOCKED = "blocked"
    SUSPENDED = "suspended"


class IdentityType(str, Enum):
    AADHAAR = "Aadhaar"
    PAN = "PAN"


class FarmerLocale(str, Enum):
    EN = "en"
    HI = "hi"


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class FarmerCategory(str, Enum):
    GENERAL = "general"
    SC = "sc"
    ST = "st"
    OBC = "obc"


class Education(str, Enum):
    ILLITERATE = "illiterate"
    PRIMARY = "primary"
    SECONDARY = "secondary"
    HIGHER_SECONDARY = "higher_secondary"
    GRADUATE = "graduate"
    POST_GRADUATE = "post_graduate"


# ── Embedded Sub-Documents ───────────────────────────────────────────────────

class Address(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    tehsil: Optional[str] = None
    block: Optional[str] = None
    gram_panchayat: Optional[str] = None
    village: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = Field(default=None, pattern=r"^\d{6}$")
    full_address: Optional[str] = None


class BankDetails(BaseModel):
    bank_name: Optional[str] = None
    branch_name: Optional[str] = None
    account_number: Optional[str] = Field(default=None, pattern=r"^\d{9,18}$")
    account_holder_name: Optional[str] = None
    ifsc_code: Optional[str] = Field(default=None, pattern=r"^[A-Z]{4}0[A-Z0-9]{6}$")
    passbook_doc_url: Optional[str] = None
    is_verified: bool = False
    added_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None


class IdentityDetails(BaseModel):
    aadhaar_number: Optional[str] = Field(default=None, pattern=r"^\d{12}$")
    pan_number: Optional[str] = Field(default=None, pattern=r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")
    aadhaar_url: Optional[str] = None
    aadhaar_front_url: Optional[str] = None
    aadhaar_back_url: Optional[str] = None
    pan_url: Optional[str] = None
    pan_card_url: Optional[str] = None
    aadhaar_asset: Optional[CloudinaryAsset] = None
    pan_asset: Optional[CloudinaryAsset] = None
    submitted_at: Optional[datetime] = None
    is_aadhaar_verified: bool = False
    is_pan_verified: bool = False


class FarmerDocuments(BaseModel):
    profile_photo_url: Optional[str] = None
    khatauni_doc_url: Optional[str] = None
    land_possession_doc_url: Optional[str] = None
    other_docs: List[str] = Field(default_factory=list)


# ── Main Farmer Document ─────────────────────────────────────────────────────

class Farmer(Document):
    mobile: str = Field(..., pattern=r"^[6-9]\d{9}$", description="10-digit Indian Mobile")
    farmer_id: Optional[str] = Field(default=None, description="Public Unique ID (e.g. FAR-000145)")
    role: str = Field(default="farmer")
    full_name: Optional[str] = None
    father_name: Optional[str] = None
    dob: Optional[datetime] = None
    email: Optional[EmailStr] = None

    gender: Optional[Gender] = None
    category: Optional[FarmerCategory] = None
    education: Optional[Education] = None
    occupation: Optional[str] = "Agriculture"

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

    current_address: Optional[Address] = None
    permanent_address: Optional[Address] = None

    identity_type: Optional[IdentityType] = None
    identity_number: Optional[str] = None
    identity_details: Optional[IdentityDetails] = None

    farmer_photo_url: Optional[str] = None
    id_proof_url: Optional[str] = None
    farmer_photo_asset: Optional[CloudinaryAsset] = None

    bank_details: Optional[BankDetails] = None
    documents: Optional[FarmerDocuments] = None

    # KYC Status & Verification History
    kyc_status: KYCStatus = KYCStatus.UNVERIFIED
    kyc_remarks: Optional[str] = None
    kyc_reviewed_by: Optional[str] = None
    kyc_reviewed_at: Optional[datetime] = None

    # Platform Summaries & Denormalized Metrics
    sustainability_score: int = Field(default=0, ge=0, le=100)
    total_acreage: float = 0.0
    total_trees: int = 0
    carbon_credits_generated: float = 0.0
    wallet_balance: float = 0.0

    fcm_token: Optional[str] = None
    locale: FarmerLocale = FarmerLocale.EN
    is_active: bool = True
    onboarding_completed: bool = False

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
        """Soft delete farmer account."""
        self.is_deleted = True
        self.is_active = False
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by_id = deleted_by
        self.updated_at = datetime.now(timezone.utc)
        await self.save()

    class Settings:
        name = "farmers"
        indexes = [
            IndexModel([("mobile", ASCENDING)], unique=True),
            IndexModel([("farmer_id", ASCENDING)], unique=True, sparse=True),
            IndexModel([("kyc_status", ASCENDING)]),
            IndexModel([("state", ASCENDING), ("district", ASCENDING)]),
            IndexModel([("is_deleted", ASCENDING), ("is_active", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
            IndexModel([("full_name", "text"), ("mobile", "text"), ("farmer_id", "text")])
        ]
