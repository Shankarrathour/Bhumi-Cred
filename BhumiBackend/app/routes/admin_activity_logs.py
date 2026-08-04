from fastapi import APIRouter, Depends, Query

from app.config.settings import settings
from app.dependencies.auth import CurrentAdmin, require_roles
from app.dependencies.services import get_admin_activity_log_service
from app.models.admin_user import AdminRole
from app.schemas.admin_activity_log import GatewayRequestLogItem, SecurityAuditLogItem
from app.schemas.common import PaginatedResponse
from app.services.admin_activity_log_service import AdminActivityLogService

router = APIRouter(prefix="/admin/activity-logs", tags=["Admin – Activity Logs"])

_VIEW_ROLES = (AdminRole.SUPER_ADMIN, AdminRole.OPERATIONS_ADMIN)


@router.get(
    "/security-audit",
    response_model=PaginatedResponse[SecurityAuditLogItem],
    summary="List security audit trail events",
    description=(
        "Returns recent security-relevant events: admin/farmer login, logout, "
        "OTP verification, KYC approve/reject, and farmer block/unblock. "
        "Restricted to SUPER_ADMIN and OPERATIONS_ADMIN."
    ),
    dependencies=[Depends(require_roles(*_VIEW_ROLES))],
)
async def list_security_audit(
    current_admin: CurrentAdmin,
    svc: AdminActivityLogService = Depends(get_admin_activity_log_service),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=settings.MAX_PAGE_SIZE),
) -> PaginatedResponse[SecurityAuditLogItem]:
    return await svc.list_security_audit(page=page, limit=limit)


@router.get(
    "/gateway-stream",
    response_model=PaginatedResponse[GatewayRequestLogItem],
    summary="List raw API gateway request stream",
    description=(
        "Returns recent raw HTTP request telemetry (method, path, status, "
        "response time, errors) captured by the request-logging middleware. "
        "Restricted to SUPER_ADMIN and OPERATIONS_ADMIN."
    ),
    dependencies=[Depends(require_roles(*_VIEW_ROLES))],
)
async def list_gateway_stream(
    current_admin: CurrentAdmin,
    svc: AdminActivityLogService = Depends(get_admin_activity_log_service),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=settings.MAX_PAGE_SIZE),
) -> PaginatedResponse[GatewayRequestLogItem]:
    return await svc.list_gateway_stream(page=page, limit=limit)
