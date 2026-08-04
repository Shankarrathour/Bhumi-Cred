from typing import Optional
from datetime import datetime, timezone
from enum import Enum
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING

class PlanType(str, Enum):
    SINGLE_TREE = "single_tree"
    GREEN_FAMILY = "green_family"

class TreePlan(Document):
    plan_type: PlanType
    plan_name: str
    price: float
    billing_cycle: str
    cover: float
    badge_text: str
    badge_color: str
    description: str = Field(max_length=200)
    priority: int = 0
    is_active: bool = True
    is_recommended: bool = False
    icon: Optional[str] = None
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    class Settings:
        name = "tree_plans"
        indexes = [
            IndexModel([("plan_type", ASCENDING)]),
            IndexModel([("is_active", ASCENDING)]),
            IndexModel([("priority", ASCENDING)]),
        ]
