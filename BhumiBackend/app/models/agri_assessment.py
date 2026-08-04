from typing import Dict, Any
from datetime import datetime, timezone
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING

class AgriAssessment(Document):
    application_id: str
    submitted_answers: Dict[str, Any]
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "agri_assessments"
        indexes = [
            IndexModel([("application_id", ASCENDING)]),
        ]
