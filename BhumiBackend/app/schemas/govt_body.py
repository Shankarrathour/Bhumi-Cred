from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from beanie import PydanticObjectId
from app.models.govt import OrgType, JurisdictionLevel, SchemeCategory, ApplicationStatus, DBTStatus, Address


class GovtOrgCreateSchema(BaseModel):
    org_id: str = Field(..., min_length=3, max_length=100, description="e.g. GOV-MP-AGRI-001")
    org_name: str = Field(..., min_length=2, max_length=200)
    org_type: OrgType
    jurisdiction_level: JurisdictionLevel
    state: str
    district: Optional[str] = None
    headquarters_address: Address
    contact_email: EmailStr
    contact_phone: str = Field(..., pattern=r"^[6-9]\d{9}$")


class GovtSchemeCreateSchema(BaseModel):
    scheme_code: str = Field(..., min_length=3, max_length=100, description="e.g. SCH-MP-TREE-2026")
    org_id: PydanticObjectId
    dept_id: PydanticObjectId
    title: str = Field(..., min_length=2, max_length=200)
    category: SchemeCategory
    description: str
    eligibility_criteria: List[str] = Field(default_factory=list)
    benefits_summary: str
    budget_allocated_inr: float = Field(..., ge=0)
    application_deadline: datetime


class GovtOrgResponseSchema(BaseModel):
    id: str
    org_id: str
    org_name: str
    org_type: OrgType
    jurisdiction_level: JurisdictionLevel
    state: str
    district: Optional[str] = None
    contact_email: EmailStr
    contact_phone: str
    is_active: bool
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GovtSchemeResponseSchema(BaseModel):
    id: str
    scheme_code: str
    org_id: PydanticObjectId
    dept_id: PydanticObjectId
    title: str
    category: SchemeCategory
    description: str
    budget_allocated_inr: float
    disbursed_amount_inr: float
    application_deadline: datetime
    is_active: bool
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
