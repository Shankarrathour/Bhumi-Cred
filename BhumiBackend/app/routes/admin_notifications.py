from fastapi import APIRouter, Depends, Query
from typing import List

from app.dependencies.auth import CurrentAdmin
from app.dependencies.services import get_notification_service
from app.schemas.common import SuccessResponse
from app.services.notification_service import NotificationService, NotificationResponse

router = APIRouter(prefix="/admin/notifications", tags=["Admin Notifications"])


@router.get(
    "",
    response_model=SuccessResponse[List[NotificationResponse]],
    summary="List all Admin Notification Center entries",
)
async def list_admin_notifications(
    current_admin: CurrentAdmin,
    limit: int = Query(100, ge=1, le=200),
    svc: NotificationService = Depends(get_notification_service),
) -> SuccessResponse[List[NotificationResponse]]:
    data = await svc.get_admin_notifications(limit)
    return SuccessResponse(message="Admin notifications retrieved successfully.", data=data)


@router.get(
    "/unread-count",
    response_model=SuccessResponse[dict],
    summary="Get unread Admin Notification Center count (for the header bell badge)",
)
async def get_admin_unread_count(
    current_admin: CurrentAdmin,
    svc: NotificationService = Depends(get_notification_service),
) -> SuccessResponse[dict]:
    count = await svc.get_admin_unread_count()
    return SuccessResponse(message="Unread count retrieved successfully.", data={"count": count})


@router.patch(
    "/{id}/read",
    response_model=SuccessResponse[NotificationResponse],
    summary="Mark an Admin Notification Center entry as read",
)
async def mark_admin_notification_read(
    id: str,
    current_admin: CurrentAdmin,
    svc: NotificationService = Depends(get_notification_service),
) -> SuccessResponse[NotificationResponse]:
    data = await svc.mark_as_read_admin(id)
    return SuccessResponse(message="Notification marked as read.", data=data)
