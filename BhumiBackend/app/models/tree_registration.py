from typing import Optional
from datetime import datetime, timezone
from enum import Enum
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING, DESCENDING

from app.models.cloudinary import CloudinaryAsset


class TreeRegistrationStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"


class TreeRegistration(Document):
    farmer_id: str
    tree_name: str
    tree_species: str
    tree_count: int
    tree_age: int
    plantation_year: int
    land_id: Optional[str] = None
    latitude: float
    longitude: float
    village: str
    district: str
    state: str
    photos: list[str] = Field(default_factory=list)
    photo_assets: list[CloudinaryAsset] = Field(default_factory=list)
    insurance_required: bool = False
    remarks: Optional[str] = None
    status: TreeRegistrationStatus = TreeRegistrationStatus.PENDING
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    class Settings:
        name = "tree_registrations"
        indexes = [
            IndexModel([("farmer_id", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
        ]
