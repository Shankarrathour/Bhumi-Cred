from fastapi import APIRouter, Depends, Query

from app.dependencies.auth import CurrentAdmin, require_roles
from app.dependencies.services import get_projects_service
from app.models.admin_user import AdminRole
from app.schemas.common import SuccessResponse
from app.schemas.projects import (
    AdminProjectEnrollmentResponse,
    AdminProjectResponse,
    AdminAssignProjectRequest,
    CreateProjectRequest,
    UpdateProjectRequest,
    EnrollmentResponse,
)
from app.services.projects_service import ProjectsService

router = APIRouter(prefix="/admin/projects", tags=["Admin - Carbon Projects"])

_PROJECT_ADMIN_ROLES = (
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_ADMIN,
    AdminRole.CARBON_PROJECT_MANAGER,
)


@router.get(
    "",
    response_model=SuccessResponse[list[AdminProjectResponse]],
    summary="List real sustainability projects",
)
async def list_admin_projects(
    current_admin: CurrentAdmin,
    include_inactive: bool = Query(False),
    svc: ProjectsService = Depends(get_projects_service),
) -> SuccessResponse[list[AdminProjectResponse]]:
    data = await svc.admin_list_projects(include_inactive=include_inactive)
    return SuccessResponse(message="Projects retrieved successfully.", data=data)


@router.get(
    "/enrollments",
    response_model=SuccessResponse[list[AdminProjectEnrollmentResponse]],
    summary="List farmer project enrollments for lifecycle review",
    dependencies=[Depends(require_roles(*_PROJECT_ADMIN_ROLES))],
)
async def list_admin_project_enrollments(
    current_admin: CurrentAdmin,
    svc: ProjectsService = Depends(get_projects_service),
) -> SuccessResponse[list[AdminProjectEnrollmentResponse]]:
    data = await svc.admin_list_enrollments()
    return SuccessResponse(message="Project enrollments retrieved successfully.", data=data)


@router.post(
    "",
    response_model=SuccessResponse[AdminProjectResponse],
    status_code=201,
    summary="Create real sustainability project",
    dependencies=[Depends(require_roles(*_PROJECT_ADMIN_ROLES))],
)
async def create_admin_project(
    payload: CreateProjectRequest,
    current_admin: CurrentAdmin,
    svc: ProjectsService = Depends(get_projects_service),
) -> SuccessResponse[AdminProjectResponse]:
    data = await svc.admin_create_project(payload)
    return SuccessResponse(message="Project created successfully.", data=data)


@router.patch(
    "/{project_id}",
    response_model=SuccessResponse[AdminProjectResponse],
    summary="Update real sustainability project",
    dependencies=[Depends(require_roles(*_PROJECT_ADMIN_ROLES))],
)
async def update_admin_project(
    project_id: str,
    payload: UpdateProjectRequest,
    current_admin: CurrentAdmin,
    svc: ProjectsService = Depends(get_projects_service),
) -> SuccessResponse[AdminProjectResponse]:
    data = await svc.admin_update_project(project_id, payload)
    return SuccessResponse(message="Project updated successfully.", data=data)


@router.post(
    "/{project_id}/assign",
    response_model=SuccessResponse[EnrollmentResponse],
    status_code=201,
    summary="Admin assigns a farmer directly to a project",
    dependencies=[Depends(require_roles(*_PROJECT_ADMIN_ROLES))],
)
async def admin_assign_project_to_farmer(
    project_id: str,
    payload: AdminAssignProjectRequest,
    current_admin: CurrentAdmin,
    svc: ProjectsService = Depends(get_projects_service),
) -> SuccessResponse[EnrollmentResponse]:
    data = await svc.admin_assign_project(project_id, payload)
    return SuccessResponse(message=data.message, data=data)


@router.delete(
    "/enrollments/{enrollment_id}",
    response_model=SuccessResponse[dict],
    summary="Admin removes a bad/duplicate enrollment",
    dependencies=[Depends(require_roles(*_PROJECT_ADMIN_ROLES))],
)
async def admin_delete_enrollment(
    enrollment_id: str,
    current_admin: CurrentAdmin,
    svc: ProjectsService = Depends(get_projects_service),
) -> SuccessResponse[dict]:
    await svc.admin_delete_enrollment(enrollment_id)
    return SuccessResponse(message="Enrollment removed successfully.", data={"enrollment_id": enrollment_id})
