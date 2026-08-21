import logging
from datetime import datetime, timedelta, timezone
from math import ceil
from typing import Optional

from app.core.exceptions import BadRequestException, ConflictException, NotFoundException
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)
from app.models.farmer import Farmer
from app.models.land_parcel import LandParcel, LandVerificationStatus
from app.models.project_enrollment import (
    EnrollmentStatus,
    InsurancePolicy,
    InsuranceProtection,
    InsuranceStatus,
    ProjectEnrollment,
    ProjectMilestone,
    ProjectStage,
)
from app.models.sustainability_project import (
    SustainabilityProject,
    SustainabilityProjectStatus,
)
from app.repositories.farmer import FarmerRepository
from app.repositories.land_parcel import LandParcelRepository
from app.repositories.project_enrollment import ProjectEnrollmentRepository
from app.repositories.sustainability_project import SustainabilityProjectRepository
from app.schemas.projects import (
    ActiveProjectResponse,
    AdminProjectReviewRequest,
    AdminAssignProjectRequest,
    AdminProjectEnrollmentResponse,
    AdminProjectResponse,
    ContributionResponse,
    CreateProjectRequest,
    EnrollmentResponse,
    InsuranceProtectionResponse,
    JoinProjectRequest,
    ProjectDetailResponse,
    ProjectMilestoneResponse,
    ProjectsHubResponse,
    ProjectSummaryResponse,
    TreeRegistrationRequest,
    UpdateProjectRequest,
)


PROJECT_ROADMAP = [
    ProjectStage.REGISTERED,
    ProjectStage.UNDER_REVIEW,
    ProjectStage.ACTIVE_MONITORING,
    ProjectStage.MRV_STAGE,
    ProjectStage.CARBON_ESTIMATION,
    ProjectStage.COMPLETED,
]

FLOW_SEQUENCE = [
    "Authenticate farmer with mobile OTP.",
    "Complete farmer profile, KYC, bank, address, land, and plantation details.",
    "Submit project join request; status becomes pending admin verification.",
    "Admin verifies KYC, land proof, acreage, crop data, and plantation photos.",
    "Approved enrollment moves through registered, under review, active monitoring, MRV, carbon estimation, and completed stages.",
    "Register trees for insurance; five verified trees generate one Green Family.",
    "Projects Hub returns active project, contribution metrics, insurance cover, and available sustainability projects.",
]


def _stage_label(stage: ProjectStage) -> str:
    labels = {
        ProjectStage.REGISTERED: "Stage 1: Registered",
        ProjectStage.UNDER_REVIEW: "Stage 2: Under Review",
        ProjectStage.ACTIVE_MONITORING: "Stage 3: Active Monitoring",
        ProjectStage.MRV_STAGE: "Stage 4: MRV",
        ProjectStage.CARBON_ESTIMATION: "Stage 5: Carbon Estimation",
        ProjectStage.COMPLETED: "Stage 6: Completed",
    }
    return labels[stage]


