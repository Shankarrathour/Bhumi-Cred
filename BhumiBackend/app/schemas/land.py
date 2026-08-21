from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.land_parcel import LandVerificationStatus, OwnershipType, GeoCoords, TreeItem

class LandHistoryEvent(BaseModel):
    title: str
    desc: str
    date: datetime


class CreateLandParcelRequest(BaseModel):
    name: Optional[str] = None
    khasra_number: Optional[str] = None
    survey_number: Optional[str] = None
    area_acres: float = Field(..., gt=0, description="Area in acres, must be positive.")
    area_unit: Optional[str] = "Acre"
    ownership_type: OwnershipType = OwnershipType.OWN
    plantation_date: Optional[str] = None
    is_irrigated: bool = False
    
    belongs_to_another_person: bool = False
    fathers_name: Optional[str] = None
    
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
    
    coordinates: Optional[GeoCoords] = None
    boundary_polygon: Optional[list[GeoCoords]] = None
    
    land_type: Optional[str] = None
    crop_type: Optional[str] = "Pending"
    soil_type: Optional[str] = "Unknown"
    tree_stock_count: Optional[int] = None
    plantation_area_acres: Optional[float] = None
    agroforestry_species: Optional[str] = None
    trees: Optional[list[TreeItem]] = None
    
    land_document_url: Optional[str] = None
    land_photo_urls: Optional[list[str]] = None


class UpdateLandParcelRequest(BaseModel):
    name: Optional[str] = None
    khasra_number: Optional[str] = None
    survey_number: Optional[str] = None
    area_acres: Optional[float] = Field(None, gt=0)
    area_unit: Optional[str] = None
    ownership_type: Optional[OwnershipType] = None
    plantation_date: Optional[str] = None
    is_irrigated: Optional[bool] = None
    
    country: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    gram_panchayat: Optional[str] = None
    vikash_khand: Optional[str] = None
    tehsil: Optional[str] = None
    village: Optional[str] = None
    full_address: Optional[str] = None
    landmark: Optional[str] = None
    
    coordinates: Optional[GeoCoords] = None
    boundary_polygon: Optional[list[GeoCoords]] = None
    
    land_type: Optional[str] = None
    crop_type: Optional[str] = None
    soil_type: Optional[str] = None
    
    land_document_url: Optional[str] = None
    land_photo_urls: Optional[list[str]] = None


class LandParcelResponse(BaseModel):
    id: str
    name: Optional[str] = None
    khasra_number: Optional[str] = None
    survey_number: Optional[str] = None
    area_acres: float = 0.0
    area_unit: Optional[str] = "Acre"
    ownership_type: OwnershipType = OwnershipType.OWN
    plantation_date: Optional[str] = None
    is_irrigated: bool = False
    
    belongs_to_another_person: bool = False
    fathers_name: Optional[str] = None
    
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
    
    coordinates: Optional[GeoCoords] = None
    boundary_polygon: Optional[list[GeoCoords]] = None
    
    land_type: Optional[str] = None
    crop_type: Optional[str] = None
    soil_type: Optional[str] = None
    soil_organic_carbon: float = 0.0
    tree_stock_count: Optional[int] = None
    plantation_area_acres: Optional[float] = None
    agroforestry_species: Optional[str] = None
    trees: list[TreeItem] = Field(default_factory=list)
    
    land_document_url: Optional[str] = None
    land_photo_urls: list[str] = Field(default_factory=list)
    verification_status: LandVerificationStatus = LandVerificationStatus.PENDING
    verification_remarks: Optional[str] = None
    correction_fields: Optional[list[str]] = None
    verified_at: Optional[datetime] = None
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

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
    
    model_config = {"from_attributes": True}


class LandSummaryResponse(BaseModel):
    parcels: list[LandParcelResponse]
    total_area_acres: float
    irrigated_area_acres: float
    non_irrigated_area_acres: float
    total_parcels: int


class AdminLandVerificationItem(BaseModel):
    id: str
    farmer_id: str
    farmer_public_id: Optional[str] = None
    farmer_name: Optional[str] = None
    farmer_mobile: str
    khasra_number: Optional[str] = None
    survey_number: Optional[str] = None
    area_acres: float
    ownership_type: OwnershipType
    is_irrigated: bool
    
    belongs_to_another_person: bool = False
    fathers_name: Optional[str] = None
    
    country: Optional[str] = "India"
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    gram_panchayat: Optional[str] = None
    vikash_khand: Optional[str] = None
    tehsil: Optional[str] = None
    village: Optional[str] = None
    full_address: Optional[str] = None
    landmark: Optional[str] = None
    
    coordinates: Optional[GeoCoords] = None
    boundary_polygon: Optional[list[GeoCoords]] = None
    
    crop_type: Optional[str] = None
    soil_type: Optional[str] = None
    soil_organic_carbon: float = 0.0
    tree_stock_count: Optional[int] = None
    plantation_area_acres: Optional[float] = None
    agroforestry_species: Optional[str] = None
    trees: list[TreeItem] = Field(default_factory=list)
    
    land_document_url: Optional[str] = None
    land_photo_urls: list[str] = []
    verification_status: LandVerificationStatus
    verification_remarks: Optional[str] = None
    correction_fields: Optional[list[str]] = None
    verified_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    assigned_project: Optional[str] = None
    assigned_project_id: Optional[str] = None
    history: list[LandHistoryEvent] = []

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


class AdminLandVerificationRequest(BaseModel):
    status: LandVerificationStatus
    remarks: Optional[str] = None
