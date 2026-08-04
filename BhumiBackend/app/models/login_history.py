from typing import Optional
from datetime import datetime, timezone
from enum import Enum
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING, DESCENDING


class LoginStatus(str, Enum):
    SUCCESS = "success"
    FAILED_INVALID_PASSWORD = "failed_invalid_password"
    FAILED_USER_NOT_FOUND = "failed_user_not_found"
    FAILED_USER_SUSPENDED = "failed_user_suspended"
    FAILED_MFA_INVALID = "failed_mfa_invalid"


class LoginHistory(Document):
    user_id: Optional[str] = Field(default=None, description="AdminUser or User ID if identified")
    attempted_email: str
    status: LoginStatus
    failure_reason: Optional[str] = None
    
    ip_address: str
    user_agent: str
    city: Optional[str] = None
    country: Optional[str] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "login_histories"
        indexes = [
            IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)]),
            IndexModel([("attempted_email", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
        ]
