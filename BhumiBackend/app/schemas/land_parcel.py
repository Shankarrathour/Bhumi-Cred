from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from beanie import PydanticObjectId
from app.models.land_parcel import OwnershipType, LandVerificationStatus, GeoCoords, GeoJSONPoint, GeoJSONPolygon


class LandParcelCreateSchema(BaseModel):
    farmer_id: PydanticObjectId
    khasra_number: Optional[str] = Field(None, description="Khasra / Survey Number e.g. 142/2")
    survey_number: Optional[str] = None
    area_acres: float = Field(..., gt=0)
    ownership_type: OwnershipType = OwnershipType.OWN
    is_irrigated: bool = False
    state: str
    district: str
    tehsil: Optional[str] = None
    village: str
    location_point: Optional[GeoJSONPoint] = None
    boundary_polygon: Optional[GeoJSONPolygon] = None
    coordinates: Optional[GeoCoords] = None
    crop_type: Optional[str] = "Agroforestry"
    soil_type: Optional[str] = "Black Cotton Soil"
    tree_stock_count: Optional[int] = Field(default=0, ge=0)


class LandParcelUpdateSchema(BaseModel):
    khasra_number: Optional[str] = None
    area_acres: Optional[float] = Field(None, gt=0)
    ownership_type: Optional[OwnershipType] = None
    is_irrigated: Optional[bool] = None
    crop_type: Optional[str] = None
    soil_type: Optional[str] = None
    tree_stock_count: Optional[int] = Field(None, ge=0)
    plantation_area_acres: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None


class LandParcelResponseSchema(BaseModel):
    id: str
    farmer_id: PydanticObjectId
    khasra_number: Optional[str] = None
    survey_number: Optional[str] = None
    area_acres: float
    ownership_type: OwnershipType
    is_irrigated: bool
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    location_point: Optional[GeoJSONPoint] = None
    boundary_polygon: Optional[GeoJSONPolygon] = None
    crop_type: Optional[str] = None
    soil_type: Optional[str] = None
    tree_stock_count: Optional[int] = None
    verification_status: LandVerificationStatus
    is_active: bool
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
