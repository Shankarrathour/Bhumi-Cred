from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.dependencies.auth import CurrentAdmin
from app.repositories.land_parcel import LandParcelRepository
from app.repositories.farmer import FarmerRepository
from app.services.admin_land_service import AdminLandService
from app.schemas.admin_land import AdminLandParcelResponse
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/admin/lands", tags=["Admin – Land Management"])

def get_admin_land_service() -> AdminLandService:
    return AdminLandService(
        land_repo=LandParcelRepository(),
        farmer_repo=FarmerRepository()
    )

@router.get(
    "",
    response_model=PaginatedResponse[AdminLandParcelResponse],
    summary="List land parcels",
    description="Paginated list of all land parcels with optional filtering by status."
)
async def list_lands(
    current_admin: CurrentAdmin,
    svc: AdminLandService = Depends(get_admin_land_service),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    status: Optional[str] = Query(None, description="Filter by status (e.g. Pending, Verified)")
) -> PaginatedResponse[AdminLandParcelResponse]:
    return await svc.list_lands(page=page, limit=limit, status=status)

class UpdateLandStatusRequest(BaseModel):
    status: str
    remarks: Optional[str] = None
    correction_fields: Optional[list[str]] = None

@router.put(
    "/{land_id}/status",
    response_model=AdminLandParcelResponse,
    summary="Update land status"
)
async def update_land_status(
    land_id: str,
    payload: UpdateLandStatusRequest,
    current_admin: CurrentAdmin,
    svc: AdminLandService = Depends(get_admin_land_service)
) -> AdminLandParcelResponse:
    return await svc.update_land_status(land_id, payload.status, payload.remarks, payload.correction_fields)

class CreateLandParcelRequest(BaseModel):
    farmer_id: str
    survey_number: str
    area_acres: float
    state: Optional[str] = "Madhya Pradesh"
    district: Optional[str] = "Indore"
    crop_type: Optional[str] = "Agricultural Land"
    soil_type: Optional[str] = "Black Soil"
    is_irrigated: bool = True

@router.post(
    "",
    response_model=AdminLandParcelResponse,
    status_code=201,
    summary="Create land parcel for farmer"
)
async def create_land_parcel(
    payload: CreateLandParcelRequest,
    current_admin: CurrentAdmin,
    svc: AdminLandService = Depends(get_admin_land_service)
) -> AdminLandParcelResponse:
    return await svc.create_land_parcel(
        farmer_id=payload.farmer_id,
        survey_number=payload.survey_number,
        area_acres=payload.area_acres,
        state=payload.state,
        district=payload.district,
        crop_type=payload.crop_type,
        soil_type=payload.soil_type,
        is_irrigated=payload.is_irrigated
    )
