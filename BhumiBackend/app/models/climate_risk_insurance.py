from typing import Optional, List
from datetime import datetime, timezone
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class ClimateRiskInsuranceCard(Document):
    """
    Admin-managed content for the Farmer App's Add Land → Step 6 → Climate
    Risk Tree Insurance screen. Independent from TreePlan/tree_plans — that
    collection backs a separate, unrelated CMS module.
    """
    title: str
    subtitle: Optional[str] = None
    description: str
    features: List[str] = Field(default_factory=list)
    price: float
    button_text: Optional[str] = None
    badge: Optional[str] = None
    display_order: int = 0
    is_active: bool = True

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    class Settings:
        name = "climate_risk_insurance_cards"
        indexes = [
            IndexModel([("is_active", ASCENDING)]),
            IndexModel([("display_order", ASCENDING)]),
        ]
