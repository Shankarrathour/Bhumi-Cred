from datetime import datetime, timezone
from typing import Optional
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class FarmerReferral(Document):
    referral_code: str
    referrer_farmer_id: str
    referred_farmer_id: Optional[str] = None
    referred_farmer_name: str
    referred_farmer_phone: str
    referred_farmer_village: Optional[str] = "Bhopal, MP"
    status: str = "verified"  # "verified", "pending"
    cash_reward: float = 500.0
    carbon_reward_tco2e: float = 10.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "farmer_referrals"
        indexes = [
            IndexModel([("referrer_farmer_id", ASCENDING)]),
            IndexModel([("referral_code", ASCENDING)]),
        ]
