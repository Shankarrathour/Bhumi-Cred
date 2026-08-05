from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from beanie import PydanticObjectId
from app.models.tree_insurance import PolicyStatus, DamageCause, ClaimStatus, SettlementMethod, SpeciesPremiumItem


class TreeInsurancePolicyCreateSchema(BaseModel):
    farmer_id: PydanticObjectId
    land_id: PydanticObjectId
    insurance_company_id: PydanticObjectId
    policy_name: str = "Green Shield Tree Cover"
    trees_insured_count: int = Field(..., gt=0)
    species_breakdown: List[SpeciesPremiumItem] = Field(default_factory=list)
    sum_insured_inr: float = Field(..., gt=0)
    annual_premium_inr: float = Field(..., gt=0)
    subsidy_amount_inr: float = Field(default=0.0, ge=0)
    farmer_payable_premium_inr: float = Field(..., ge=0)
    start_date: datetime
    expiry_date: datetime


class TreeInsuranceClaimCreateSchema(BaseModel):
    policy_id: PydanticObjectId
    farmer_id: PydanticObjectId
    damaged_trees_count: int = Field(..., gt=0)
    damage_cause: DamageCause
    damage_date: datetime
    claimed_amount_inr: float = Field(..., gt=0)
    is_govt_calamity_declared: bool = False
    state_disaster_relief_ref: Optional[str] = None
    damage_photos: List[str] = Field(default_factory=list)


class TreeInsurancePolicyResponseSchema(BaseModel):
    id: str
    policy_number: str
    farmer_id: PydanticObjectId
    land_id: PydanticObjectId
    insurance_company_id: PydanticObjectId
    policy_name: str
    trees_insured_count: int
    sum_insured_inr: float
    annual_premium_inr: float
    subsidy_amount_inr: float
    farmer_payable_premium_inr: float
    start_date: datetime
    expiry_date: datetime
    policy_status: PolicyStatus
    certificate_url: Optional[str] = None
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TreeInsuranceClaimResponseSchema(BaseModel):
    id: str
    claim_number: str
    policy_id: PydanticObjectId
    farmer_id: PydanticObjectId
    damaged_trees_count: int
    damage_cause: DamageCause
    damage_date: datetime
    claimed_amount_inr: float
    claim_status: ClaimStatus
    is_deleted: bool = False
    submitted_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
