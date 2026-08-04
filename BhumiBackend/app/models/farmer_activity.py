from typing import Optional, Dict, Any
from datetime import datetime, timezone
from beanie import Document, Link
from pydantic import Field
from pymongo import IndexModel, ASCENDING, DESCENDING

from app.models.farmer import Farmer


class FarmerActivityLog(Document):
    farmer_id: str
    farmer_ref: Optional[Link[Farmer]] = None
    
    activity_type: str = Field(..., description="e.g. REGISTERED, KYC_UPLOADED, LAND_ADDED, APPROVED, PROJECT_ASSIGNED, CARBON_GENERATED, WITHDRAWAL")
    title: str
    description: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    performed_by_id: Optional[str] = None
    performed_by_role: Optional[str] = None
    
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "farmer_activity_logs"
        indexes = [
            IndexModel([("farmer_id", ASCENDING), ("timestamp", DESCENDING)]),
            IndexModel([("activity_type", ASCENDING)]),
            IndexModel([("timestamp", DESCENDING)]),
        ]
