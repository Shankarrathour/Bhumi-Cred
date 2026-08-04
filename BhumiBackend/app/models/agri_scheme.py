from typing import Optional
from datetime import datetime, timezone
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING

class AgriScheme(Document):
    title: str
    slug: str
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    ministry: Optional[str] = None
    short_description: str
    description: Optional[str] = None
    benefits: list[str] = Field(default_factory=list)
    eligibility_summary: list[str] = Field(default_factory=list)
    required_documents: list[str] = Field(default_factory=list)
    official_link: Optional[str] = None
    benefit_type: str
    benefit_amount: str
    interest_rate: Optional[str] = None
    deadline: Optional[datetime] = None
    thumbnail: Optional[str] = None
    status: str = "Active"
    is_active: bool = True
    display_order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "agri_schemes"
        indexes = [
            IndexModel([("title", ASCENDING)], unique=True),
            IndexModel([("slug", ASCENDING)], unique=True),
            IndexModel([("category_id", ASCENDING)]),
            IndexModel([("display_order", ASCENDING)]),
            IndexModel([("is_active", ASCENDING)]),
        ]
