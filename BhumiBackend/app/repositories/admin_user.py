from typing import Optional
from datetime import datetime, timezone

from app.models.admin_user import AdminUser, AdminRole
from app.repositories.base import BaseRepository


class AdminUserRepository(BaseRepository[AdminUser]):
    def __init__(self):
        super().__init__(AdminUser)

    async def get_by_email(self, email: str) -> Optional[AdminUser]:
        return await AdminUser.find_one(AdminUser.email == email)

    async def update_last_login(self, admin: AdminUser) -> AdminUser:
        admin.last_login = datetime.now(timezone.utc)
        admin.updated_at = datetime.now(timezone.utc)
        await admin.save()
        return admin

    async def list_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        role: Optional[AdminRole] = None,
        search: Optional[str] = None,
    ) -> tuple[list[AdminUser], int]:
        query: dict = {}
        if role:
            query["role"] = role
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
            ]
        results = await AdminUser.find(query).skip(skip).limit(limit).to_list()
        total = await AdminUser.find(query).count()
        return results, total
