from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.tree_plan import PlanType


class TreePlanBase(BaseModel):
    plan_type: PlanType
    plan_name: str
    price: float
    billing_cycle: str
    cover: float
    badge_text: str
    badge_color: str
    description: str = Field(..., max_length=200)
    priority: int = 0
    is_active: bool = True
    is_recommended: bool = False
    icon: Optional[str] = None


class TreePlanCreate(TreePlanBase):
    pass


class TreePlanUpdate(BaseModel):
    plan_name: Optional[str] = None
    price: Optional[float] = None
    billing_cycle: Optional[str] = None
    cover: Optional[float] = None
    badge_text: Optional[str] = None
    badge_color: Optional[str] = None
    description: Optional[str] = Field(None, max_length=200)
    priority: Optional[int] = None
    is_active: Optional[bool] = None
    is_recommended: Optional[bool] = None
    icon: Optional[str] = None


class TreePlanResponse(TreePlanBase):
    id: str = Field(alias="_id", serialization_alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
