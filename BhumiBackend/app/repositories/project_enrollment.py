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
            {"$and": [
                {"$or": [{"farmer_id": farmer_id}, {"farmer_id": str(farmer_id)}]},
                {"$or": [{"project_id": project_id}, {"project_id": str(project_id)}]},
                {"is_active": True},
            ]}
        )

    async def get_active_by_farmer(self, farmer_id: str) -> list[ProjectEnrollment]:
        """Return only ADMIN-ASSIGNED (ACTIVE status) enrollments.

        We intentionally filter by EnrollmentStatus.ACTIVE so that
        PENDING_ADMIN_VERIFICATION records (created via the farmer join-request
        flow) do NOT auto-appear as an active project in the Projects Hub before
        admin explicitly approves/assigns them.
        """
        from app.models.farmer import Farmer
        farmer_ids = [farmer_id, str(farmer_id)]
        farmer = None
        if ObjectId.is_valid(farmer_id):
            farmer = await Farmer.get(ObjectId(farmer_id))
        if not farmer:
            farmer = await Farmer.find_one(Farmer.farmer_id == farmer_id)
        if farmer:
            farmer_ids.extend([str(farmer.id), farmer.farmer_id, farmer.mobile])
            farmer_ids = list(set([fid for fid in farmer_ids if fid]))

        return await (
            ProjectEnrollment.find(
                {"farmer_id": {"$in": farmer_ids}},
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
