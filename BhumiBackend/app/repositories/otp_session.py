from typing import Optional
from datetime import datetime, timezone

from app.models.otp_session import OTPSession
from app.repositories.base import BaseRepository


class OTPSessionRepository(BaseRepository[OTPSession]):
    def __init__(self):
        super().__init__(OTPSession)

    async def get_active_for_mobile(self, mobile: str, role: str = "farmer") -> Optional[OTPSession]:
        """Return the most recent un-expired, unverified OTP for a mobile, scoped by role."""
        now = datetime.now(timezone.utc)
        return await (
            OTPSession.find(
                OTPSession.mobile == mobile,
                OTPSession.role == role,
                OTPSession.verified == False,
                OTPSession.expires_at > now,
            )
            .sort("-created_at")
            .first_or_none()
        )

    async def increment_attempts(self, session: OTPSession) -> OTPSession:
        session.attempts += 1
        await session.save()
        return session

    async def mark_verified(self, session: OTPSession) -> OTPSession:
        session.verified = True
        await session.save()
        return session

    async def invalidate_all_for_mobile(self, mobile: str, role: str = "farmer") -> None:
        """Mark all existing OTP sessions for a mobile+role as verified (consumed)."""
        sessions = await OTPSession.find(
            OTPSession.mobile == mobile, OTPSession.role == role
        ).to_list()
        for s in sessions:
            s.verified = True
            await s.save()
