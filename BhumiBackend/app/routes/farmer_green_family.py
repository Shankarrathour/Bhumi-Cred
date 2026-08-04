from typing import List
from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
from app.dependencies.auth import CurrentFarmer
from app.models.farmer import Farmer
from app.schemas.green_family import CreateGreenFamilyRequest, GreenFamilyResponse
from app.services.farmer_green_family_service import FarmerGreenFamilyService, get_farmer_green_family_service

router = APIRouter(prefix="/farmer/green-family", tags=["Farmer Green Family"])

@router.post("", response_model=GreenFamilyResponse)
async def apply_for_cover(
    request_data: CreateGreenFamilyRequest,
    current_user: CurrentFarmer,
    service: FarmerGreenFamilyService = Depends(get_farmer_green_family_service)
):
    return await service.apply_for_cover(str(current_user.id), request_data)

@router.get("", response_model=List[GreenFamilyResponse])
async def list_my_covers(
    current_user: CurrentFarmer,
    service: FarmerGreenFamilyService = Depends(get_farmer_green_family_service)
):
    return await service.list_covers(str(current_user.id))

@router.get("/{cover_id}/certificate", response_class=HTMLResponse)
async def get_certificate(
    cover_id: str,
    current_user: CurrentFarmer,
    service: FarmerGreenFamilyService = Depends(get_farmer_green_family_service)
):
    return await service.generate_certificate_html(str(current_user.id), cover_id)