class ProjectsService:
    def __init__(
        self,
        farmer_repo: FarmerRepository,
        land_repo: LandParcelRepository,
        enrollment_repo: ProjectEnrollmentRepository,
        project_repo: SustainabilityProjectRepository,
        notification_service: NotificationService,
    ):
        self._farmers = farmer_repo
        self._land = land_repo
        self._notifications = notification_service
        self._enrollments = enrollment_repo
        self._projects = project_repo

    async def _get_farmer(self, farmer_id: str) -> Farmer:
        from bson import ObjectId
        farmer = None
        if ObjectId.is_valid(farmer_id):
            farmer = await self._farmers.get_by_id(farmer_id)
        if not farmer:
            farmer = await Farmer.find_one(Farmer.farmer_id == farmer_id)
        if not farmer:
            farmer = await Farmer.find_one(Farmer.mobile == farmer_id)
        if not farmer:
            raise NotFoundException("Farmer not found", "FARMER_NOT_FOUND")
        return farmer

    async def _project(self, project_id: str) -> SustainabilityProject:
        from bson import ObjectId
        project = await self._projects.get_by_project_id(project_id, active_only=False)
        if not project and ObjectId.is_valid(project_id):
            project = await SustainabilityProject.get(ObjectId(project_id))
        if project:
            return project
        raise NotFoundException("Project not found", "PROJECT_NOT_FOUND")

    @staticmethod
    def _status_label(project: SustainabilityProject, is_tracking_active: bool = False) -> str:
        if is_tracking_active or project.status == SustainabilityProjectStatus.ACTIVE_TRACKING:
            return "Active Tracking"
        if project.status == SustainabilityProjectStatus.COMPLETED:
            return "Completed"
        if project.status == SustainabilityProjectStatus.PAUSED:
            return "Paused"
        return "Available"

    def _project_summary(
        self, project: SustainabilityProject, is_tracking_active: bool = False, enrollment: Optional[ProjectEnrollment] = None
    ) -> ProjectSummaryResponse:
        return ProjectSummaryResponse(
            id=project.project_id,
            title=project.title,
            category=project.category,
            description=project.description,
            district=project.district,
            state=project.state,
            target_area_acres=project.target_area_acres,
            estimated_carbon_impact=project.estimated_carbon_impact,
            status_label=self._status_label(project, is_tracking_active),
            is_tracking_active=is_tracking_active,
            progress_percent=enrollment.progress_percent if enrollment else None,
            current_stage=enrollment.current_stage if enrollment else None,
            trees_registered=enrollment.registered_trees if enrollment else None,
        )

    def _project_detail(
        self, project: SustainabilityProject, is_tracking_active: bool = False, enrollment: Optional[ProjectEnrollment] = None
    ) -> ProjectDetailResponse:
        summary = self._project_summary(project, is_tracking_active, enrollment)
        return ProjectDetailResponse(
            **summary.model_dump(),
            roadmap=PROJECT_ROADMAP,
            eligibility=project.eligibility,
            required_documents=project.required_documents,
        )

    def _admin_project_response(self, project: SustainabilityProject) -> AdminProjectResponse:
        detail = self._project_detail(project)
        return AdminProjectResponse(
            **detail.model_dump(),
            project_id=project.project_id,
            status=project.status,
            is_public=project.is_public,
            is_active=project.is_active,
            created_at=project.created_at,
            updated_at=project.updated_at,
        )

    def _milestones(self, enrollment: ProjectEnrollment) -> list[ProjectMilestoneResponse]:
        return [
            ProjectMilestoneResponse(label=item.label, completed=item.completed)
            for item in enrollment.milestones
        ]

    @staticmethod
    def _ensure_milestones(enrollment: ProjectEnrollment) -> None:
        defaults = [
            "Land registration submitted",
            "Admin verification pending",
            "Active monitoring",
            "MRV verification",
            "Carbon estimation",
        ]
        existing = {item.label for item in enrollment.milestones}
        for label in defaults:
            if label not in existing:
                enrollment.milestones.append(ProjectMilestone(label=label, completed=False))

    def _insurance_response(
        self, insurance: InsuranceProtection
    ) -> InsuranceProtectionResponse:
        policy_names = {
            InsurancePolicy.GREEN_SHIELD: "Green Shield",
            InsurancePolicy.ECO_LIFE: "Eco Life",
            InsurancePolicy.AGRO_FOREST_SECURE: "Agro Forest Secure",
            InsurancePolicy.GREEN_FAMILY: "Green Family",
        }
        return InsuranceProtectionResponse(
            policy=insurance.policy,
            policy_name=policy_names[insurance.policy],
            status=insurance.status,
            protected_trees=insurance.protected_trees,
            claim_eligibility_percent=insurance.claim_eligibility_percent,
            duration_years=insurance.duration_years,
            expiry_date=insurance.expiry_date,
        )

    async def _active_response(self, enrollment: ProjectEnrollment) -> ActiveProjectResponse:
        project = await self._project(enrollment.project_id)
        return ActiveProjectResponse(
            enrollment_id=str(enrollment.id),
            project=self._project_detail(project, True),
            status=enrollment.status,
            current_stage=enrollment.current_stage,
            current_stage_label=_stage_label(enrollment.current_stage),
            progress_percent=enrollment.progress_percent,
            joined_at=enrollment.joined_at,
            ngo_partner=enrollment.ngo_partner or project.ngo_partner,
            milestones=self._milestones(enrollment),
            land_verified=enrollment.land_verified,
            trees_verified=enrollment.trees_verified,
            mrv_verified=enrollment.mrv_verified,
            insurance_active=enrollment.insurance.status == InsuranceStatus.ACTIVE,
            stage_project_assigned=enrollment.stage_project_assigned,
            stage_land_registered=enrollment.stage_land_registered,
            stage_inspection_completed=enrollment.stage_inspection_completed,
            stage_soil_verified=enrollment.stage_soil_verified,
            stage_trees_registered=enrollment.stage_trees_registered,
            stage_insurance_activated=enrollment.stage_insurance_activated,
            stage_mrv_monitoring_started=enrollment.stage_mrv_monitoring_started,
            stage_carbon_estimation_running=enrollment.stage_carbon_estimation_running,
            stage_reward_eligible=enrollment.stage_reward_eligible,
        )

    async def list_projects(
        self, farmer_id: str, search: Optional[str] = None
    ) -> list[ProjectSummaryResponse]:
        enrollments = await self._enrollments.get_active_by_farmer(farmer_id)
        enrollment_map = {item.project_id: item for item in enrollments}
        projects = await self._projects.list_public(search)
        return [
            self._project_summary(project, project.project_id in enrollment_map, enrollment_map.get(project.project_id))
            for project in projects
        ]

    async def get_project(self, farmer_id: str, project_id: str) -> ProjectDetailResponse:
        enrollment = await self._enrollments.get_by_farmer_and_project(farmer_id, project_id)
        return self._project_detail(await self._project(project_id), enrollment is not None, enrollment)

    async def get_hub(self, farmer_id: str) -> ProjectsHubResponse:
        farmer = await self._get_farmer(farmer_id)
        enrollments = await self._enrollments.get_active_by_farmer(farmer_id)

        # NOTE: No auto-enrollment here. The admin must explicitly assign a farmer
        # to a project via the Carbon Programs panel (POST /admin/projects/{id}/assign).
        # Auto-enrollment was removed because it created fake "all-completed" records
        # that blocked real admin assignment and showed false data in the farmer app.

        active = enrollments[0] if enrollments else None

        contribution = ContributionResponse(
            total_land_added_acres=max(farmer.total_acreage, active.land_area_acres if active else 0.0),
            trees_registered=max(farmer.total_trees, active.registered_trees if active else 0),
            trees_insured=active.insured_trees if active else 0,
            sustainability_score=active.sustainability_score if active else farmer.sustainability_score,
            estimated_carbon_impact=max(farmer.carbon_credits_generated, active.estimated_carbon_impact if active else 0.0),
            green_family_count=active.green_family_count if active else 0,
        )
        enrollment_map = {item.project_id: item for item in enrollments}
        projects = await self._projects.list_public()
        return ProjectsHubResponse(
            active_project=await self._active_response(active) if active else None,
            contribution=contribution,
            insurance=self._insurance_response(active.insurance) if active else None,
            explore_projects=[
                self._project_summary(project, project.project_id in enrollment_map, enrollment_map.get(project.project_id))
                for project in projects
                if not active or project.project_id != active.project_id
            ],
            api_flow=FLOW_SEQUENCE,
        )

    async def join_project(
        self, farmer_id: str, project_id: str, data: JoinProjectRequest
    ) -> EnrollmentResponse:
        farmer = await self._get_farmer(farmer_id)
        project = await self._project(project_id)
        existing = await self._enrollments.get_by_farmer_and_project(farmer_id, project_id)
        if existing:
            raise ConflictException("Farmer is already enrolled in this project.", "PROJECT_ALREADY_JOINED")

        land_total = await self._land.get_total_acreage(farmer_id)
        registered_land = max(land_total, farmer.total_acreage)
        if registered_land <= 0:
            raise BadRequestException("Add land before joining a carbon project.", "LAND_REQUIRED")
        if data.land_area_acres > registered_land:
            raise BadRequestException("Project land area cannot exceed registered land.", "INVALID_PROJECT_AREA")

        registered_trees = data.tree_count
        insured_trees = min(registered_trees, registered_trees // 4)
        now = datetime.now(timezone.utc)
        enrollment = ProjectEnrollment(
            farmer_id=farmer_id,
            project_id=project_id,
            status=EnrollmentStatus.PENDING_ADMIN_VERIFICATION,
            current_stage=ProjectStage.REGISTERED,
            progress_percent=10,
            land_area_acres=data.land_area_acres,
            registered_trees=registered_trees,
            insured_trees=insured_trees,
            green_family_count=registered_trees // 5,
            estimated_carbon_impact=round(data.land_area_acres * 3.4, 2),
            sustainability_score=min(100, 50 + ceil(data.land_area_acres * 2) + registered_trees // 10),
            ngo_partner=project.ngo_partner,
            land_verified=False,
            trees_verified=False,
            insurance=InsuranceProtection(
                policy=InsurancePolicy.GREEN_SHIELD,
                status=InsuranceStatus.PENDING_VERIFICATION if registered_trees else InsuranceStatus.NOT_ELIGIBLE,
                protected_trees=insured_trees,
                claim_eligibility_percent=0,
                expiry_date=now + timedelta(days=365 * 3) if insured_trees else None,
            ),
            milestones=[
                ProjectMilestone(label="Land registration submitted", completed=False),
                ProjectMilestone(label="Admin verification pending", completed=False),
                ProjectMilestone(label="Active monitoring", completed=False),
                ProjectMilestone(label="MRV verification", completed=False),
                ProjectMilestone(label="Carbon estimation", completed=False),
            ],
            # Carbon Program roadmap: only "Project Assigned" (this enrollment
            # itself) and "Land Register" (if the farmer already has registered
            # land) start completed. Every other stage stays Pending until the
            # Admin explicitly completes it from the Carbon Projects panel.
            stage_project_assigned=True,
            stage_land_registered=registered_land > 0,
            joined_at=now,
            updated_at=now,
        )

        # Add carbon credits to farmer immediately
        farmer.carbon_credits_generated += enrollment.estimated_carbon_impact
        await farmer.save()

        await self._enrollments.create(enrollment)

        try:
            await self._notifications.create_admin_notification(
                "Carbon Project",
                f'Farmer {farmer.farmer_id} joined Carbon Project "{project.title}".',
                type="project",
                actor_type="farmer",
            )
        except Exception:
            logger.exception(f"Failed to create admin notification for project join [enrollment_id={enrollment.id}]")

        return EnrollmentResponse(
            enrollment_id=str(enrollment.id),
            project_id=project_id,
            status=enrollment.status,
            current_stage=enrollment.current_stage,
            progress_percent=enrollment.progress_percent,
            message="Project join request submitted for admin verification.",
        )

    async def register_trees(
        self, farmer_id: str, project_id: str, data: TreeRegistrationRequest
    ) -> EnrollmentResponse:
        enrollment = await self._enrollments.get_by_farmer_and_project(farmer_id, project_id)
        if not enrollment:
            raise NotFoundException("Project enrollment not found", "PROJECT_ENROLLMENT_NOT_FOUND")
        enrollment.registered_trees += data.tree_count
        enrollment.green_family_count = enrollment.registered_trees // 5
        enrollment.insured_trees = max(enrollment.insured_trees, enrollment.registered_trees // 4)
        enrollment.insurance.status = InsuranceStatus.PENDING_VERIFICATION
        enrollment.insurance.protected_trees = enrollment.insured_trees
        enrollment.estimated_carbon_impact = round(
            enrollment.land_area_acres * 3.4 + enrollment.registered_trees * 0.04, 2
        )
        enrollment.updated_at = datetime.now(timezone.utc)
        await enrollment.save()

        try:
            farmer = await self._get_farmer(farmer_id)
            await self._notifications.create_admin_notification(
                "Tree Registration",
                f"Farmer {farmer.farmer_id} registered {data.tree_count} trees.",
                type="tree",
                actor_type="farmer",
            )
        except Exception:
            logger.exception(f"Failed to create admin notification for tree registration [enrollment_id={enrollment.id}]")

        return EnrollmentResponse(
            enrollment_id=str(enrollment.id),
            project_id=project_id,
            status=enrollment.status,
            current_stage=enrollment.current_stage,
            progress_percent=enrollment.progress_percent,
            message="Trees registered and sent for verification.",
        )

    async def admin_review(
        self, enrollment_id: str, data: AdminProjectReviewRequest
    ) -> EnrollmentResponse:
        enrollment = await self._enrollments.get_by_id(enrollment_id)
        if not enrollment or not enrollment.is_active:
            raise NotFoundException("Project enrollment not found", "PROJECT_ENROLLMENT_NOT_FOUND")

        old_status = enrollment.status

        self._ensure_milestones(enrollment)
        enrollment.status = data.status
        if data.current_stage is not None:
            enrollment.current_stage = data.current_stage
        if data.progress_percent is not None:
            enrollment.progress_percent = data.progress_percent
        elif data.status == EnrollmentStatus.ACTIVE:
            enrollment.progress_percent = max(enrollment.progress_percent, 35)
            enrollment.current_stage = ProjectStage.ACTIVE_MONITORING
        elif data.status == EnrollmentStatus.COMPLETED:
            enrollment.progress_percent = 100
            enrollment.current_stage = ProjectStage.COMPLETED
            enrollment.completed_at = datetime.now(timezone.utc)
            
            if old_status != EnrollmentStatus.COMPLETED:
                farmer = await self._get_farmer(enrollment.farmer_id)
                if farmer:
                    credits = enrollment.estimated_carbon_impact
                    farmer.carbon_credits_generated += credits
                    await farmer.save()

        for field in (
            "land_verified",
            "trees_verified",
            "mrv_verified",
            "stage_inspection_completed",
            "stage_soil_verified",
            "stage_trees_registered",
            "stage_insurance_activated",
            "stage_mrv_monitoring_started",
            "stage_carbon_estimation_running",
            "stage_reward_eligible",
        ):
            value = getattr(data, field)
            if value is not None:
                setattr(enrollment, field, value)

        if data.registered_trees is not None:
            enrollment.registered_trees = data.registered_trees

        if data.land_area_acres is not None:
            enrollment.land_area_acres = data.land_area_acres

        if data.estimated_carbon_impact is not None:
            enrollment.estimated_carbon_impact = data.estimated_carbon_impact

        if data.insured_trees is not None:
            if data.insured_trees > enrollment.registered_trees:
                raise BadRequestException("Insured trees cannot exceed registered trees.", "INVALID_INSURED_TREES")
            enrollment.insured_trees = data.insured_trees
            enrollment.insurance.protected_trees = data.insured_trees

        if enrollment.land_verified:
            enrollment.milestones[1].completed = True
        if enrollment.status == EnrollmentStatus.ACTIVE:
            enrollment.milestones[2].completed = True
        if enrollment.mrv_verified:
            enrollment.milestones[3].completed = True
        if enrollment.current_stage in {ProjectStage.CARBON_ESTIMATION, ProjectStage.COMPLETED}:
            enrollment.milestones[4].completed = True

        # Insurance activation is its own explicit Admin roadmap action — it is
        # no longer an automatic side effect of approving trees.
        if data.stage_insurance_activated:
            enrollment.insurance.status = InsuranceStatus.ACTIVE
            enrollment.insurance.claim_eligibility_percent = 100

        enrollment.rejection_reason = data.rejection_reason
        enrollment.clarification_note = data.clarification_note
        enrollment.updated_at = datetime.now(timezone.utc)
        await enrollment.save()
        return EnrollmentResponse(
            enrollment_id=str(enrollment.id),
            project_id=enrollment.project_id,
            status=enrollment.status,
            current_stage=enrollment.current_stage,
            progress_percent=enrollment.progress_percent,
            message="Project enrollment reviewed successfully.",
        )

    async def admin_assign_project(
        self, project_id: str, data: AdminAssignProjectRequest
    ) -> EnrollmentResponse:
        """Admin directly assigns a farmer to a project (creates enrollment on their behalf).
        If the farmer is already enrolled (active or inactive), the enrollment is updated/reactivated
        so that admin assignment always immediately reflects in the farmer app.
        """
        farmer = await self._get_farmer(data.farmer_id)
        project = await self._project(project_id)

        canonical_farmer_id = str(farmer.id)
        canonical_project_id = project.project_id or str(project.id)

        # ── PREREQUISITE: Land must be verified in GIS & Land first ─────────────────
        verified_parcels = await LandParcel.find(
            {
                "farmer_id": {"$in": [canonical_farmer_id, str(farmer.id), farmer.mobile, farmer.farmer_id]},
                "verification_status": {"$in": [
                    LandVerificationStatus.VERIFIED,
                    LandVerificationStatus.APPROVED,
                    LandVerificationStatus.PROJECT_ASSIGNED,
                    "verified",
                    "approved",
                    "project_assigned",
                ]},
                "is_deleted": {"$ne": True},
            }
        ).to_list()

        if not verified_parcels:
            raise BadRequestException(
                "Land Verification Required: Please verify and approve the farmer's land parcel under GIS & Land before assigning a project. / भूमि सत्यापन आवश्यक: प्रोजेक्ट असाइन करने से पहले कृपया GIS & Land में भूमि पार्सल सत्यापित करें।",
                "LAND_NOT_VERIFIED",
            )

        existing = await self._enrollments.get_by_farmer_and_project(canonical_farmer_id, canonical_project_id)
        if existing:
            # Reactivate / refresh the existing enrollment rather than blocking the admin.
            existing.status = EnrollmentStatus.ACTIVE
            existing.current_stage = ProjectStage.REGISTERED
            existing.progress_percent = max(existing.progress_percent, 10)
            existing.land_area_acres = data.land_area_acres
            existing.is_active = True
            existing.stage_project_assigned = True
            existing.stage_land_registered = await self._land.get_total_acreage(canonical_farmer_id) > 0 or farmer.total_acreage > 0
            existing.updated_at = datetime.now(timezone.utc)
            await existing.save()
            return EnrollmentResponse(
                enrollment_id=str(existing.id),
                project_id=canonical_project_id,
                status=existing.status,
                current_stage=existing.current_stage,
                progress_percent=existing.progress_percent,
                message=f"Farmer re-assigned to project '{project.title}' by admin.",
            )

        land_total = await self._land.get_total_acreage(canonical_farmer_id)
        registered_land = max(land_total, farmer.total_acreage, data.land_area_acres)

        registered_trees = data.tree_count
        insured_trees = registered_trees // 4
        now = datetime.now(timezone.utc)

        enrollment = ProjectEnrollment(
            farmer_id=canonical_farmer_id,
            project_id=canonical_project_id,
            status=EnrollmentStatus.ACTIVE,
            current_stage=ProjectStage.REGISTERED,
            progress_percent=10,
            land_area_acres=data.land_area_acres,
            registered_trees=registered_trees,
            insured_trees=insured_trees,
            green_family_count=registered_trees // 5,
            estimated_carbon_impact=round(data.land_area_acres * 3.4, 2),
            sustainability_score=min(100, 50 + int(data.land_area_acres * 2) + registered_trees // 10),
            ngo_partner=project.ngo_partner,
            land_verified=registered_land > 0,
            trees_verified=False,
            insurance=InsuranceProtection(
                policy=InsurancePolicy.GREEN_SHIELD,
                status=InsuranceStatus.PENDING_VERIFICATION if registered_trees else InsuranceStatus.NOT_ELIGIBLE,
                protected_trees=insured_trees,
                claim_eligibility_percent=0,
                expiry_date=now + timedelta(days=365 * 3) if insured_trees else None,
            ),
            milestones=[
                ProjectMilestone(label="Land registration submitted", completed=False),
                ProjectMilestone(label="Admin verification pending", completed=False),
                ProjectMilestone(label="Active monitoring", completed=False),
                ProjectMilestone(label="MRV verification", completed=False),
                ProjectMilestone(label="Carbon estimation", completed=False),
            ],
            # Carbon Program roadmap: assigning a farmer only completes "Project
            # Assigned" (always) and "Land Register" (only if the farmer already
            # has registered land). Every remaining stage stays Pending — the
            # Admin advances them one at a time from the Carbon Projects panel.
            stage_project_assigned=True,
            stage_land_registered=registered_land > 0,
            joined_at=now,
            updated_at=now,
        )

        # Update farmer's verified land parcels to PROJECT_ASSIGNED
        parcels = await LandParcel.find(
            {"farmer_id": str(farmer.id), "is_deleted": {"$ne": True}}
        ).to_list()
        for p in parcels:
            if p.verification_status in (LandVerificationStatus.VERIFIED, LandVerificationStatus.APPROVED):
                p.verification_status = LandVerificationStatus.PROJECT_ASSIGNED
                p.updated_at = now
                await p.save()

        await self._enrollments.create(enrollment)
        return EnrollmentResponse(
            enrollment_id=str(enrollment.id),
            project_id=project_id,
            status=enrollment.status,
            current_stage=enrollment.current_stage,
            progress_percent=enrollment.progress_percent,
            message=f"Farmer assigned to project '{project.title}' by admin.",
        )

    async def admin_delete_enrollment(self, enrollment_id: str) -> None:
        """Admin soft-deletes a bad enrollment so farmer can be reassigned."""
        enrollment = await self._enrollments.get_by_id(enrollment_id)
        if not enrollment:
            raise NotFoundException("Enrollment not found", "ENROLLMENT_NOT_FOUND")
        enrollment.is_active = False
        enrollment.updated_at = datetime.now(timezone.utc)
        await enrollment.save()

        # Revert land parcels back to VERIFIED if no other active enrollments remain
        remaining = await ProjectEnrollment.find(
            {"farmer_id": enrollment.farmer_id, "is_active": True, "_id": {"$ne": enrollment.id}}
        ).to_list()
        if not remaining:
            parcels = await LandParcel.find(
                {"farmer_id": enrollment.farmer_id, "is_deleted": {"$ne": True}}
            ).to_list()
            for p in parcels:
                if p.verification_status == LandVerificationStatus.PROJECT_ASSIGNED:
                    p.verification_status = LandVerificationStatus.VERIFIED
                    p.updated_at = datetime.now(timezone.utc)
                    await p.save()

    async def admin_list_projects(self, include_inactive: bool = False) -> list[AdminProjectResponse]:
        projects = await self._projects.list_admin(include_inactive)
        return [self._admin_project_response(project) for project in projects]

    async def admin_list_enrollments(self) -> list[AdminProjectEnrollmentResponse]:
        enrollments = await self._enrollments.list_active()
        responses: list[AdminProjectEnrollmentResponse] = []
        for enrollment in enrollments:
            project = await self._project(enrollment.project_id)
            farmer_name = None
            if enrollment.farmer_id:
                try:
                    from beanie import PydanticObjectId
                    farmer = None
                    if PydanticObjectId.is_valid(enrollment.farmer_id):
                        farmer = await Farmer.get(PydanticObjectId(enrollment.farmer_id))
                    if not farmer:
                        farmer = await Farmer.find_one(Farmer.farmer_id == enrollment.farmer_id)
                    if not farmer:
                        farmer = await Farmer.find_one(Farmer.mobile == enrollment.farmer_id)

                    if farmer:
                        name = (farmer.full_name or "").strip()
                        if not name and farmer.mobile:
                            name = f"Farmer ({farmer.mobile})"
                        farmer_name = name or farmer.farmer_id or str(farmer.id)
                except Exception as err:
                    print("[admin_list_enrollments] farmer lookup notice:", err)

            if not farmer_name:
                fid_upper = enrollment.farmer_id[-6:].upper() if len(enrollment.farmer_id) >= 6 else enrollment.farmer_id
                farmer_name = f"Farmer #{fid_upper}"
            responses.append(
                AdminProjectEnrollmentResponse(
                    enrollment_id=str(enrollment.id),
                    farmer_id=enrollment.farmer_id,
                    farmer_name=farmer_name,
                    project_id=enrollment.project_id,
                    project_title=project.title,
                    status=enrollment.status,
                    current_stage=enrollment.current_stage,
                    current_stage_label=_stage_label(enrollment.current_stage),
                    progress_percent=enrollment.progress_percent,
                    land_area_acres=enrollment.land_area_acres,
                    registered_trees=enrollment.registered_trees,
                    insured_trees=enrollment.insured_trees,
                    green_family_count=enrollment.green_family_count,
                    estimated_carbon_impact=enrollment.estimated_carbon_impact,
                    land_verified=enrollment.land_verified,
                    trees_verified=enrollment.trees_verified,
                    mrv_verified=enrollment.mrv_verified,
                    insurance_active=enrollment.insurance.status == InsuranceStatus.ACTIVE,
                    joined_at=enrollment.joined_at,
                    updated_at=enrollment.updated_at,
                    stage_project_assigned=enrollment.stage_project_assigned,
                    stage_land_registered=enrollment.stage_land_registered,
                    stage_inspection_completed=enrollment.stage_inspection_completed,
                    stage_soil_verified=enrollment.stage_soil_verified,
                    stage_trees_registered=enrollment.stage_trees_registered,
                    stage_insurance_activated=enrollment.stage_insurance_activated,
                    stage_mrv_monitoring_started=enrollment.stage_mrv_monitoring_started,
                    stage_carbon_estimation_running=enrollment.stage_carbon_estimation_running,
                    stage_reward_eligible=enrollment.stage_reward_eligible,
                )
            )
        return responses

    async def admin_create_project(self, data: CreateProjectRequest) -> AdminProjectResponse:
        existing = await self._projects.get_by_project_id(data.project_id, active_only=False)
        if existing:
            raise ConflictException("Project ID already exists.", "PROJECT_ALREADY_EXISTS")
        now = datetime.now(timezone.utc)
        project = SustainabilityProject(
            **data.model_dump(),
            created_at=now,
            updated_at=now,
        )
        await self._projects.create(project)
        try:
            await self._notifications.broadcast_to_all_farmers(
                "New Carbon Project Available",
                "A new Carbon Project has been published. Check it from the Carbon Projects section.",
                type="project",
            )
        except Exception:
            logger.exception(f"Failed to broadcast new-project notification for project {project.id}")
        return self._admin_project_response(project)

    async def admin_update_project(
        self, project_id: str, data: UpdateProjectRequest
    ) -> AdminProjectResponse:
        project = await self._projects.get_by_project_id(project_id, active_only=False)
        if not project:
            raise NotFoundException("Project not found", "PROJECT_NOT_FOUND")
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(project, field, value)
        project.updated_at = datetime.now(timezone.utc)
        await project.save()
        return self._admin_project_response(project)

    async def admin_delete_project(self, project_id: str) -> None:
        from beanie import PydanticObjectId
        project = None
        if PydanticObjectId.is_valid(project_id):
            project = await SustainabilityProject.get(PydanticObjectId(project_id))
        if not project:
            project = await self._projects.get_by_project_id(project_id, active_only=False)
        if not project:
            raise NotFoundException("Project not found", "PROJECT_NOT_FOUND")

        await self._enrollments.model.find({"project_id": project.project_id}).delete()
        await project.delete()
