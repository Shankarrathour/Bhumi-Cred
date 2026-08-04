from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import HTMLResponse
from app.dependencies.auth import CurrentAdmin
from app.models.admin_user import AdminUser
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.green_family import GreenFamilyResponse, AdminUpdateGreenFamilyStatusRequest
from app.services.admin_green_family_service import AdminGreenFamilyService, get_admin_green_family_service

router = APIRouter(prefix="/admin/green-family", tags=["Admin Green Family"])

@router.get("", response_model=PaginatedResponse[GreenFamilyResponse])
async def list_all_covers(
    current_admin: CurrentAdmin,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    service: AdminGreenFamilyService = Depends(get_admin_green_family_service)
) -> PaginatedResponse[GreenFamilyResponse]:
    covers, total = await service.list_all_covers(skip=skip, limit=limit, search=search, status=status)
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    page = (skip // limit) + 1 if limit > 0 else 1
    return PaginatedResponse(
        data=covers,
        meta=PaginationMeta(total=total, page=page, limit=limit, total_pages=total_pages),
    )

@router.put("/{cover_id}/status", response_model=GreenFamilyResponse)
async def update_cover_status(
    cover_id: str,
    request_data: AdminUpdateGreenFamilyStatusRequest,
    current_admin: CurrentAdmin,
    service: AdminGreenFamilyService = Depends(get_admin_green_family_service)
):
    return await service.update_cover_status(cover_id, request_data.status)

@router.get("/{cover_id}/certificate", response_class=HTMLResponse)
async def get_certificate(
    cover_id: str,
    current_admin: CurrentAdmin,
    service: AdminGreenFamilyService = Depends(get_admin_green_family_service)
):
    return await service.generate_certificate_html(cover_id)
