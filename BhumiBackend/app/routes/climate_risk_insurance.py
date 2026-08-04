from fastapi import APIRouter
from typing import List

from app.dependencies.auth import CurrentFarmer
from app.models.climate_risk_insurance import ClimateRiskInsuranceCard
from app.schemas.climate_risk_insurance import ClimateRiskInsuranceCardResponse
from app.schemas.common import SuccessResponse

router = APIRouter(prefix="/climate-risk-insurance", tags=["Climate Risk Tree Insurance"])


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
        formatted.append(data)

    return SuccessResponse(message="Climate Risk Tree Insurance cards retrieved successfully.", data=formatted)
