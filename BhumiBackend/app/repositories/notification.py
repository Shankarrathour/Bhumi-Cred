import logging
from typing import List
from app.models.notification import Notification
from app.repositories.base import BaseRepository

logger = logging.getLogger(__name__)

class NotificationRepository(BaseRepository[Notification]):
    def __init__(self):
        super().__init__(Notification)

    async def get_by_farmer(self, farmer_id: str, limit: int = 50) -> List[Notification]:
        try:
            return await self._model.find({"farmer_id": farmer_id}).sort("-created_at").limit(limit).to_list()
        except Exception as e:
            logger.exception(f"Error fetching notifications for farmer {farmer_id}: {e}")
            from app.core.exceptions import InternalServerException
            raise InternalServerException(f"Failed to fetch notifications: {e}")

    async def mark_as_read(self, notification_id: str, farmer_id: str) -> Notification:
        from bson import ObjectId
        from app.core.exceptions import NotFoundException, InternalServerException

        try:
            notification = await self._model.find_one({"_id": ObjectId(notification_id), "farmer_id": farmer_id})
            if not notification:
                raise NotFoundException("Notification not found.")

            notification.is_read = True
            await notification.save()
            return notification
        except NotFoundException:
            raise
        except Exception as e:
            logger.exception(f"Error marking notification {notification_id} as read for farmer {farmer_id}: {e}")
            raise InternalServerException(f"Failed to mark notification as read: {e}")

    async def get_by_vendor(self, vendor_id: str, limit: int = 50) -> List[Notification]:
        try:
            return await self._model.find({"vendor_id": vendor_id}).sort("-created_at").limit(limit).to_list()
        except Exception as e:
            logger.exception(f"Error fetching notifications for vendor {vendor_id}: {e}")
            from app.core.exceptions import InternalServerException
            raise InternalServerException(f"Failed to fetch notifications: {e}")

    async def mark_as_read_vendor(self, notification_id: str, vendor_id: str) -> Notification:
        from bson import ObjectId
        from app.core.exceptions import NotFoundException, InternalServerException

        try:
            notification = await self._model.find_one({"_id": ObjectId(notification_id), "vendor_id": vendor_id})
            if not notification:
                raise NotFoundException("Notification not found.")

            notification.is_read = True
            await notification.save()
            return notification
        except NotFoundException:
            raise
        except Exception as e:
            logger.exception(f"Error marking notification {notification_id} as read for vendor {vendor_id}: {e}")
            raise InternalServerException(f"Failed to mark notification as read: {e}")

    async def get_admin_notifications(self, limit: int = 100) -> List[Notification]:
        try:
            return await self._model.find({"is_admin": True}).sort("-created_at").limit(limit).to_list()
        except Exception as e:
            logger.exception(f"Error fetching admin notifications: {e}")
            from app.core.exceptions import InternalServerException
            raise InternalServerException(f"Failed to fetch admin notifications: {e}")

    async def mark_as_read_admin(self, notification_id: str) -> Notification:
        from bson import ObjectId
        from app.core.exceptions import NotFoundException, InternalServerException

        try:
            notification = await self._model.find_one({"_id": ObjectId(notification_id), "is_admin": True})
            if not notification:
                raise NotFoundException("Notification not found.")

            notification.is_read = True
            await notification.save()
            return notification
        except NotFoundException:
            raise
        except Exception as e:
            logger.exception(f"Error marking admin notification {notification_id} as read: {e}")
            raise InternalServerException(f"Failed to mark notification as read: {e}")

    async def count_unread_admin(self) -> int:
        try:
            return await self._model.find({"is_admin": True, "is_read": False}).count()
        except Exception as e:
            logger.exception(f"Error counting unread admin notifications: {e}")
            from app.core.exceptions import InternalServerException
            raise InternalServerException(f"Failed to count unread notifications: {e}")

    async def bulk_create(self, notifications: List[Notification]) -> int:
        if not notifications:
            return 0
        try:
            await self._model.insert_many(notifications)
            return len(notifications)
        except Exception as e:
            logger.exception(f"Error bulk-creating notifications: {e}")
            from app.core.exceptions import InternalServerException
            raise InternalServerException(f"Failed to broadcast notifications: {e}")

