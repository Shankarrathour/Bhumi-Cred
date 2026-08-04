from app.repositories.base import BaseRepository
from app.homescreen.models import Milestone


class MilestoneRepository(BaseRepository[Milestone]):
    def __init__(self):
        super().__init__(Milestone)

    async def get_by_farmer(self, farmer_id: str) -> list[Milestone]:
        return await Milestone.find(Milestone.farmer_id == farmer_id).sort("-created_at").to_list()
