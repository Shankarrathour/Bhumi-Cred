from datetime import datetime, timezone
from typing import Optional
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING

class AgriApplicationTimeline(Document):
    application_id: str
    status: str
    step: str
    title: str
    description: str
    performed_by: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Optional[dict] = None

    class Settings:
        name = "agri_application_timelines"
        indexes = [
            IndexModel([("application_id", ASCENDING)]),
            IndexModel([("application_id", ASCENDING), ("timestamp", ASCENDING)])
        ]
