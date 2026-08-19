from datetime import datetime, timezone
from typing import Optional
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class FarmerBadge(Document):
    farmer_id: str
    badge_code: str  # "land_owner", "agro_hero", "plant_champion", "carbon_pioneer", "eco_networker"
    title: str
    level: int = 1
    description: str
    icon: str
    is_unlocked: bool = True
    unlocked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    unlocked_reason: Optional[str] = None

    class Settings:
        name = "farmer_badges"
        indexes = [
            IndexModel([("farmer_id", ASCENDING)]),
            IndexModel([("badge_code", ASCENDING)]),
        ]
