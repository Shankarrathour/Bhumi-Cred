from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.dependencies.auth import CurrentAdmin
from app.models.tree_plan import TreePlan
from app.schemas.tree_plan import TreePlanCreate, TreePlanUpdate, TreePlanResponse
from app.schemas.common import SuccessResponse
from beanie import PydanticObjectId

router = APIRouter(prefix="/admin/tree-plans", tags=["Admin Tree Plans"])


@router.get(
    "",
    response_model=SuccessResponse[List[TreePlanResponse]],
    response_model_by_alias=True,
    summary="List all tree plans",
)
async def list_tree_plans(
    current_admin: CurrentAdmin,
) -> SuccessResponse[List[TreePlanResponse]]:
    plans = await TreePlan.find_all().to_list()
    
    formatted_plans = []
    for plan in plans:
        data = plan.model_dump()
        data["id"] = str(plan.id)
        data["_id"] = str(plan.id)
        formatted_plans.append(data)
        
    return SuccessResponse(message="Tree plans retrieved successfully.", data=formatted_plans)


@router.post(
    "",
    response_model=SuccessResponse[TreePlanResponse],
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new tree plan",
)
async def create_tree_plan(
    data: TreePlanCreate,
    current_admin: CurrentAdmin,
) -> SuccessResponse[TreePlanResponse]:
    plan = TreePlan(**data.model_dump())
    await plan.insert()
    
    response_data = plan.model_dump()
    response_data["id"] = str(plan.id)
    response_data["_id"] = str(plan.id)
    
    return SuccessResponse(message="Tree plan created successfully.", data=response_data)


@router.put(
    "/{id}",
    response_model=SuccessResponse[TreePlanResponse],
    response_model_by_alias=True,
    summary="Update a tree plan",
)
async def update_tree_plan(
    id: PydanticObjectId,
    data: TreePlanUpdate,
    current_admin: CurrentAdmin,
) -> SuccessResponse[TreePlanResponse]:
    plan = await TreePlan.get(id)
    if not plan:
        raise HTTPException(status_code=404, detail="Tree plan not found")
    
    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        for k, v in update_data.items():
            setattr(plan, k, v)
        from datetime import datetime, timezone
        plan.updated_at = datetime.now(timezone.utc)
        await plan.save()

    response_data = plan.model_dump()
    response_data["id"] = str(plan.id)
    response_data["_id"] = str(plan.id)

    return SuccessResponse(message="Tree plan updated successfully.", data=response_data)


@router.post(
    "/{id}/duplicate",
    response_model=SuccessResponse[TreePlanResponse],
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
    summary="Duplicate a tree plan",
)
async def duplicate_tree_plan(
    id: PydanticObjectId,
    current_admin: CurrentAdmin,
) -> SuccessResponse[TreePlanResponse]:
    plan = await TreePlan.get(id)
    if not plan:
        raise HTTPException(status_code=404, detail="Tree plan not found")
    
    new_plan_data = plan.model_dump(exclude={"id", "created_at", "updated_at"})
    new_plan_data["plan_name"] = f"{new_plan_data['plan_name']} Copy"
    
    new_plan = TreePlan(**new_plan_data)
    await new_plan.insert()
    
    response_data = new_plan.model_dump()
    response_data["id"] = str(new_plan.id)
    response_data["_id"] = str(new_plan.id)
    
    return SuccessResponse(message="Tree plan duplicated successfully.", data=response_data)


@router.delete(
    "/{id}",
    response_model=SuccessResponse[None],
    summary="Delete a tree plan",
)
async def delete_tree_plan(
    id: PydanticObjectId,
    current_admin: CurrentAdmin,
) -> SuccessResponse[None]:
    plan = await TreePlan.get(id)
    if not plan:
        raise HTTPException(status_code=404, detail="Tree plan not found")
    
    await plan.delete()
    return SuccessResponse(message="Tree plan deleted successfully.", data=None)
