from datetime import datetime, timezone
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING

from typing import Optional

class AgriApplication(Document):
    user_id: str
    scheme_id: str
    status: str = "DRAFT"
    current_step: str = "QUESTIONNAIRE"
    application_reference: Optional[str] = None
    submitted_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "agri_applications"
        indexes = [
            IndexModel([("user_id", ASCENDING)]),
            IndexModel([("scheme_id", ASCENDING)]),
            IndexModel([("user_id", ASCENDING), ("scheme_id", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
        ]
