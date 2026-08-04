from typing import Optional
from datetime import datetime, timezone
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class Milestone(Document):
    farmer_id: str
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    badge_text: Optional[str] = None
    badge_type: Optional[str] = None  # e.g., "npk_active", "subsidies", "biomass", "cash"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "milestones"
        indexes = [
            IndexModel([("farmer_id", ASCENDING)]),
            IndexModel([("farmer_id", ASCENDING), ("created_at", ASCENDING)]),
        ]
