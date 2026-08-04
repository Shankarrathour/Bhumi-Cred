import re
from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.vendor import VendorGender
from app.validators.indian import (
    validate_aadhaar,
    validate_pan,
    validate_pincode,
    validate_driving_licence,
    validate_voter_id,
)

VENDOR_IDENTITY_TYPES = {"Aadhaar", "PAN", "Driving Licence", "Voter ID"}

# Letters and spaces only — no digits or special characters (Full Name, Father Name)
NAME_RE = re.compile(r"^[A-Za-z\s]+$")
# Letters, spaces, hyphen and dot — no digits (State, District, Tehsil, Gram Panchayat, Village/City)
ADDRESS_TEXT_RE = re.compile(r"^[A-Za-z\s\-.]+$")
# Letters, digits and spaces (Business Name)
BUSINESS_NAME_RE = re.compile(r"^[A-Za-z0-9\s]+$")

_ADDRESS_FIELD_LABELS = {
    "state": "State",
    "district": "District",
    "tehsil": "Tehsil / Block",
    "gram_panchayat": "Gram Panchayat",
    "village_city": "Village / City",
}


class VendorRegisterRequest(BaseModel):
    name: str = Field(..., max_length=100)
    email: EmailStr
    phone: str = Field(..., max_length=15)
    password: str = Field(..., min_length=8)
    business_name: str = Field(..., max_length=150)
    gst_number: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)

class VendorLoginRequest(BaseModel):
    email: EmailStr
    password: str

class VendorProfileResponse(BaseModel):
    id: str
    vendor_id: Optional[str] = None
    name: Optional[str] = None
    father_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: str
    dob: Optional[datetime] = None
    gender: Optional[VendorGender] = None
    profile_photo_url: Optional[str] = None
    business_name: Optional[str] = None
    gst_number: Optional[str] = None
    years_of_experience: Optional[int] = None
    business_description: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    tehsil: Optional[str] = None
    gram_panchayat: Optional[str] = None
    village_city: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    kyc_identity_type: Optional[str] = None
    kyc_identity_number: Optional[str] = None
    kyc_document_front_url: Optional[str] = None
    kyc_document_back_url: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_holder_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    status: str
    rejection_reason: Optional[str] = None
    wallet_balance: float
    created_at: datetime
    updated_at: datetime


class VendorWizardUpdateRequest(BaseModel):
    """Submitted once, from the Review step of the multi-step vendor
    registration wizard — collects every field gathered across all steps."""
    # Step 1: Personal Details
    name: Optional[str] = Field(None, max_length=100)
    father_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    dob: Optional[datetime] = None
    gender: Optional[VendorGender] = None

    # Step 2: Business Details
    business_name: Optional[str] = Field(None, max_length=150)
    gst_number: Optional[str] = Field(None, max_length=20)
    years_of_experience: Optional[int] = Field(None, ge=0, le=80)
    business_description: Optional[str] = Field(None, max_length=1000)

    # Step 3: Business Address
    state: Optional[str] = Field(None, max_length=100)
    district: Optional[str] = Field(None, max_length=100)
    tehsil: Optional[str] = Field(None, max_length=100)
    gram_panchayat: Optional[str] = Field(None, max_length=100)
    village_city: Optional[str] = Field(None, max_length=100)
    pincode: Optional[str] = Field(None, max_length=6)
    address: Optional[str] = Field(None, max_length=500)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)

    # Step 4: KYC
    kyc_identity_type: Optional[str] = None
    kyc_identity_number: Optional[str] = Field(None, max_length=20)

    # Bank — no longer collected by the wizard UI; kept only so the legacy
    # request shape still round-trips if ever sent by an old client build.
    bank_account_number: Optional[str] = Field(None, max_length=20)
    bank_ifsc: Optional[str] = Field(None, max_length=11)
    bank_holder_name: Optional[str] = Field(None, max_length=100)

    @field_validator("name", "father_name")
    @classmethod
    def validate_person_name(cls, v: Optional[str], info) -> Optional[str]:
        if v is not None and v.strip():
            if not NAME_RE.match(v.strip()):
                label = "Full Name" if info.field_name == "name" else "Father Name"
                raise ValueError(f"{label} cannot contain numbers.")
        return v

    @field_validator("state", "district", "tehsil", "gram_panchayat", "village_city")
    @classmethod
    def validate_address_text(cls, v: Optional[str], info) -> Optional[str]:
        if v is not None and v.strip():
            if not ADDRESS_TEXT_RE.match(v.strip()):
                label = _ADDRESS_FIELD_LABELS[info.field_name]
                raise ValueError(f"{label} cannot contain numbers.")
        return v

    @field_validator("business_name")
    @classmethod
    def validate_business_name_field(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip() and not BUSINESS_NAME_RE.match(v.strip()):
            raise ValueError("Business Name can only contain letters, numbers, and spaces.")
        return v

    @field_validator("pincode")
    @classmethod
    def validate_pincode_field(cls, v: Optional[str]) -> Optional[str]:
        return validate_pincode(v) if v else v

    @field_validator("dob")
    @classmethod
    def validate_dob_field(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is not None:
            now = datetime.now(timezone.utc)
            if v.tzinfo is None:
                v = v.replace(tzinfo=timezone.utc)
            if v > now:
                raise ValueError("Date of birth cannot be in the future.")
        return v

    @field_validator("kyc_identity_type")
    @classmethod
    def validate_identity_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VENDOR_IDENTITY_TYPES:
            raise ValueError(f"kyc_identity_type must be one of {sorted(VENDOR_IDENTITY_TYPES)}.")
        return v

    @field_validator("kyc_identity_number")
    @classmethod
    def validate_identity_number(cls, v: Optional[str], info) -> Optional[str]:
        if not v:
            return v
        identity_type = info.data.get("kyc_identity_type")
        if identity_type == "Aadhaar":
            return validate_aadhaar(v)
        if identity_type == "PAN":
            return validate_pan(v)
        if identity_type == "Driving Licence":
            return validate_driving_licence(v)
        if identity_type == "Voter ID":
            return validate_voter_id(v)
        return v


class PhotoUploadResponse(BaseModel):
    url: str
    message: str


class VendorAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    vendor: VendorProfileResponse
