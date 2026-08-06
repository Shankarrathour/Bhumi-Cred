from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.models.admin_user import AdminUser
from app.services.admin_agri import AdminAgriService
from app.repositories.agri import AgriRepository
from app.dependencies.auth import CurrentAdmin

router = APIRouter(prefix="/admin/agri", tags=["Admin Agri Financial Hub"])

def get_admin_agri_service():
    repo = AgriRepository()
    return AdminAgriService(repo)

@router.get("/schemes")
async def get_all_schemes(
    admin: CurrentAdmin = None,
    service: AdminAgriService = Depends(get_admin_agri_service)
):
    """
    Get all active government agriculture schemes for admin.
    """
    return await service.get_all_schemes()

@router.get("/applications")
async def get_applications(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    current_step: Optional[str] = None,
    scheme_id: Optional[str] = None,
    search: Optional[str] = None,
    admin: CurrentAdmin = None,
    service: AdminAgriService = Depends(get_admin_agri_service)
):
    """
    Get submitted applications for admin.
    """
    return await service.get_applications(
        skip=skip,
        limit=limit,
        status=status,
        current_step=current_step,
        scheme_id=scheme_id,
        search=search
    )

@router.get("/applications/{application_id}")
async def get_application_details(
    application_id: str,
    admin: CurrentAdmin = None,
    service: AdminAgriService = Depends(get_admin_agri_service)
):
    """
    Get full details of a submitted application.
    """
    from beanie import PydanticObjectId
    from fastapi import HTTPException

    if not PydanticObjectId.is_valid(application_id):
        raise HTTPException(status_code=404, detail="Invalid application ID format")

    res = await service.get_application_details(application_id)
    if not res:
        raise HTTPException(status_code=404, detail="Application not found")
    return res

from pydantic import BaseModel

class AdminActionRequest(BaseModel):
    action: str
    remarks: str
    reason: Optional[str] = None

@router.post("/applications/{application_id}/action")
async def action_application(
    application_id: str,
    request: AdminActionRequest,
    admin: CurrentAdmin = None,
    service: AdminAgriService = Depends(get_admin_agri_service)
):
    """
    Generic action engine for an application.
    Supported actions: APPROVE, REJECT, REQUEST_CLARIFICATION
    """
    return await service.action_application(
        application_id=application_id,
        action=request.action,
        remarks=request.remarks,
        admin_id=str(admin.id) if admin else "system",
        admin_name=admin.name if admin else "System"
    )
