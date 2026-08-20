from typing import Optional

from bson import ObjectId

from app.models.project_enrollment import EnrollmentStatus, ProjectEnrollment
from app.repositories.base import BaseRepository


class ProjectEnrollmentRepository(BaseRepository[ProjectEnrollment]):
    def __init__(self):
        super().__init__(ProjectEnrollment)

    async def get_by_farmer_and_project(
        self, farmer_id: str, project_id: str
    ) -> Optional[ProjectEnrollment]:
        return await ProjectEnrollment.find_one(
            ProjectEnrollment.farmer_id == farmer_id,
            ProjectEnrollment.project_id == project_id,
            ProjectEnrollment.is_active == True,
        )

    async def get_active_by_farmer(self, farmer_id: str) -> list[ProjectEnrollment]:
        """Return only ADMIN-ASSIGNED (ACTIVE status) enrollments.

        We intentionally filter by EnrollmentStatus.ACTIVE so that
        PENDING_ADMIN_VERIFICATION records (created via the farmer join-request
        flow) do NOT auto-appear as an active project in the Projects Hub before
        admin explicitly approves/assigns them.
        """
        return await (
            ProjectEnrollment.find(
                ProjectEnrollment.farmer_id == farmer_id,
                ProjectEnrollment.is_active == True,
                ProjectEnrollment.status == EnrollmentStatus.ACTIVE,
            )
            .sort("-joined_at")
            .to_list()
        )

    async def get_by_id_and_farmer(
        self, enrollment_id: str, farmer_id: str
    ) -> Optional[ProjectEnrollment]:
        try:
            doc = await ProjectEnrollment.get(ObjectId(enrollment_id))
        except Exception:
            return None
        if doc is None or doc.farmer_id != farmer_id or not doc.is_active:
            return None
        return doc

    async def get_active_enrollment(self, farmer_id: str) -> Optional[ProjectEnrollment]:
        """Return the first ACTIVE enrollment for a farmer (admin-assigned only)."""
        return await ProjectEnrollment.find_one(
            ProjectEnrollment.farmer_id == farmer_id,
            ProjectEnrollment.is_active == True,
            ProjectEnrollment.status == EnrollmentStatus.ACTIVE,
        )

    async def list_active(self) -> list[ProjectEnrollment]:
        return await (
            ProjectEnrollment.find(ProjectEnrollment.is_active == True)
            .sort("-updated_at")
            .to_list()
        )
