from typing import Optional
from datetime import datetime, timezone
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING

class AuditSchedule(Document):
    registration_id: str
    preferred_date: str
    preferred_time_slot: str
    landmark: Optional[str] = None
    special_instructions: Optional[str] = None
    status: str = Field(default="scheduled") # scheduled, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "audit_schedules"
        indexes = [
            IndexModel([("registration_id", ASCENDING)]),
        ]
