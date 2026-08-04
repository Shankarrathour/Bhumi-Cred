from datetime import datetime, timezone
from enum import Enum

from beanie import Document
from pydantic import Field
from pymongo import ASCENDING, IndexModel


class SustainabilityProjectStatus(str, Enum):
    AVAILABLE = "available"
    ACTIVE_TRACKING = "active_tracking"
    PAUSED = "paused"
    COMPLETED = "completed"


class SustainabilityProject(Document):
    project_id: str = Field(..., min_length=3, max_length=120)
    title: str = Field(..., min_length=3, max_length=160)
    category: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=10, max_length=1000)
    district: str = Field(..., min_length=2, max_length=80)
    state: str = Field(..., min_length=2, max_length=80)
    target_area_acres: float = Field(..., gt=0)
    estimated_carbon_impact: float = Field(..., ge=0)
    ngo_partner: str | None = Field(None, max_length=160)
    status: SustainabilityProjectStatus = SustainabilityProjectStatus.AVAILABLE
    eligibility: list[str] = Field(default_factory=list)
    required_documents: list[str] = Field(default_factory=list)
    is_public: bool = True
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "projects"
        indexes = [
            IndexModel([("project_id", ASCENDING)], unique=True),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("state", ASCENDING), ("district", ASCENDING)]),
            IndexModel([("is_public", ASCENDING), ("is_active", ASCENDING)]),
        ]
