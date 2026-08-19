import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.dependencies.auth import CurrentFarmer, CurrentAdmin
from app.models.farmer_badge import FarmerBadge
from app.models.land import LandParcel
from app.models.soil_test import SoilTestBooking
from app.models.project_enrollment import ProjectEnrollment
from app.models.referral import FarmerReferral
from app.schemas.common import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Farmer Eco Badges"])


class BadgeItemResponse(BaseModel):
    id: str
    badge_code: str
    title: str
    level: int
    status: str  # "UNLOCKED", "LOCKED"
    description: str
    icon: str
    unlocked_reason: Optional[str] = None


class BadgeCabinetResponse(BaseModel):
    total_unlocked: int
    total_badges: int
    badges: List[BadgeItemResponse]


async def compute_farmer_badges(farmer_id_str: str) -> List[BadgeItemResponse]:
    # Query real MongoDB collections
    parcels_count = 0
    soil_tests_count = 0
    enrollments_count = 0
    referrals_count = 0

    try:
        parcels_count = await LandParcel.find(LandParcel.farmer_id == farmer_id_str).count()
    except Exception as e:
        logger.warning(f"Error checking parcels for badges: {e}")

    try:
        soil_tests_count = await SoilTestBooking.find(SoilTestBooking.farmer_id == farmer_id_str).count()
    except Exception as e:
        logger.warning(f"Error checking soil tests for badges: {e}")

    try:
        enrollments_count = await ProjectEnrollment.find(ProjectEnrollment.farmer_id == farmer_id_str).count()
    except Exception as e:
        logger.warning(f"Error checking enrollments for badges: {e}")

    try:
        referrals_count = await FarmerReferral.find(FarmerReferral.referrer_farmer_id == farmer_id_str).count()
    except Exception as e:
        logger.warning(f"Error checking referrals for badges: {e}")

    # Define 5 core Eco Badges with dynamic MongoDB evaluation
    b1_unlocked = parcels_count > 0
    b2_unlocked = soil_tests_count > 0
    b3_unlocked = enrollments_count > 0
    b4_unlocked = referrals_count > 0
    b5_unlocked = parcels_count > 0 and soil_tests_count > 0

    badges = [
        BadgeItemResponse(
            id="badge_land_owner",
            badge_code="land_owner",
            title="Land Owner",
            level=1 if b1_unlocked else 0,
            status="UNLOCKED" if b1_unlocked else "LOCKED",
            description="Awarded for registering verified cadastral land parcel in BhumiCred network.",
            icon="terrain",
            unlocked_reason=f"Registered {parcels_count} land parcel(s)" if b1_unlocked else "Register land parcel to unlock",
        ),
        BadgeItemResponse(
            id="badge_agro_hero",
            badge_code="agro_hero",
            title="Agro Hero",
            level=1 if b2_unlocked else 0,
            status="UNLOCKED" if b2_unlocked else "LOCKED",
            description="Awarded for completing certified soil organic carbon & NPK baseline audit.",
            icon="shovel",
            unlocked_reason=f"Completed {soil_tests_count} soil test audit(s)" if b2_unlocked else "Book soil test scan to unlock",
        ),
        BadgeItemResponse(
            id="badge_plant_champion",
            badge_code="plant_champion",
            title="Plant Champion",
            level=1 if b3_unlocked else 0,
            status="UNLOCKED" if b3_unlocked else "LOCKED",
            description="Awarded for active enrollment in green afforestation sustainability missions.",
            icon="tree",
            unlocked_reason=f"Enrolled in {enrollments_count} afforestation project(s)" if b3_unlocked else "Join project mission to unlock",
        ),
        BadgeItemResponse(
            id="badge_eco_networker",
            badge_code="eco_networker",
            title="Eco Networker",
            level=1 if b4_unlocked else 0,
            status="UNLOCKED" if b4_unlocked else "LOCKED",
            description="Awarded for referring farmer friends to join BhumiCred carbon network.",
            icon="account-group",
            unlocked_reason=f"Referred {referrals_count} farmer friend(s)" if b4_unlocked else "Refer 1 farmer friend to unlock",
        ),
        BadgeItemResponse(
            id="badge_carbon_pioneer",
            badge_code="carbon_pioneer",
            title="Carbon Pioneer",
            level=1 if b5_unlocked else 0,
            status="UNLOCKED" if b5_unlocked else "LOCKED",
            description="Master climate badge awarded for verified land geofence and soil readiness.",
            icon="medal",
            unlocked_reason="Land verified & soil carbon baseline ready" if b5_unlocked else "Complete land + soil audit to unlock",
        ),
    ]

    return badges


@router.get("/farmer/badges/my-cabinet", response_model=SuccessResponse[BadgeCabinetResponse])
async def get_my_badge_cabinet(current_farmer: CurrentFarmer):
    farmer_id_str = str(current_farmer.id)
    badges = await compute_farmer_badges(farmer_id_str)
    unlocked_count = sum(1 for b in badges if b.status == "UNLOCKED")

    data = BadgeCabinetResponse(
        total_unlocked=unlocked_count,
        total_badges=len(badges),
        badges=badges,
    )
    return SuccessResponse(message="Eco Badge Cabinet retrieved from MongoDB.", data=data)


@router.get("/admin/farmers/{farmer_id}/badges", response_model=SuccessResponse[BadgeCabinetResponse])
async def get_admin_farmer_badges(farmer_id: str, current_admin: CurrentAdmin):
    badges = await compute_farmer_badges(farmer_id)
    unlocked_count = sum(1 for b in badges if b.status == "UNLOCKED")

    data = BadgeCabinetResponse(
        total_unlocked=unlocked_count,
        total_badges=len(badges),
        badges=badges,
    )
    return SuccessResponse(message="Farmer Eco Badges retrieved for admin.", data=data)
