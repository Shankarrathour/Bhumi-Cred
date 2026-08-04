from typing import List, Optional
from app.models.notification import Notification
from app.repositories.notification import NotificationRepository
from pydantic import BaseModel
from datetime import datetime

class NotificationResponse(BaseModel):
    id: str
    farmer_id: Optional[str] = None
    vendor_id: Optional[str] = None
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    is_admin: bool = False
    actor_type: Optional[str] = None

class NotificationService:
    def __init__(self, repo: NotificationRepository):
        self.repo = repo

    def _to_response(self, notification: Notification) -> NotificationResponse:
        return NotificationResponse(
            id=str(notification.id),
            farmer_id=notification.farmer_id,
            vendor_id=notification.vendor_id,
            title=notification.title,
            message=notification.message,
            type=notification.type,
            is_read=notification.is_read,
            created_at=notification.created_at,
            is_admin=notification.is_admin,
            actor_type=notification.actor_type,
        )

    async def create_notification(self, farmer_id: str, title: str, message: str, type: str = "system") -> NotificationResponse:
        notification = Notification(
            farmer_id=farmer_id,
            title=title,
            message=message,
            type=type
        )
        created = await self.repo.create(notification)
        return self._to_response(created)

    async def get_farmer_notifications(self, farmer_id: str, limit: int = 50) -> List[NotificationResponse]:
        notifications = await self.repo.get_by_farmer(farmer_id, limit)
        return [self._to_response(n) for n in notifications]

    async def mark_as_read(self, notification_id: str, farmer_id: str) -> NotificationResponse:
        updated = await self.repo.mark_as_read(notification_id, farmer_id)
        return self._to_response(updated)

    async def create_vendor_notification(self, vendor_id: str, title: str, message: str, type: str = "system") -> NotificationResponse:
        notification = Notification(
            vendor_id=vendor_id,
            title=title,
            message=message,
            type=type
        )
        created = await self.repo.create(notification)
        return self._to_response(created)

    async def get_vendor_notifications(self, vendor_id: str, limit: int = 50) -> List[NotificationResponse]:
        notifications = await self.repo.get_by_vendor(vendor_id, limit)
        return [self._to_response(n) for n in notifications]

    async def mark_as_read_vendor(self, notification_id: str, vendor_id: str) -> NotificationResponse:
        updated = await self.repo.mark_as_read_vendor(notification_id, vendor_id)
        return self._to_response(updated)

    async def broadcast_to_all_farmers(self, title: str, message: str, type: str = "system") -> int:
        """Create one independent notification per farmer so each can read/unread it separately."""
        from app.models.farmer import Farmer

        farmer_ids = [str(f.id) for f in await Farmer.find_all().to_list()]
        notifications = [
            Notification(farmer_id=fid, title=title, message=message, type=type)
            for fid in farmer_ids
        ]
        return await self.repo.bulk_create(notifications)

    # ── Admin Notification Center ───────────────────────────────────────────────

    async def create_admin_notification(
        self, title: str, message: str, type: str = "system", actor_type: Optional[str] = None
    ) -> NotificationResponse:
        notification = Notification(
            is_admin=True,
            actor_type=actor_type,
            title=title,
            message=message,
            type=type,
        )
        created = await self.repo.create(notification)
        return self._to_response(created)

    async def get_admin_notifications(self, limit: int = 100) -> List[NotificationResponse]:
        notifications = await self.repo.get_admin_notifications(limit)
        return [self._to_response(n) for n in notifications]

    async def mark_as_read_admin(self, notification_id: str) -> NotificationResponse:
        updated = await self.repo.mark_as_read_admin(notification_id)
        return self._to_response(updated)

    async def get_admin_unread_count(self) -> int:
        return await self.repo.count_unread_admin()
