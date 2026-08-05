from typing import Optional, List, Union, Dict, Any
from datetime import datetime, timezone
from enum import Enum
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field, field_validator
from pymongo import IndexModel, ASCENDING, DESCENDING

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


class GeoCoords(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)


class GeoJSONPoint(BaseModel):
    type: str = "Point"
    coordinates: List[float] = Field(..., min_items=2, max_items=2, description="[longitude, latitude]")


class GeoJSONPolygon(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]] = Field(..., description="Outer ring of [longitude, latitude] pairs")


class LandParcel(Document):
    farmer_id: Union[PydanticObjectId, str]
    khasra_number: Optional[str] = Field(None, description="Khasra / Survey Number e.g. 142/2")
    survey_number: Optional[str] = None
    area_acres: float = Field(..., gt=0)
    ownership_type: OwnershipType = OwnershipType.OWN
    is_irrigated: bool = False
    
    # Identity & Land Titling
    belongs_to_another_person: bool = False
    fathers_name: Optional[str] = None

    # Location & Administrative Hierarchy
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
    
    # Geo Data & Spatial Boundaries (Supports both Legacy GeoCoords List & GeoJSON)
    location_point: Optional[GeoJSONPoint] = None
    boundary_polygon: Optional[Any] = None
    coordinates: Optional[GeoCoords] = None
    
    # Agricultural & Ecological Data
    crop_type: Optional[str] = "Agroforestry"
    soil_type: Optional[str] = "Black Cotton Soil"
    soil_organic_carbon: float = Field(default=0.0, ge=0.0)
    tree_stock_count: Optional[int] = Field(default=0, ge=0)
    plantation_area_acres: Optional[float] = Field(default=0.0, ge=0.0)
    agroforestry_species: Optional[str] = None
    
    # Documents & Verification
    land_document_url: Optional[str] = None
    verification_status: LandVerificationStatus = LandVerificationStatus.PENDING
    verification_remarks: Optional[str] = None
    verified_by_id: Optional[PydanticObjectId] = None
    verified_at: Optional[datetime] = None
    
    is_active: bool = True

    # Audit & Security Fields
    created_by_id: Optional[PydanticObjectId] = None
    updated_by_id: Optional[PydanticObjectId] = None

    # Soft Delete Support
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by_id: Optional[PydanticObjectId] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("verification_status", mode="before")
    @classmethod
    def parse_verification_status(cls, v):
        if isinstance(v, str):
            v_lower = v.lower()
            if v_lower == "none":
                return LandVerificationStatus.PENDING
            return v_lower
        return v

    async def soft_delete(self, deleted_by: Optional[PydanticObjectId] = None):
        """Soft delete land parcel."""
        self.is_deleted = True
        self.is_active = False
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by_id = deleted_by
        self.updated_at = datetime.now(timezone.utc)
        await self.save()

    class Settings:
        name = "land_parcels"
        indexes = [
            IndexModel([("farmer_id", ASCENDING)]),
            IndexModel([("farmer_id", ASCENDING), ("is_active", ASCENDING)]),
            IndexModel([("verification_status", ASCENDING)]),
            IndexModel([("is_deleted", ASCENDING), ("is_active", ASCENDING)]),
            IndexModel([("state", ASCENDING), ("district", ASCENDING)]),
            IndexModel([("location_point", "2dsphere")], sparse=True)
        ]
