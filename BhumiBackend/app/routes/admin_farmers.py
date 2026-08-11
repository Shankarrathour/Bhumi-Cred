from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Request

from app.config.settings import settings
from app.core.rbac import RequirePermission
from app.dependencies.auth import CurrentAdmin
from app.dependencies.services import get_admin_farmer_service
from app.models.admin_user import AdminUser
from app.models.farmer import KYCStatus
from app.models.farmer_activity import FarmerActivityLog
from app.utils.request import get_client_info
from app.schemas.admin_farmer import (
    AdminBankResponse,
    AdminFarmerDetailResponse,
    AdminFarmerListItem,
    AdminFarmerLocationTreeResponse,
    AdminIdentityResponse,
    UpdateIdentityRequest,
    UpdateFarmerStatusRequest,
    UpdateFarmerStatusResponse,
    RejectRequest,
    KYCActionResponse,
)
from app.schemas.common import PaginatedResponse, SuccessResponse
from app.schemas.family import FamilyMemberResponse
from app.schemas.land import (
    AdminLandVerificationItem,
    AdminLandVerificationRequest,
    LandSummaryResponse,
)
from app.schemas.farmer import FarmerActivityLogResponse
from app.services.admin_farmer_service import AdminFarmerService

router = APIRouter(prefix="/admin/farmers", tags=["Admin – Farmer Management"])


@router.get(
    "",
    response_model=PaginatedResponse[AdminFarmerListItem],
    summary="List farmers",
    description="Paginated list of all farmers with filtering. Guarded by RBAC view permission.",
)
async def list_farmers(
    current_admin: AdminUser = Depends(RequirePermission("farmer_management", "view")),
    svc: AdminFarmerService = Depends(get_admin_farmer_service),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE, description="Results per page"),
    kyc_status: Optional[KYCStatus] = Query(None, description="Filter by KYC status"),
    is_active: Optional[bool] = Query(None, description="Filter by active / inactive state"),
    state: Optional[str] = Query(None, description="Filter by state"),
    district: Optional[str] = Query(None, description="Filter by district"),
    village: Optional[str] = Query(None, description="Filter by village"),
    search: Optional[str] = Query(None, min_length=1, max_length=100, description="Search by name or mobile"),
) -> PaginatedResponse[AdminFarmerListItem]:
    return await svc.list_farmers(
        page=page,
        limit=limit,
        kyc_status=kyc_status,
        is_active=is_active,
        state=state,
        district=district,
        village=village,
        search=search,
    )


@router.get(
    "/land-verification",
    response_model=SuccessResponse[list[AdminLandVerificationItem]],
    summary="List land parcels for GIS verification",
)
async def list_land_verification_queue(
    current_admin: AdminUser = Depends(RequirePermission("land_management", "view")),
    svc: AdminFarmerService = Depends(get_admin_farmer_service),
) -> SuccessResponse[list[AdminLandVerificationItem]]:
    data = await svc.list_land_verification_queue()
    return SuccessResponse(message="Land verification queue retrieved successfully.", data=data)


@router.patch(
    "/land-verification/{parcel_id}",
    response_model=SuccessResponse[AdminLandVerificationItem],
    summary="Verify or reject a land parcel",
)
async def verify_land_parcel(
    parcel_id: str,
    payload: AdminLandVerificationRequest,
    current_admin: AdminUser = Depends(RequirePermission("land_management", "approve")),
    svc: AdminFarmerService = Depends(get_admin_farmer_service),
) -> SuccessResponse[AdminLandVerificationItem]:
    data = await svc.verify_land_parcel(parcel_id, payload)
    return SuccessResponse(message="Land verification updated successfully.", data=data)


@router.get(
    "/locations",
    response_model=SuccessResponse[AdminFarmerLocationTreeResponse],
    summary="Get real GIS location tree",
)
async def get_farmer_locations(
    current_admin: AdminUser = Depends(RequirePermission("farmer_management", "view")),
    svc: AdminFarmerService = Depends(get_admin_farmer_service),
) -> SuccessResponse[AdminFarmerLocationTreeResponse]:
    data = await svc.get_location_tree()
    return SuccessResponse(message="Location tree retrieved successfully.", data=data)


