from typing import Optional
from datetime import datetime, timezone

from app.models.refresh_token import RefreshTokenSession, TokenOwnerType
from app.repositories.base import BaseRepository


class RefreshTokenRepository(BaseRepository[RefreshTokenSession]):
    def __init__(self):
        super().__init__(RefreshTokenSession)

    async def get_by_hash(self, token_hash: str) -> Optional[RefreshTokenSession]:
        return await RefreshTokenSession.find_one(
            RefreshTokenSession.token_hash == token_hash,
            RefreshTokenSession.is_revoked == False,
        )

    async def get_active_by_hash(self, token_hash: str) -> Optional[RefreshTokenSession]:
        now = datetime.now(timezone.utc)
        return await RefreshTokenSession.find_one(
            RefreshTokenSession.token_hash == token_hash,
            RefreshTokenSession.is_revoked == False,
            RefreshTokenSession.expires_at > now,
        )

    async def revoke(self, session: RefreshTokenSession) -> None:
        session.is_revoked = True
        await session.save()

    async def revoke_all_for_owner(
        self, owner_id: str, owner_type: TokenOwnerType
    ) -> None:
        """Revoke all active sessions for a user (logout from all devices)."""
        sessions = await RefreshTokenSession.find(
            RefreshTokenSession.owner_id == owner_id,
            RefreshTokenSession.owner_type == owner_type,
            RefreshTokenSession.is_revoked == False,
        ).to_list()
        for s in sessions:
            s.is_revoked = True
            await s.save()
