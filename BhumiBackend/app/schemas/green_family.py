from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class GeoCoords(BaseModel):
    latitude: float
    longitude: float

class TreeDetail(BaseModel):
    species: str
    age: str
    health: str
    hasPhoto: bool
    photo_url: Optional[str] = None

class CreateGreenFamilyRequest(BaseModel):
    cluster_size: int
    plantation_configuration: str
    geo_coords: GeoCoords
    trees_details: List[TreeDetail]
    plan_id: str
    plan_name: str
    premium_amount: float
    cover_amount: float

class GreenFamilyResponse(BaseModel):
    id: str
    farmer_id: str
    cluster_size: int
    plantation_configuration: str
    geo_coords: Optional[GeoCoords]
    trees_details: List[TreeDetail]
    plan_id: str
    plan_name: str
    premium_amount: float
    cover_amount: float
    status: str
    certificate_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    farmer_details: Optional[dict] = None

    class Config:
        from_attributes = True

class AdminUpdateGreenFamilyStatusRequest(BaseModel):
    status: str # Verified, Rejected