@router.get(
    "/{farmer_id}",
    response_model=SuccessResponse[AdminFarmerDetailResponse],
    summary="Get farmer detail",
)
async def get_farmer_detail(
    farmer_id: str,
    current_admin: AdminUser = Depends(RequirePermission("farmer_management", "view")),
    svc: AdminFarmerService = Depends(get_admin_farmer_service),
) -> SuccessResponse[AdminFarmerDetailResponse]:
    data = await svc.get_farmer_detail(farmer_id)
    return SuccessResponse(message="Farmer retrieved successfully.", data=data)


@router.get(
    "/{farmer_id}/family",
    response_model=SuccessResponse[list[FamilyMemberResponse]],
    summary="Get farmer family members",
)
async def get_farmer_family(
    farmer_id: str,
    current_admin: AdminUser = Depends(RequirePermission("farmer_management", "view")),
    svc: AdminFarmerService = Depends(get_admin_farmer_service),
) -> SuccessResponse[list[FamilyMemberResponse]]:
    data = await svc.get_farmer_family(farmer_id)
    return SuccessResponse(message="Family members retrieved successfully.", data=data)


@router.get(
    "/{farmer_id}/activity",
    response_model=SuccessResponse[List[FarmerActivityLogResponse]],
    summary="Get farmer activity timeline",
)
async def get_farmer_activity(
    farmer_id: str,
    current_admin: AdminUser = Depends(RequirePermission("farmer_management", "view")),
):
    logs = await FarmerActivityLog.find(
        FarmerActivityLog.farmer_id == farmer_id
    ).sort("-timestamp").to_list()

    items = [
        FarmerActivityLogResponse(
            id=str(l.id),
            activity_type=l.activity_type,
            title=l.title,
            description=l.description,
            timestamp=l.timestamp,
        )
        for l in logs
    ]
    return SuccessResponse(message="Activity timeline retrieved successfully.", data=items)


@router.get(
    "/{farmer_id}/land",
    response_model=SuccessResponse[LandSummaryResponse],
    summary="Get farmer land parcels",
)
async def get_farmer_land(
    farmer_id: str,
    current_admin: AdminUser = Depends(RequirePermission("farmer_management", "view")),
    svc: AdminFarmerService = Depends(get_admin_farmer_service),
) -> SuccessResponse[LandSummaryResponse]:
    data = await svc.get_farmer_land(farmer_id)
    return SuccessResponse(message="Land details retrieved successfully.", data=data)


@router.get(
    "/{farmer_id}/bank",
    response_model=SuccessResponse[AdminBankResponse],
    summary="Get farmer bank details",
)
async def get_farmer_bank(
    farmer_id: str,
    current_admin: AdminUser = Depends(RequirePermission("farmer_management", "view")),
    svc: AdminFarmerService = Depends(get_admin_farmer_service),
) -> SuccessResponse[AdminBankResponse]:
    data = await svc.get_farmer_bank(farmer_id)
    return SuccessResponse(message="Bank details retrieved successfully.", data=data)


@router.get(
    "/{farmer_id}/identity",
    response_model=SuccessResponse[AdminIdentityResponse],
    summary="Get farmer identity details",
)
async def get_farmer_identity(
    farmer_id: str,
    current_admin: AdminUser = Depends(RequirePermission("document_center", "view")),
    svc: AdminFarmerService = Depends(get_admin_farmer_service),
) -> SuccessResponse[AdminIdentityResponse]:
    data = await svc.get_farmer_identity(farmer_id)
    return SuccessResponse(message="Identity details retrieved successfully.", data=data)


@router.put(
    "/{farmer_id}/identity",
    response_model=SuccessResponse[AdminIdentityResponse],
    summary="Update farmer identity details",
)
async def update_farmer_identity(
    farmer_id: str,
    payload: UpdateIdentityRequest,
    current_admin: AdminUser = Depends(RequirePermission("document_center", "edit")),
    svc: AdminFarmerService = Depends(get_admin_farmer_service),
) -> SuccessResponse[AdminIdentityResponse]:
    data = await svc.update_farmer_identity(farmer_id, payload)
    return SuccessResponse(message="Farmer identity details updated successfully.", data=data)


