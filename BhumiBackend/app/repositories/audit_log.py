import logging
from typing import Optional

from app.models.audit_log import AuditLog
from app.repositories.base import BaseRepository

logger = logging.getLogger(__name__)


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self):
        super().__init__(AuditLog)

    async def log_event(
        self,
        action: str,
        entity_type: str,
        entity_id: str,
        admin_id: str,
        admin_name: str,
        actor_type: str = "admin",
        actor_role: Optional[str] = None,
        ip_address: Optional[str] = None,
        success: bool = True,
        remarks: str = "",
    ) -> None:
        """Best-effort audit write — never raises, so a logging failure can't break the action being audited."""
        try:
            await self.create(
                AuditLog(
                    action=action,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    admin_id=admin_id,
                    admin_name=admin_name,
                    actor_type=actor_type,
                    actor_role=actor_role,
                    ip_address=ip_address,
                    success=success,
                    remarks=remarks,
                )
            )
        except Exception:
            logger.warning("Failed to write audit log entry: action=%s", action, exc_info=True)

    async def list_recent(self, skip: int = 0, limit: int = 50) -> list[AuditLog]:
        return await AuditLog.find().sort("-timestamp").skip(skip).limit(limit).to_list()
