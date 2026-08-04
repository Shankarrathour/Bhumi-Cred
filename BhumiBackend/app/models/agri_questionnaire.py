from typing import Optional, List
from datetime import datetime, timezone
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING

class AgriQuestionnaire(Document):
    scheme_id: str
    question: str
    description: Optional[str] = None
    field_key: str
    field_type: str  # text, textarea, number, dropdown, radio, checkbox, boolean
    options: List[str] = Field(default_factory=list)
    placeholder: Optional[str] = None
    required: bool = True
    validation: Optional[str] = None
    display_order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "agri_questionnaires"
        indexes = [
            IndexModel([("scheme_id", ASCENDING)]),
            IndexModel([("scheme_id", ASCENDING), ("is_active", ASCENDING)]),
            IndexModel([("display_order", ASCENDING)]),
        ]
