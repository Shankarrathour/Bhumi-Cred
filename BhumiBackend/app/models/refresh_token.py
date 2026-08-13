from typing import Optional
from datetime import datetime, timezone, timedelta
from enum import Enum
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING

from app.config.settings import settings


class TokenOwnerType(str, Enum):
    FARMER = "farmer"
    ADMIN = "admin"
    GOVT = "govt_body"
    PARTNER = "partner"


class RefreshTokenSession(Document):
    owner_id: str           # Farmer, AdminUser or Vendor document id (str)
    owner_type: TokenOwnerType
    token_hash: str         # SHA-256 hash of the raw refresh token
    
    family_id: Optional[str] = Field(default=None, description="Token rotation family identifier")
    device_id: Optional[str] = None
    user_agent: str = ""
    ip_address: str = ""
    
    expires_at: datetime
    is_revoked: bool = False
    revoked_at: Optional[datetime] = None
    replaced_by_token: Optional[str] = None
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    class Settings:
        name = "refresh_token_sessions"
        indexes = [
            # TTL — auto-delete expired sessions
            IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0),
            IndexModel([("owner_id", ASCENDING), ("owner_type", ASCENDING)]),
            IndexModel([("token_hash", ASCENDING)], unique=True),
            IndexModel([("family_id", ASCENDING)]),
        ]

    @classmethod
    def create(
        cls,
        owner_id: str,
        owner_type: TokenOwnerType,
        token_hash: str,
        user_agent: str = "",
        ip_address: str = "",
        family_id: Optional[str] = None,
        device_id: Optional[str] = None,
    ) -> "RefreshTokenSession":
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
        return cls(
            owner_id=owner_id,
            owner_type=owner_type,
            token_hash=token_hash,
            family_id=family_id,
            device_id=device_id,
            user_agent=user_agent,
            ip_address=ip_address,
            expires_at=expires_at,
        )
