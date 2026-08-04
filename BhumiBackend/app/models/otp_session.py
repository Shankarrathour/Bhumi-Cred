from datetime import datetime, timezone, timedelta
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING

from app.config.settings import settings


class OTPSession(Document):
    mobile: str
    role: str = "farmer"  # "farmer" | "vendor" — scopes OTP lookups per role
    otp_hash: str       # bcrypt hash of the OTP
    expires_at: datetime
    verified: bool = False
    attempts: int = 0   # failed attempt counter
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    class Settings:
        name = "otp_sessions"
        indexes = [
            # MongoDB TTL index — deletes document when expires_at is reached
            IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0),
            IndexModel([("mobile", ASCENDING)]),
            IndexModel([("mobile", ASCENDING), ("role", ASCENDING)]),
        ]

    @classmethod
    def create_for_mobile(cls, mobile: str, otp_hash: str, role: str = "farmer") -> "OTPSession":
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.OTP_EXPIRE_MINUTES
        )
        return cls(mobile=mobile, role=role, otp_hash=otp_hash, expires_at=expires_at)
