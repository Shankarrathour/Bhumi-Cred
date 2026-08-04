from typing import Optional
from datetime import datetime, timezone
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class PasswordResetToken(Document):
    user_id: str = Field(..., description="ID of admin user requesting reset")
    email: str
    token_hash: str = Field(..., description="SHA-256 hash of single-use reset token")
    is_used: bool = False
    used_at: Optional[datetime] = None
    request_ip: str
    
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "password_reset_tokens"
        indexes = [
            IndexModel([("token_hash", ASCENDING)], unique=True),
            IndexModel([("user_id", ASCENDING)]),
            IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0),
        ]
