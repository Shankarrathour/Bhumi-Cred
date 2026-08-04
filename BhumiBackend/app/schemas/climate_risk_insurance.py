from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class ClimateRiskInsuranceCardBase(BaseModel):
    title: str
    subtitle: Optional[str] = None
    description: str
    features: List[str] = Field(default_factory=list)
    price: float
    button_text: Optional[str] = None
    badge: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class ClimateRiskInsuranceCardCreate(ClimateRiskInsuranceCardBase):
    pass


class ClimateRiskInsuranceCardUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    price: Optional[float] = None
    button_text: Optional[str] = None
    badge: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class ClimateRiskInsuranceCardResponse(ClimateRiskInsuranceCardBase):
    id: str = Field(alias="_id", serialization_alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
