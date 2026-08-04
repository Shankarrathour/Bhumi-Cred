from fastapi import APIRouter, HTTPException, status
from typing import List

from app.dependencies.auth import CurrentAdmin
from app.models.climate_risk_insurance import ClimateRiskInsuranceCard
from app.schemas.climate_risk_insurance import (
    ClimateRiskInsuranceCardCreate,
    ClimateRiskInsuranceCardUpdate,
    ClimateRiskInsuranceCardResponse,
)
from app.schemas.common import SuccessResponse
from beanie import PydanticObjectId

router = APIRouter(prefix="/admin/climate-risk-insurance", tags=["Admin Climate Risk Tree Insurance"])


@router.get(
    "",
    response_model=SuccessResponse[List[ClimateRiskInsuranceCardResponse]],
    response_model_by_alias=True,
    summary="List all Climate Risk Tree Insurance cards",
)
async def list_climate_risk_insurance_cards(
    current_admin: CurrentAdmin,
) -> SuccessResponse[List[ClimateRiskInsuranceCardResponse]]:
    cards = await ClimateRiskInsuranceCard.find_all().sort("+display_order").to_list()

    formatted = []
    for card in cards:
        data = card.model_dump()
        data["id"] = str(card.id)
        data["_id"] = str(card.id)
        formatted.append(data)

    return SuccessResponse(message="Climate Risk Tree Insurance cards retrieved successfully.", data=formatted)


@router.post(
    "",
    response_model=SuccessResponse[ClimateRiskInsuranceCardResponse],
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Climate Risk Tree Insurance card",
)
async def create_climate_risk_insurance_card(
    data: ClimateRiskInsuranceCardCreate,
    current_admin: CurrentAdmin,
) -> SuccessResponse[ClimateRiskInsuranceCardResponse]:
    card = ClimateRiskInsuranceCard(**data.model_dump())
    await card.insert()

    response_data = card.model_dump()
    response_data["id"] = str(card.id)
    response_data["_id"] = str(card.id)

    return SuccessResponse(message="Climate Risk Tree Insurance card created successfully.", data=response_data)


@router.put(
    "/{id}",
    response_model=SuccessResponse[ClimateRiskInsuranceCardResponse],
    response_model_by_alias=True,
    summary="Update a Climate Risk Tree Insurance card",
)
async def update_climate_risk_insurance_card(
    id: PydanticObjectId,
    data: ClimateRiskInsuranceCardUpdate,
    current_admin: CurrentAdmin,
) -> SuccessResponse[ClimateRiskInsuranceCardResponse]:
    card = await ClimateRiskInsuranceCard.get(id)
    if not card:
        raise HTTPException(status_code=404, detail="Climate Risk Tree Insurance card not found")

    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        for k, v in update_data.items():
            setattr(card, k, v)
        from datetime import datetime, timezone
        card.updated_at = datetime.now(timezone.utc)
        await card.save()

    response_data = card.model_dump()
    response_data["id"] = str(card.id)
    response_data["_id"] = str(card.id)

    return SuccessResponse(message="Climate Risk Tree Insurance card updated successfully.", data=response_data)


@router.delete(
    "/{id}",
    response_model=SuccessResponse[None],
    summary="Delete a Climate Risk Tree Insurance card",
)
async def delete_climate_risk_insurance_card(
    id: PydanticObjectId,
    current_admin: CurrentAdmin,
) -> SuccessResponse[None]:
    card = await ClimateRiskInsuranceCard.get(id)
    if not card:
        raise HTTPException(status_code=404, detail="Climate Risk Tree Insurance card not found")

    await card.delete()
    return SuccessResponse(message="Climate Risk Tree Insurance card deleted successfully.", data=None)
