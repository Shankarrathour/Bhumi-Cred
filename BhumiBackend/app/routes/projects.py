from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.dependencies.auth import CurrentAdmin, CurrentFarmer, VerifiedFarmer
from app.dependencies.services import get_projects_service
from app.schemas.common import SuccessResponse
from app.schemas.projects import (
    AdminProjectReviewRequest,
    EnrollmentResponse,
    JoinProjectRequest,
    ProjectDetailResponse,
    ProjectsHubResponse,
    ProjectSummaryResponse,
    TreeRegistrationRequest,
)
from app.services.projects_service import ProjectsService

router = APIRouter(prefix="/projects", tags=["BhumiCred Projects Hub"])


@router.get(
    "/hub",
    response_model=SuccessResponse[ProjectsHubResponse],
    summary="Get BhumiCred Projects Hub dashboard",
)
async def get_projects_hub(
    current_farmer: CurrentFarmer,
    svc: ProjectsService = Depends(get_projects_service),
) -> SuccessResponse[ProjectsHubResponse]:
    data = await svc.get_hub(str(current_farmer.id))
    return SuccessResponse(message="Projects Hub retrieved successfully.", data=data)


@router.get(
    "",
    response_model=SuccessResponse[list[ProjectSummaryResponse]],
    summary="Explore sustainability projects",
)
async def list_projects(
    current_farmer: CurrentFarmer,
    search: Optional[str] = Query(None, min_length=2, max_length=80),
    svc: ProjectsService = Depends(get_projects_service),
) -> SuccessResponse[list[ProjectSummaryResponse]]:
    data = await svc.list_projects(str(current_farmer.id), search)
    return SuccessResponse(message="Projects retrieved successfully.", data=data)


@router.get(
    "/{project_id}",
    response_model=SuccessResponse[ProjectDetailResponse],
    summary="Get project roadmap and requirements",
)
async def get_project(
    project_id: str,
    current_farmer: CurrentFarmer,
    svc: ProjectsService = Depends(get_projects_service),
) -> SuccessResponse[ProjectDetailResponse]:
    data = await svc.get_project(str(current_farmer.id), project_id)
    return SuccessResponse(message="Project details retrieved successfully.", data=data)


@router.post(
    "/{project_id}/join",
    response_model=SuccessResponse[EnrollmentResponse],
    status_code=201,
    summary="Join a carbon sustainability project",
)
async def join_project(
    project_id: str,
    payload: JoinProjectRequest,
    current_farmer: VerifiedFarmer,
    svc: ProjectsService = Depends(get_projects_service),
) -> SuccessResponse[EnrollmentResponse]:
    data = await svc.join_project(str(current_farmer.id), project_id, payload)
    return SuccessResponse(message="Project join request submitted.", data=data)


@router.post(
    "/{project_id}/trees",
    response_model=SuccessResponse[EnrollmentResponse],
    summary="Register trees for monitoring and insurance",
)
async def register_trees(
    project_id: str,
    payload: TreeRegistrationRequest,
    current_farmer: VerifiedFarmer,
    svc: ProjectsService = Depends(get_projects_service),
) -> SuccessResponse[EnrollmentResponse]:
    data = await svc.register_trees(str(current_farmer.id), project_id, payload)
    return SuccessResponse(message="Trees registered successfully.", data=data)


@router.patch(
    "/admin/enrollments/{enrollment_id}/review",
    response_model=SuccessResponse[EnrollmentResponse],
    summary="Admin review for project lifecycle, MRV, and insurance",
)
async def admin_review_project_enrollment(
    enrollment_id: str,
    payload: AdminProjectReviewRequest,
    current_admin: CurrentAdmin,
    svc: ProjectsService = Depends(get_projects_service),
) -> SuccessResponse[EnrollmentResponse]:
    data = await svc.admin_review(enrollment_id, payload)
    return SuccessResponse(message="Project enrollment reviewed successfully.", data=data)
