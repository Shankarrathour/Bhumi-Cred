from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from beanie import PydanticObjectId
from app.models.govt import OrgType, JurisdictionLevel, SchemeCategory, ApplicationStatus, ApprovalStatus, DBTStatus, Address


class GovtOrgCreateSchema(BaseModel):
    org_id: str = Field(..., min_length=3, max_length=100, description="Registration or local-body code e.g. GOV-MP-AGRI-001")
    org_name: str = Field(..., min_length=2, max_length=200, description="Organization name")
    org_type: OrgType
    department: str = Field(..., min_length=2, max_length=200, description="Department name")
    registration_code: Optional[str] = None
    jurisdiction_level: JurisdictionLevel = JurisdictionLevel.STATE
    state: str = Field(..., min_length=2, max_length=100)
    district: str = Field(..., min_length=2, max_length=100)
    block_tehsil: Optional[str] = None
    village_ward: Optional[str] = None
    headquarters_address: Address
    contact_email: EmailStr
    contact_phone: str = Field(..., pattern=r"^[6-9]\d{9}$")

    # Personnel Details
    authorized_person_name: str = Field(..., min_length=2, max_length=150)
    authorized_person_designation: str = Field(..., min_length=2, max_length=150)
    authorized_person_email: EmailStr
    authorized_person_phone: str = Field(..., pattern=r"^[6-9]\d{9}$")

    nodal_person_name: str = Field(..., min_length=2, max_length=150)
    nodal_person_designation: str = Field(..., min_length=2, max_length=150)
    nodal_person_email: EmailStr
    nodal_person_phone: str = Field(..., pattern=r"^[6-9]\d{9}$")

    # Documents
    mou_document_url: Optional[str] = None
    authority_document_url: Optional[str] = None


class GovtOrgUpdateSchema(BaseModel):
    org_name: Optional[str] = None
    org_type: Optional[OrgType] = None
    department: Optional[str] = None
    registration_code: Optional[str] = None
    jurisdiction_level: Optional[JurisdictionLevel] = None
    state: Optional[str] = None
    district: Optional[str] = None
    block_tehsil: Optional[str] = None
    village_ward: Optional[str] = None
    headquarters_address: Optional[Address] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None

    authorized_person_name: Optional[str] = None
    authorized_person_designation: Optional[str] = None
    authorized_person_email: Optional[EmailStr] = None
    authorized_person_phone: Optional[str] = None

    nodal_person_name: Optional[str] = None
    nodal_person_designation: Optional[str] = None
    nodal_person_email: Optional[EmailStr] = None
    nodal_person_phone: Optional[str] = None

    mou_document_url: Optional[str] = None
    authority_document_url: Optional[str] = None
    resubmit: Optional[bool] = False


class GovtOrgStatusPatchSchema(BaseModel):
    action: str = Field(..., description="APPROVE, REJECT, or CLARIFICATION_REQUIRED")
    remarks: Optional[str] = None
    clarification_notes: Optional[str] = None
    rejection_reason: Optional[str] = None


class GovtOrgResponseSchema(BaseModel):
    id: str
    org_id: str
    org_name: str
    org_type: OrgType
    department: Optional[str] = None
    registration_code: Optional[str] = None
    jurisdiction_level: JurisdictionLevel
    state: str
    district: Optional[str] = None
    block_tehsil: Optional[str] = None
    village_ward: Optional[str] = None
    headquarters_address: Address
    contact_email: EmailStr
    contact_phone: str

    authorized_person_name: Optional[str] = None
    authorized_person_designation: Optional[str] = None
    authorized_person_email: Optional[EmailStr] = None
    authorized_person_phone: Optional[str] = None

    nodal_person_name: Optional[str] = None
    nodal_person_designation: Optional[str] = None
    nodal_person_email: Optional[EmailStr] = None
    nodal_person_phone: Optional[str] = None

    mou_document_url: Optional[str] = None
    authority_document_url: Optional[str] = None

    approval_status: ApprovalStatus
    status_remarks: Optional[str] = None
    clarification_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    audit_trail: List[Dict[str, Any]] = Field(default_factory=list)

    is_active: bool
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


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

