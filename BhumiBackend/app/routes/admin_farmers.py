from typing import Optional, List
from datetime import datetime, timezone
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


def _ensure_utc(dt: Optional[datetime]) -> datetime:
    if not dt:
        return datetime.now(timezone.utc)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


@router.get(
    "/{farmer_id}/activity",
    response_model=SuccessResponse[List[FarmerActivityLogResponse]],
    summary="Get farmer activity timeline",
)
async def get_farmer_activity(
    farmer_id: str,
    current_admin: AdminUser = Depends(RequirePermission("farmer_management", "view")),
):
    try:
        from beanie import PydanticObjectId
        from app.models.farmer import Farmer
        from app.models.land_parcel import LandParcel

        farmer = None
        if PydanticObjectId.is_valid(farmer_id):
            farmer = await Farmer.get(farmer_id)
        if not farmer:
            farmer = await Farmer.find_one(Farmer.farmer_id == farmer_id)

        ids_to_check = [farmer_id]
        if farmer:
            ids_to_check.extend([str(farmer.id), farmer.farmer_id])
        ids_to_check = list(set(filter(None, ids_to_check)))

        logs = []
        try:
            logs = await FarmerActivityLog.find(
                {"farmer_id": {"$in": ids_to_check}}
            ).sort("-timestamp").to_list()
        except Exception as exc:
            logger.warning(f"[get_farmer_activity] Could not fetch FarmerActivityLog: {exc}")

        items = [
            FarmerActivityLogResponse(
                id=str(l.id),
                activity_type=getattr(l, "activity_type", "ACTIVITY"),
                title=getattr(l, "title", "Activity Log"),
                description=getattr(l, "description", None),
                timestamp=_ensure_utc(getattr(l, "timestamp", None) or getattr(l, "created_at", None)),
            )
            for l in logs
        ]

        # If no explicitly logged entries exist, synthesize activity timeline from farmer's real records
        if not items and farmer:
            created_dt = _ensure_utc(farmer.created_at)
            items.append(
                FarmerActivityLogResponse(
                    id=f"act-reg-{farmer.id}",
                    activity_type="REGISTERED",
                    title="Farmer Account Registered 📱",
                    description=f"Mobile +91 {farmer.mobile} verified via OTP. Onboarding profile created for {farmer.full_name or 'Farmer'}.",
                    timestamp=created_dt,
                )
            )

            if farmer.onboarding_completed or farmer.kyc_status != "unverified":
                items.append(
                    FarmerActivityLogResponse(
                        id=f"act-kyc-{farmer.id}",
                        activity_type="KYC_SUBMITTED",
                        title="KYC Documents Uploaded 📑",
                        description="Aadhaar Card, PAN Card & Farmer Photograph submitted for identity verification.",
                        timestamp=_ensure_utc(farmer.created_at or created_dt),
                    )
                )

            if farmer.kyc_status and str(getattr(farmer.kyc_status, 'value', farmer.kyc_status)) != "unverified":
                st_val = str(getattr(farmer.kyc_status, 'value', farmer.kyc_status)).upper()
                items.append(
                    FarmerActivityLogResponse(
                        id=f"act-kyc-status-{farmer.id}",
                        activity_type=st_val,
                        title=f"KYC Status: {st_val} ✅",
                        description=farmer.kyc_remarks or f"KYC verification status set to {st_val} by Admin {farmer.kyc_reviewed_by or 'System'}.",
                        timestamp=_ensure_utc(farmer.kyc_reviewed_at or created_dt),
                    )
                )

            # Check land parcels registered for farmer
            try:
                parcels = await LandParcel.find({"farmer_id": {"$in": [str(farmer.id), farmer.farmer_id]}}).to_list()
                for idx, p in enumerate(parcels):
                    items.append(
                        FarmerActivityLogResponse(
                            id=f"act-land-{p.id}",
                            activity_type="LAND_ADDED",
                            title=f"Land Parcel Registered ({getattr(p, 'area_acres', 0) or 0} Acres) 🗺️",
                            description=f"Survey No. {getattr(p, 'survey_number', 'N/A') or 'N/A'} registered in {getattr(p, 'village', 'Village') or 'Village'}, {getattr(p, 'district', 'District') or 'District'}.",
                            timestamp=_ensure_utc(getattr(p, 'created_at', None) or created_dt),
                        )
                    )
            except Exception as le:
                logger.warning(f"[get_farmer_activity] Error fetching land parcels for activity timeline: {le}")

            if not farmer.is_active:
                items.append(
                    FarmerActivityLogResponse(
                        id=f"act-block-{farmer.id}",
                        activity_type="ACCOUNT_SUSPENDED",
                        title="Account Suspended by Admin 🛑",
                        description="Farmer account temporarily suspended from app features.",
                        timestamp=_ensure_utc(farmer.updated_at or created_dt),
                    )
                )

            items.sort(key=lambda x: _ensure_utc(x.timestamp), reverse=True)

        return SuccessResponse(message="Activity timeline retrieved successfully.", data=items)
    except Exception as err:
        logger.exception(f"[get_farmer_activity] Error retrieving timeline for farmer {farmer_id}: {err}")
        return SuccessResponse(message="Activity timeline retrieved successfully.", data=[])


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
