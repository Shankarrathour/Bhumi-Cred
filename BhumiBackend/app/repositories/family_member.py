from typing import Optional
from bson import ObjectId

from app.models.family_member import FamilyMember
from app.repositories.base import BaseRepository


class FamilyMemberRepository(BaseRepository[FamilyMember]):
    def __init__(self):
        super().__init__(FamilyMember)

    async def get_active_by_farmer(self, farmer_id: str) -> list[FamilyMember]:
        return await (
            FamilyMember.find(
                FamilyMember.farmer_id == farmer_id,
                FamilyMember.is_active == True,
            )
            .sort("created_at")
            .to_list()
        )

    async def get_by_id_and_farmer(
        self, member_id: str, farmer_id: str
    ) -> Optional[FamilyMember]:
        try:
            doc = await FamilyMember.get(ObjectId(member_id))
        except Exception:
            return None
        if doc is None or doc.farmer_id != farmer_id or not doc.is_active:
            return None
        return doc
