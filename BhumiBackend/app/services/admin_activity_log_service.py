from app.models.audit_log import AuditLog
from app.models.gateway_request_log import GatewayRequestLog
from app.repositories.audit_log import AuditLogRepository
from app.repositories.gateway_request_log import GatewayRequestLogRepository
from app.schemas.admin_activity_log import GatewayRequestLogItem, SecurityAuditLogItem
from app.schemas.common import PaginatedResponse, PaginationMeta


class AdminActivityLogService:
    def __init__(
        self,
        audit_repo: AuditLogRepository,
        gateway_repo: GatewayRequestLogRepository,
    ):
        self._audit = audit_repo
        self._gateway = gateway_repo

    async def list_security_audit(self, page: int, limit: int) -> PaginatedResponse[SecurityAuditLogItem]:
        skip = (page - 1) * limit
        entries = await self._audit.list_recent(skip=skip, limit=limit)
        total = await self._audit.count()
        total_pages = max(1, (total + limit - 1) // limit)
        return PaginatedResponse[SecurityAuditLogItem](
            data=[self._to_security_item(e) for e in entries],
            meta=PaginationMeta(total=total, page=page, limit=limit, total_pages=total_pages),
        )

    async def list_gateway_stream(self, page: int, limit: int) -> PaginatedResponse[GatewayRequestLogItem]:
        skip = (page - 1) * limit
        entries = await self._gateway.list_recent(skip=skip, limit=limit)
        total = await self._gateway.count()
        total_pages = max(1, (total + limit - 1) // limit)
        return PaginatedResponse[GatewayRequestLogItem](
            data=[self._to_gateway_item(e) for e in entries],
            meta=PaginationMeta(total=total, page=page, limit=limit, total_pages=total_pages),
        )

    @staticmethod
    def _to_security_item(e: AuditLog) -> SecurityAuditLogItem:
        return SecurityAuditLogItem(
            id=str(e.id),
            timestamp=e.timestamp,
            action=e.action,
            module=e.module,
            entity_type=e.entity_type,
            entity_id=e.entity_id,
            actor_name=e.admin_name,
            actor_type=e.actor_type,
            actor_role=e.actor_role,
            ip_address=e.ip_address,
            user_agent=e.user_agent,
            browser=e.browser,
            device=e.device,
            old_value=e.old_value,
            new_value=e.new_value,
            remarks=e.remarks,
            success=e.success,
        )

    @staticmethod
    def _to_gateway_item(e: GatewayRequestLog) -> GatewayRequestLogItem:
        return GatewayRequestLogItem(
            id=str(e.id),
            timestamp=e.timestamp,
            method=e.method,
            path=e.path,
            status_code=e.status_code,
            response_time_ms=e.response_time_ms,
            error=e.error,
        )
