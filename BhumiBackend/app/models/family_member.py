from typing import Optional
from datetime import datetime, timezone
from enum import Enum
from beanie import Document, Link
from pydantic import Field
from pymongo import IndexModel, ASCENDING

from app.models.farmer import Farmer


class Relationship(str, Enum):
    SPOUSE = "spouse"
    CHILD = "child"
    PARENT = "parent"
    SIBLING = "sibling"
    OTHER = "other"


class FamilyMember(Document):
    farmer_id: str
    farmer_ref: Optional[Link[Farmer]] = None
    
    name: str
    relationship: Relationship
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    aadhaar_number: Optional[str] = Field(default=None, pattern=r"^\d{12}$")
    mobile: Optional[str] = Field(default=None, pattern=r"^[6-9]\d{9}$")
    
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "family_members"
        indexes = [
            IndexModel([("farmer_id", ASCENDING)]),
            IndexModel([("farmer_id", ASCENDING), ("is_active", ASCENDING)]),
        ]
