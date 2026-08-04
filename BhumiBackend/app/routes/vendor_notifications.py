from fastapi import APIRouter, Depends, Query
from typing import List

from app.dependencies.auth import CurrentVendor
from app.dependencies.services import get_notification_service
from app.schemas.common import SuccessResponse
from app.services.notification_service import NotificationService, NotificationResponse

router = APIRouter(prefix="/vendor/notifications", tags=["Vendor Notifications"])

@router.get(
    "",
    response_model=SuccessResponse[List[NotificationResponse]],
    summary="List all notifications for the current vendor",
)
async def list_vendor_notifications(
    vendor: CurrentVendor,
    limit: int = Query(50, ge=1, le=100),
    svc: NotificationService = Depends(get_notification_service),
) -> SuccessResponse[List[NotificationResponse]]:
    data = await svc.get_vendor_notifications(str(vendor.id), limit)
    return SuccessResponse(message="Notifications retrieved successfully.", data=data)

@router.patch(
    "/{id}/read",
    response_model=SuccessResponse[NotificationResponse],
    summary="Mark a vendor notification as read",
)
async def mark_vendor_notification_read(
    id: str,
    vendor: CurrentVendor,
    svc: NotificationService = Depends(get_notification_service),
) -> SuccessResponse[NotificationResponse]:
    data = await svc.mark_as_read_vendor(id, str(vendor.id))
    return SuccessResponse(message="Notification marked as read.", data=data)
