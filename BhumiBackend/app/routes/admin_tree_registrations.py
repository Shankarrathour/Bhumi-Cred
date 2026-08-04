from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.dependencies.auth import CurrentAdmin
from app.dependencies.services import get_tree_registration_service
from app.schemas.common import SuccessResponse, PaginatedResponse
from app.schemas.tree_registration import (
    AdminTreeRegistrationResponse,
    TreeRegistrationStatus,
)
from app.services.tree_registration_service import TreeRegistrationService

router = APIRouter(prefix="/admin/tree-registrations", tags=["Admin Tree Registrations"])


@router.get(
    "",
    response_model=PaginatedResponse[AdminTreeRegistrationResponse],
    summary="List all tree registrations with farmer details",
)
async def list_tree_registrations(
    current_admin: CurrentAdmin,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[TreeRegistrationStatus] = None,
    search: Optional[str] = Query(None),
    svc: TreeRegistrationService = Depends(get_tree_registration_service),
) -> PaginatedResponse[AdminTreeRegistrationResponse]:
    data, total = await svc.get_all_registrations(skip, limit, status, search)
    from app.schemas.common import PaginationMeta
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    page = (skip // limit) + 1 if limit > 0 else 1
    return PaginatedResponse(
        data=data,
        meta=PaginationMeta(
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    )


@router.get(
    "/{id}",
    response_model=SuccessResponse[AdminTreeRegistrationResponse],
    summary="Get a specific tree registration details for admin",
)
async def get_tree_registration(
    id: str,
    current_admin: CurrentAdmin,
    svc: TreeRegistrationService = Depends(get_tree_registration_service),
) -> SuccessResponse[AdminTreeRegistrationResponse]:
    data = await svc.get_registration_by_id(id)
    return SuccessResponse(message="Tree registration retrieved successfully.", data=data)


@router.patch(
    "/{id}/approve",
    response_model=SuccessResponse[AdminTreeRegistrationResponse],
    summary="Approve a tree registration",
)
async def approve_registration(
    id: str,
    current_admin: CurrentAdmin,
    remarks: Optional[str] = None,
    svc: TreeRegistrationService = Depends(get_tree_registration_service),
) -> SuccessResponse[AdminTreeRegistrationResponse]:
    data = await svc.update_status(id, TreeRegistrationStatus.APPROVED, remarks)
    return SuccessResponse(message="Tree registration approved successfully.", data=data)


@router.patch(
    "/{id}/reject",
    response_model=SuccessResponse[AdminTreeRegistrationResponse],
    summary="Reject a tree registration",
)
async def reject_registration(
    id: str,
    current_admin: CurrentAdmin,
    remarks: Optional[str] = None,
    svc: TreeRegistrationService = Depends(get_tree_registration_service),
) -> SuccessResponse[AdminTreeRegistrationResponse]:
    data = await svc.update_status(id, TreeRegistrationStatus.REJECTED, remarks)
    return SuccessResponse(message="Tree registration rejected successfully.", data=data)


from pydantic import BaseModel

class AdminCreateTreeRequest(BaseModel):
    farmer_id: str
    tree_name: str = "Teak & Mahogany Plantation"
    tree_species: str = "Teak"
    tree_count: int = 10
    tree_age: int = 12
    plantation_year: int = 2026
    village: Optional[str] = "Anuppur"
    district: Optional[str] = "Anuppur"
    state: Optional[str] = "Madhya Pradesh"
    insurance_required: bool = True

@router.post(
    "",
    response_model=SuccessResponse[AdminTreeRegistrationResponse],
    status_code=201,
    summary="Create tree registration for farmer"
)
async def create_tree_registration(
    payload: AdminCreateTreeRequest,
    current_admin: CurrentAdmin,
    svc: TreeRegistrationService = Depends(get_tree_registration_service),
) -> SuccessResponse[AdminTreeRegistrationResponse]:
    from app.models.farmer import Farmer
    from app.schemas.tree_registration import RegisterTreeRequest
    from bson import ObjectId
    
    farmer = None
    if ObjectId.is_valid(payload.farmer_id):
        farmer = await Farmer.get(ObjectId(payload.farmer_id))
    if not farmer:
        farmer = await Farmer.find_one(Farmer.farmer_id == payload.farmer_id)
    if not farmer:
        farmer = await Farmer.find_one(Farmer.mobile == payload.farmer_id)
        
    fid = str(farmer.id) if farmer else payload.farmer_id
    
    reg_req = RegisterTreeRequest(
        tree_name=payload.tree_name,
        tree_species=payload.tree_species,
        tree_count=payload.tree_count,
        tree_age=payload.tree_age,
        plantation_year=payload.plantation_year,
        latitude=22.9734,
        longitude=78.6569,
        village=payload.village or (farmer.village if farmer else "Anuppur"),
        district=payload.district or (farmer.district if farmer else "Anuppur"),
        state=payload.state or (farmer.state if farmer else "Madhya Pradesh"),
        insurance_required=payload.insurance_required,
        remarks="Created via Admin Panel"
    )
    reg_resp = await svc.register_tree(fid, reg_req)
    admin_resp = await svc.get_registration_by_id(reg_resp.id)
    return SuccessResponse(message="Tree registration created successfully.", data=admin_resp)
