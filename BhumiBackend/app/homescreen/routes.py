from fastapi import APIRouter, Depends
from typing import List

from app.dependencies.auth import CurrentFarmer
from app.homescreen.services import EcologicalService
from app.homescreen.repositories import MilestoneRepository
from app.repositories.farmer import FarmerRepository
from app.repositories.project_enrollment import ProjectEnrollmentRepository
from app.schemas.common import SuccessResponse
from app.homescreen.schemas import (
    EcologicalOverview,
    EnvironmentalPulse,
    JourneyStep,
    MilestoneResponse,
    EnvironmentalTrends,
    EcologicalDashboardResponse,
)

router = APIRouter(prefix="/farmer/homescreen", tags=["Homescreen & Ecological Dashboard"])


def get_ecological_service() -> EcologicalService:
    return EcologicalService(
        milestone_repo=MilestoneRepository(),
        farmer_repo=FarmerRepository(),
        enrollment_repo=ProjectEnrollmentRepository(),
    )


@router.get(
    "/dashboard",
    response_model=SuccessResponse[EcologicalDashboardResponse],
    summary="Get full ecological and homescreen dashboard data",
)
async def get_dashboard(
    current_farmer: CurrentFarmer,
    svc: EcologicalService = Depends(get_ecological_service),
) -> SuccessResponse[EcologicalDashboardResponse]:
    data = await svc.get_dashboard(current_farmer)
    return SuccessResponse(message="Dashboard data retrieved successfully.", data=data)


@router.get(
    "/overview",
    response_model=SuccessResponse[EcologicalOverview],
    summary="Get ecological overview metrics",
)
async def get_overview(
    current_farmer: CurrentFarmer,
    svc: EcologicalService = Depends(get_ecological_service),
) -> SuccessResponse[EcologicalOverview]:
    data = await svc.get_ecological_overview(current_farmer)
    return SuccessResponse(message="Ecological overview retrieved successfully.", data=data)


@router.get(
    "/pulse",
    response_model=SuccessResponse[EnvironmentalPulse],
    summary="Get environmental pulse metrics",
)
async def get_pulse(
    current_farmer: CurrentFarmer,
    svc: EcologicalService = Depends(get_ecological_service),
) -> SuccessResponse[EnvironmentalPulse]:
    data = await svc.get_environmental_pulse(current_farmer)
    return SuccessResponse(message="Environmental pulse retrieved successfully.", data=data)


@router.get(
    "/journey",
    response_model=SuccessResponse[List[JourneyStep]],
    summary="Get farmer journey progression map",
)
async def get_journey(
    current_farmer: CurrentFarmer,
    svc: EcologicalService = Depends(get_ecological_service),
) -> SuccessResponse[List[JourneyStep]]:
    data = await svc.get_journey_map(current_farmer)
    return SuccessResponse(message="Farmer journey map retrieved successfully.", data=data)


@router.get(
    "/milestones",
    response_model=SuccessResponse[List[MilestoneResponse]],
    summary="Get ecosystem milestone timeline",
)
async def get_milestones(
    current_farmer: CurrentFarmer,
    svc: EcologicalService = Depends(get_ecological_service),
) -> SuccessResponse[List[MilestoneResponse]]:
    data = await svc.get_milestones(current_farmer)
    return SuccessResponse(message="Ecosystem milestones retrieved successfully.", data=data)


@router.get(
    "/trends",
    response_model=SuccessResponse[EnvironmentalTrends],
    summary="Get environmental trends metrics",
)
async def get_trends(
    current_farmer: CurrentFarmer,
    svc: EcologicalService = Depends(get_ecological_service),
) -> SuccessResponse[EnvironmentalTrends]:
    data = await svc.get_environmental_trends(current_farmer)
    return SuccessResponse(message="Environmental trends retrieved successfully.", data=data)

