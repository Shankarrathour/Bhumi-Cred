from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from app.models.land_parcel import OwnershipType, GeoCoords

class AdminLandParcelResponse(BaseModel):
    id: str
    farmer_id: str
    farmer_name: str
    survey_number: Optional[str] = None
    area_acres: float
    ownership_type: OwnershipType
    is_irrigated: bool
    
    country: str
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
    soil_organic_carbon: float
    
    land_document_url: Optional[str] = None
    land_photo_urls: Optional[list[str]] = None
    trees: Optional[list[dict]] = None
    verification_status: str
    remarks: Optional[str] = None
    verified_date: Optional[datetime] = None
    
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

