from typing import List, Optional
from bson import ObjectId

from app.models.support_ticket import SupportTicket
from app.repositories.base import BaseRepository


class SupportTicketRepository(BaseRepository[SupportTicket]):
    def __init__(self):
        super().__init__(SupportTicket)

    async def get_by_vendor(self, vendor_id: str, limit: int = 50) -> List[SupportTicket]:
        return await self._model.find({"vendor_id": vendor_id}).sort("-created_at").limit(limit).to_list()

    async def get_by_id_and_vendor(self, ticket_id: str, vendor_id: str) -> Optional[SupportTicket]:
        try:
            return await self._model.find_one({"_id": ObjectId(ticket_id), "vendor_id": vendor_id})
        except Exception:
            return None

    async def get_all_admin(self, status: Optional[str] = None, limit: int = 100) -> List[SupportTicket]:
        query = {"status": status} if status else {}
        return await self._model.find(query).sort("-created_at").limit(limit).to_list()