@router.patch(
    "/{farmer_id}/status",
    response_model=SuccessResponse[UpdateFarmerStatusResponse],
    summary="Update farmer account status",
)
async def update_farmer_status(
    farmer_id: str,
    payload: UpdateFarmerStatusRequest,
    current_admin: AdminUser = Depends(RequirePermission("farmer_management", "edit")),
    svc: AdminFarmerService = Depends(get_admin_farmer_service),
) -> SuccessResponse[UpdateFarmerStatusResponse]:
    data = await svc.update_farmer_status(farmer_id, payload)
    return SuccessResponse(message=data.message, data=data)


@router.put(
    "/{farmer_id}/approve",
    response_model=SuccessResponse[KYCActionResponse],
    summary="Approve farmer KYC",
)
async def approve_farmer(
    farmer_id: str,
    request: Request,
    current_admin: AdminUser = Depends(RequirePermission("farmer_management", "approve")),
    svc: AdminFarmerService = Depends(get_admin_farmer_service),
) -> SuccessResponse[KYCActionResponse]:
    _, ip = get_client_info(request)
    data = await svc.approve_farmer(farmer_id, current_admin, ip_address=ip)
    return SuccessResponse(message=data.message, data=data)


@router.put(
    "/{farmer_id}/reject",
    response_model=SuccessResponse[KYCActionResponse],
    summary="Reject farmer KYC",
)
async def reject_farmer(
    farmer_id: str,
    payload: RejectRequest,
    request: Request,
    current_admin: AdminUser = Depends(RequirePermission("farmer_management", "reject")),
    svc: AdminFarmerService = Depends(get_admin_farmer_service),
) -> SuccessResponse[KYCActionResponse]:
    _, ip = get_client_info(request)
    data = await svc.reject_farmer(farmer_id, current_admin, payload.kyc_remarks, ip_address=ip)
    return SuccessResponse(message=data.message, data=data)


@router.put(
    "/{farmer_id}/block",
    response_model=SuccessResponse[KYCActionResponse],
    summary="Block farmer account",
)
async def block_farmer(
    farmer_id: str,
    request: Request,
    current_admin: AdminUser = Depends(RequirePermission("farmer_management", "edit")),
    svc: AdminFarmerService = Depends(get_admin_farmer_service),
) -> SuccessResponse[KYCActionResponse]:
    _, ip = get_client_info(request)
    data = await svc.block_farmer_account(farmer_id, current_admin, ip_address=ip)
    return SuccessResponse(message=data.message, data=data)


@router.put(
    "/{farmer_id}/unblock",
    response_model=SuccessResponse[KYCActionResponse],
    summary="Unblock farmer account",
)
async def unblock_farmer(
    farmer_id: str,
    request: Request,
    current_admin: AdminUser = Depends(RequirePermission("farmer_management", "edit")),
    svc: AdminFarmerService = Depends(get_admin_farmer_service),
) -> SuccessResponse[KYCActionResponse]:
    _, ip = get_client_info(request)
    data = await svc.unblock_farmer_account(farmer_id, current_admin, ip_address=ip)
    return SuccessResponse(message=data.message, data=data)


@router.put(
    "/{farmer_id}/assign-project",
    response_model=SuccessResponse[dict],
    summary="Assign carbon/forestry project to farmer",
)
async def assign_project_to_farmer(
    farmer_id: str,
    project_id: str = Query(..., description="Project ID to assign"),
    current_admin: AdminUser = Depends(RequirePermission("farmer_management", "edit")),
    svc: AdminFarmerService = Depends(get_admin_farmer_service),
) -> SuccessResponse[dict]:
    data = await svc.assign_project_to_farmer(farmer_id, project_id)
    return SuccessResponse(message="Project assigned to farmer successfully.", data=data)


@router.delete(
    "/{farmer_id}",
    response_model=SuccessResponse[dict],
    summary="Permanently delete a farmer",
    description=(
        "Hard-deletes the farmer and all associated records (land parcels, family members, "
        "activity logs, OTP sessions, registrations). After deletion the mobile number is freed — "
        "the farmer can re-register fresh from the app with any new details."
    ),
)
async def delete_farmer(
    farmer_id: str,
    request: Request,
    current_admin: AdminUser = Depends(RequirePermission("farmer_management", "delete")),
    svc: AdminFarmerService = Depends(get_admin_farmer_service),
) -> SuccessResponse[dict]:
    ip, _ = get_client_info(request)
    data = await svc.delete_farmer(farmer_id, current_admin, ip_address=ip)
    return SuccessResponse(message=data["message"], data=data)
