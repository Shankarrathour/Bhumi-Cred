from fastapi import APIRouter, Depends, Query
from typing import List

from app.dependencies.auth import CurrentFarmer
from app.models.tree_plan import TreePlan, PlanType
from app.schemas.tree_plan import TreePlanResponse
from app.schemas.common import SuccessResponse
import pymongo

router = APIRouter(prefix="/tree-plans", tags=["Mobile Tree Plans"])


@router.get(
    "",
    response_model=SuccessResponse[List[TreePlanResponse]],
    response_model_by_alias=True,
    summary="List active tree plans by type for mobile app",
)
async def list_mobile_tree_plans(
    current_farmer: CurrentFarmer,
    plan_type: PlanType = Query(...),
) -> SuccessResponse[List[TreePlanResponse]]:
    plans = await TreePlan.find(
        TreePlan.plan_type == plan_type,
        TreePlan.is_active == True
    ).sort(
        [("priority", pymongo.ASCENDING)]
    ).to_list()
    
    print(f"[DEBUG] Fetching mobile tree plans for {plan_type}")
    print(f"[DEBUG] Raw MongoDB Plans: {plans}")
    
    formatted_plans = []
    for plan in plans:
        data = plan.model_dump()
        data["id"] = str(plan.id)
        data["_id"] = str(plan.id)
        formatted_plans.append(data)
        
    print(f"[DEBUG] mobile_tree_plans: Fetched {len(formatted_plans)} active plans for type {plan_type}")
    
    return SuccessResponse(message="Tree plans retrieved successfully.", data=formatted_plans)