from typing import Optional, List
from datetime import datetime, timezone
from beanie import Document
from pymongo import IndexModel, ASCENDING, DESCENDING
import pydantic

class GeoCoords(pydantic.BaseModel):
    latitude: float
    longitude: float

class TreeDetail(pydantic.BaseModel):
    species: str
    age: str
    health: str
    hasPhoto: bool
    photo_url: Optional[str] = None

class GreenFamilyCover(Document):
    farmer_id: str
    cluster_size: int
    plantation_configuration: str
    geo_coords: Optional[GeoCoords] = None
    trees_details: List[TreeDetail] = []
    
    plan_id: str
    plan_name: str
    premium_amount: float
    cover_amount: float
    
    status: str = "Pending" # Pending, Verified, Rejected
    certificate_url: Optional[str] = None
    
    created_at: datetime = pydantic.Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = pydantic.Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "green_family_covers"
        indexes = [
            IndexModel([("farmer_id", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
        ]
