from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel

from app.dependencies.auth import CurrentFarmer
from app.models.climate_risk_insurance import ClimateRiskInsuranceCard
from app.schemas.climate_risk_insurance import ClimateRiskInsuranceCardResponse
from app.schemas.common import SuccessResponse

router = APIRouter(prefix="/climate-risk-insurance", tags=["Climate Risk Tree Insurance"])


# ── Request schemas ──────────────────────────────────────────────────────────

class RegisterTreesRequest(BaseModel):
    tree_count: int

class ClaimRequest(BaseModel):
    amount: float
    reason: Optional[str] = None


@router.get(
    "",
    response_model=SuccessResponse[List[ClimateRiskInsuranceCardResponse]],
    response_model_by_alias=True,
    summary="List active Climate Risk Tree Insurance cards for the Farmer App",
)
async def list_climate_risk_insurance_cards(
    current_farmer: CurrentFarmer,
) -> SuccessResponse[List[ClimateRiskInsuranceCardResponse]]:
    cards = await ClimateRiskInsuranceCard.find(
        ClimateRiskInsuranceCard.is_active == True
    ).sort("+display_order").to_list()

    formatted = []
    for card in cards:
        data = card.model_dump()
        data["id"] = str(card.id)
        data["_id"] = str(card.id)
        # Normalize field names so the frontend mapping works
        data["name"] = data.get("title", "")
        data["premium_amount"] = data.get("price", 0)
        data["coverage_amount"] = data.get("price", 0) * 40  # estimated 40x coverage
        formatted.append(data)

    return SuccessResponse(message="Climate Risk Tree Insurance cards retrieved successfully.", data=formatted)


@router.post("/{policy_id}/register", summary="Register trees under a climate risk insurance policy")
async def register_trees(
    policy_id: str,
    payload: RegisterTreesRequest,
    farmer: CurrentFarmer,
) -> dict:
    """Register a number of trees under a given insurance policy for the farmer.
    Currently acknowledged and stored as a notification-level event.
    Returns a success response the frontend can act on.
    """
    card = await ClimateRiskInsuranceCard.get(policy_id)
    if not card or not card.is_active:
        raise HTTPException(status_code=404, detail="Insurance policy not found.")

    if payload.tree_count <= 0:
        raise HTTPException(status_code=400, detail="Tree count must be greater than 0.")

    # Send a notification to the farmer confirming registration
    try:
        from app.models.notification import Notification
        notif = Notification(
            farmer_id=str(farmer.id),
            title="Tree Insurance Registration",
            message=f"You have successfully registered {payload.tree_count} trees under '{card.title}' insurance policy.",
            type="insurance",
        )
        await notif.insert()
    except Exception:
        pass  # Notification failure should not block registration response

    return {
        "success": True,
        "message": f"Successfully registered {payload.tree_count} trees under '{card.title}'.",
        "data": {
            "policy_id": policy_id,
            "policy_name": card.title,
            "trees_registered": payload.tree_count,
            "farmer_id": str(farmer.id),
        },
    }


@router.post("/{policy_id}/claim", summary="File a claim under a climate risk insurance policy")
async def file_claim(
    policy_id: str,
    payload: ClaimRequest,
    farmer: CurrentFarmer,
) -> dict:
    """File an insurance claim for a given policy. Creates a notification for the farmer."""
    card = await ClimateRiskInsuranceCard.get(policy_id)
    if not card or not card.is_active:
        raise HTTPException(status_code=404, detail="Insurance policy not found.")

    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Claim amount must be greater than 0.")

    # Send notification about the claim
    try:
        from app.models.notification import Notification
        notif = Notification(
            farmer_id=str(farmer.id),
            title="Insurance Claim Submitted",
            message=f"Your claim of ₹{payload.amount:.0f} under '{card.title}' has been submitted and is under review.",
            type="insurance",
        )
        await notif.insert()
    except Exception:
        pass

    return {
        "success": True,
        "message": "Insurance claim submitted successfully. Our team will review it shortly.",
        "data": {
            "policy_id": policy_id,
            "policy_name": card.title,
            "claim_amount": payload.amount,
            "reason": payload.reason,
            "status": "Under Review",
            "farmer_id": str(farmer.id),
        },
    }
