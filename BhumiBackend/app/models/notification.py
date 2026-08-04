from pydantic import Field
from typing import Optional
from datetime import datetime, timezone
from beanie import Document
from bson import ObjectId
from pymongo import ASCENDING, IndexModel

class Notification(Document):
    farmer_id: Optional[str] = None
    vendor_id: Optional[str] = None
    title: str
    message: str
    type: str = 'system'
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Admin Notification Center — a separate audience from the per-farmer/per-vendor
    # feeds above. When is_admin is True, farmer_id/vendor_id stay unset (this is a
    # shared feed all admins see, not delivered to one specific user) and actor_type
    # records whether the underlying activity was a Farmer or Vendor action.
    is_admin: bool = False
    actor_type: Optional[str] = None

    class Settings:
        name = "notifications"
        indexes = [
            IndexModel([("farmer_id", ASCENDING)]),
            IndexModel([("vendor_id", ASCENDING)]),
            IndexModel([("is_admin", ASCENDING)]),
        ]
