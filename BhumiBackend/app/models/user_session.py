from typing import Optional
from datetime import datetime, timezone
from beanie import Document, Link
from pydantic import Field
from pymongo import IndexModel, ASCENDING, DESCENDING

from app.models.admin_user import AdminUser


class UserSession(Document):
    user: Link[AdminUser]
    session_token: str = Field(..., description="Unique random session identifier")
    refresh_token_id: Optional[str] = Field(default=None, description="Linked RefreshTokenSession ID")
    
    device_name: Optional[str] = Field(default="Unknown Device")
    device_type: str = Field(default="desktop", description="desktop | mobile | tablet")
    device_fingerprint: Optional[str] = Field(default=None, description="Client device browser fingerprint hash")
    
    browser: Optional[str] = None
    operating_system: Optional[str] = None
    ip_address: str
    city: Optional[str] = None
    country: Optional[str] = None
    
    is_active: bool = True
    last_activity_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "user_sessions"
        indexes = [
            IndexModel([("session_token", ASCENDING)], unique=True),
            IndexModel([("user.$id", ASCENDING), ("is_active", ASCENDING)]),
            IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0),
        ]
