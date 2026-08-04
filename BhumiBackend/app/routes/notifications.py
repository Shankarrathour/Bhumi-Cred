from fastapi import APIRouter, Depends, Query
from typing import List

from app.dependencies.auth import CurrentFarmer
from app.dependencies.services import get_notification_service
from app.schemas.common import SuccessResponse
from app.services.notification_service import NotificationService, NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get(
    "",
    response_model=SuccessResponse[List[NotificationResponse]],
    summary="List all notifications for the current farmer",
)
async def list_notifications(
    current_farmer: CurrentFarmer,
    limit: int = Query(50, ge=1, le=100),
    svc: NotificationService = Depends(get_notification_service),
) -> SuccessResponse[List[NotificationResponse]]:
    data = await svc.get_farmer_notifications(str(current_farmer.id), limit)
    return SuccessResponse(message="Notifications retrieved successfully.", data=data)

@router.patch(
    "/{id}/read",
    response_model=SuccessResponse[NotificationResponse],
    summary="Mark a notification as read",
)
async def mark_notification_read(
    id: str,
    current_farmer: CurrentFarmer,
    svc: NotificationService = Depends(get_notification_service),
) -> SuccessResponse[NotificationResponse]:
    data = await svc.mark_as_read(id, str(current_farmer.id))
    return SuccessResponse(message="Notification marked as read.", data=data)
