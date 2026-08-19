import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from beanie import PydanticObjectId

from app.dependencies.auth import CurrentFarmer, CurrentAdmin
from app.models.referral import FarmerReferral
from app.models.farmer import Farmer
from app.schemas.common import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Referrals & Rewards"])


class ReferredFarmerItem(BaseModel):
    id: str
    name: str
    village: str
    date: str
    status: str
    reward: str


class FarmerReferralSummaryResponse(BaseModel):
    referral_code: str
    farmers_invited: int
    cash_earned: float
    carbon_bonus_tco2e: float
    referred_farmers: List[ReferredFarmerItem]


@router.get("/farmer/referrals/my-code", response_model=SuccessResponse[FarmerReferralSummaryResponse])
async def get_farmer_referral_summary(current_farmer: CurrentFarmer):
    farmer_id_str = str(current_farmer.id)
    mobile_suffix = current_farmer.mobile[-4:] if current_farmer.mobile and len(current_farmer.mobile) >= 4 else "3449"
    referral_code = f"BHUMI-{mobile_suffix}"

    referrals: List[FarmerReferral] = []
    try:
        referrals = await FarmerReferral.find(
            FarmerReferral.referrer_farmer_id == farmer_id_str
        ).sort(-FarmerReferral.created_at).to_list()
    except Exception as e:
        logger.warning(f"Failed to query FarmerReferral from MongoDB: {e}")

    verified_count = sum(1 for r in referrals if r.status == "verified")
    cash_earned = sum(r.cash_reward for r in referrals if r.status == "verified")
    carbon_bonus = sum(r.carbon_reward_tco2e for r in referrals if r.status == "verified")

    referred_items = [
        ReferredFarmerItem(
            id=str(r.id),
            name=r.referred_farmer_name,
            village=r.referred_farmer_village or "Madhya Pradesh",
            date=r.created_at.strftime("%d %b %Y") if r.created_at else "",
            status="Verified" if r.status == "verified" else "Pending Verification",
            reward=f"₹{int(r.cash_reward)} + {int(r.carbon_reward_tco2e)} tCO₂e" if r.status == "verified" else "Pending",
        )
        for r in referrals
    ]

    data = FarmerReferralSummaryResponse(
        referral_code=referral_code,
        farmers_invited=len(referrals),
        cash_earned=cash_earned,
        carbon_bonus_tco2e=carbon_bonus,
        referred_farmers=referred_items,
    )
    return SuccessResponse(message="Referral summary retrieved from MongoDB.", data=data)


@router.get("/admin/referrals/all", response_model=SuccessResponse[List[dict]])
async def get_admin_all_referrals():
    referrals: List[FarmerReferral] = []
    try:
        referrals = await FarmerReferral.find_all().sort(-FarmerReferral.created_at).to_list()
    except Exception as e:
        logger.warning(f"Failed to query all referrals for admin: {e}")

    data = []
    for r in referrals:
        referrer_name = "Farmer"
        if r.referrer_farmer_id:
            try:
                if PydanticObjectId.is_valid(r.referrer_farmer_id):
                    f = await Farmer.get(PydanticObjectId(r.referrer_farmer_id))
                    if f and f.full_name:
                        referrer_name = f.full_name
            except Exception:
                pass

        data.append({
            "id": str(r.id),
            "referral_code": r.referral_code,
            "referrer_name": referrer_name,
            "referred_farmer_name": r.referred_farmer_name,
            "referred_farmer_phone": r.referred_farmer_phone,
            "village": r.referred_farmer_village or "Madhya Pradesh",
            "status": r.status,
            "cash_reward": r.cash_reward,
            "carbon_reward_tco2e": r.carbon_reward_tco2e,
            "created_at": r.created_at.isoformat() if r.created_at else ""
        })

    return SuccessResponse(message="Real MongoDB referrals retrieved for admin.", data=data)
