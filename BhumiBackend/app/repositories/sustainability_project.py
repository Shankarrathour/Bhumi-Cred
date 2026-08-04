from typing import Optional

from app.models.sustainability_project import SustainabilityProject
from app.repositories.base import BaseRepository


class SustainabilityProjectRepository(BaseRepository[SustainabilityProject]):
    def __init__(self):
        super().__init__(SustainabilityProject)

    async def get_by_project_id(
        self, project_id: str, active_only: bool = True
    ) -> Optional[SustainabilityProject]:
        filters = [SustainabilityProject.project_id == project_id]
        if active_only:
            filters.append(SustainabilityProject.is_active == True)
        return await SustainabilityProject.find_one(*filters)

    async def list_public(self, search: Optional[str] = None) -> list[SustainabilityProject]:
        filters = [
            SustainabilityProject.is_active == True,
            SustainabilityProject.is_public == True,
        ]
        projects = await SustainabilityProject.find(*filters).sort("-created_at").to_list()
        if not search:
            return projects

        needle = search.lower().strip()
        return [
            project
            for project in projects
            if needle in project.title.lower()
            or needle in project.category.lower()
            or needle in project.description.lower()
            or needle in project.district.lower()
            or needle in project.state.lower()
        ]

    async def list_admin(self, include_inactive: bool = False) -> list[SustainabilityProject]:
        if include_inactive:
            return await SustainabilityProject.find().sort("-created_at").to_list()
        return await SustainabilityProject.find(
            SustainabilityProject.is_active == True
        ).sort("-created_at").to_list()
