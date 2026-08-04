from typing import Optional
from datetime import datetime, timezone
from enum import Enum
from beanie import Document
from pydantic import Field, EmailStr
from pymongo import IndexModel, ASCENDING

from app.models.cloudinary import CloudinaryAsset


class VendorGender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class Vendor(Document):
    # Human-readable public identifier (e.g. "VEN-000028"), auto-generated at
    # registration. Optional because records created before this field existed
    # won't have it until the backfill migration runs. _id remains the sole
    # internal identifier for all database relationships.
    vendor_id: Optional[str] = None

    # ── Personal Details (Wizard Step 1) ────────────────────────────────────
    name: Optional[str] = None
    father_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: str
    password_hash: Optional[str] = None
    dob: Optional[datetime] = None
    gender: Optional[VendorGender] = None
    profile_photo_url: Optional[str] = None
    profile_photo_asset: Optional[CloudinaryAsset] = None

    # ── Business Details (Wizard Step 2) ────────────────────────────────────
    store_name: Optional[str] = None
    business_name: Optional[str] = None
    gst_number: Optional[str] = None
    years_of_experience: Optional[int] = None
    business_description: Optional[str] = None

    # ── Business Address (Wizard Step 3) ────────────────────────────────────
    address: Optional[str] = None  # Complete Address (free text)
    state: Optional[str] = None
    district: Optional[str] = None
    tehsil: Optional[str] = None
    gram_panchayat: Optional[str] = None
    village_city: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    # KYC — collected by the multi-step vendor registration wizard (Step 4)
    kyc_identity_type: Optional[str] = None    # "Aadhaar" | "PAN" | "Driving Licence" | "Voter ID"
    kyc_identity_number: Optional[str] = None
    kyc_document_front_url: Optional[str] = None
    kyc_document_back_url: Optional[str] = None  # Aadhaar back only; optional
    kyc_document_front_asset: Optional[CloudinaryAsset] = None
    kyc_document_back_asset: Optional[CloudinaryAsset] = None

    # Bank details — kept for backward compatibility with the legacy wizard
    # step and email/password register flow; no longer collected by the UI.
    bank_account_number: Optional[str] = None  # e.g. ******1234
    bank_ifsc: Optional[str] = None
    bank_holder_name: Optional[str] = None

    is_active: bool = True
    is_verified: bool = False
    
    status: str = Field(default="Pending") # Pending, Active, Rejected, Suspended
    rejection_reason: Optional[str] = None
    wallet_balance: float = Field(default=0.0)
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "vendors"
        indexes = [
            # partialFilterExpression (not sparse) — sparse only excludes documents
            # where the field is *missing*, not documents where it's explicitly null.
            # OTP-first vendor stubs always set email=None explicitly, so a plain
            # sparse index would still collide across multiple such documents.
            IndexModel(
                [("email", ASCENDING)],
                unique=True,
                partialFilterExpression={"email": {"$type": "string"}},
            ),
            IndexModel([("phone", ASCENDING)], unique=True, sparse=True),
            # sparse: legacy records predating this field simply omit the key,
            # rather than colliding on a shared null/missing value.
            IndexModel([("vendor_id", ASCENDING)], unique=True, sparse=True),
            IndexModel([("is_active", ASCENDING)]),
            IndexModel([("created_at", ASCENDING)]),
        ]
