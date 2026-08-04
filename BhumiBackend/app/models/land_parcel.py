from typing import Optional
from datetime import datetime, timezone
from enum import Enum
from beanie import Document
from pydantic import Field
import pydantic
from pymongo import IndexModel, ASCENDING

from app.models.cloudinary import CloudinaryAsset


class OwnershipType(str, Enum):
    OWN = "own"
    LEASED = "leased"
    SHARED = "shared"


class LandVerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    AUDITING = "auditing"

class GeoCoords(pydantic.BaseModel):
    latitude: float
    longitude: float

class LandParcel(Document):
    farmer_id: str
    survey_number: Optional[str] = None
    area_acres: float
    ownership_type: OwnershipType = OwnershipType.OWN
    is_irrigated: bool = False
    
    # Identity Verification
    belongs_to_another_person: bool = False
    fathers_name: Optional[str] = None

    # Location fields
    country: str = "India"
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    gram_panchayat: Optional[str] = None
    vikash_khand: Optional[str] = None
    tehsil: Optional[str] = None
    village: Optional[str] = None
    full_address: Optional[str] = None
    landmark: Optional[str] = None
    
    # Geo Data
    coordinates: Optional[GeoCoords] = None
    boundary_polygon: Optional[list[GeoCoords]] = None
    
    # Agricultural Data
    crop_type: Optional[str] = "Pending"
    soil_type: Optional[str] = "Unknown"
    soil_organic_carbon: float = 0.0
    tree_stock_count: Optional[int] = None
    plantation_area_acres: Optional[float] = None
    agroforestry_species: Optional[str] = None
    
    # Documents & Verification
    land_document_url: Optional[str] = None
    verification_status: LandVerificationStatus = LandVerificationStatus.PENDING
    verification_remarks: Optional[str] = None
    verified_at: Optional[datetime] = None
    
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    from pydantic import field_validator
    @field_validator("verification_status", mode="before")
    @classmethod
    def parse_verification_status(cls, v):
        if isinstance(v, str):
            v_lower = v.lower()
            if v_lower == "none":
                return LandVerificationStatus.PENDING
            return v_lower
        return v

    class Settings:
        name = "land_parcels"
        indexes = [
            IndexModel([("farmer_id", ASCENDING)]),
            IndexModel([("farmer_id", ASCENDING), ("is_active", ASCENDING)]),
            IndexModel([("verification_status", ASCENDING)]),
        ]
