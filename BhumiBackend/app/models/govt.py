from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Dict, Any
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field, EmailStr
from pymongo import IndexModel, ASCENDING, DESCENDING


# ── Enums ──────────────────────────────────────────────────────────────────────

class OrgType(str, Enum):
    MINISTRY = "ministry"
    STATE_DEPARTMENT = "state_department"
    DISTRICT_COLLECTORATE = "district_collectorate"
    NGO_NODAL_BODY = "ngo_nodal_body"
    PANCHAYAT_RAJ = "panchayat_raj"

class JurisdictionLevel(str, Enum):
    CENTRAL = "central"
    STATE = "state"
    DISTRICT = "district"
    BLOCK = "block"
    PANCHAYAT = "panchayat"

class SchemeCategory(str, Enum):
    AGROFORESTRY = "agroforestry"
    SUBSIDY = "subsidy"
    CROP_INSURANCE = "crop_insurance"
    SOIL_HEALTH = "soil_health"
    IRRIGATION = "irrigation"

class ApplicationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    APPROVED = "approved"
    DISBURSED = "disbursed"
    REJECTED = "rejected"

class DBTStatus(str, Enum):
    INITIATED = "initiated"
    SUCCESS = "success"
    FAILED = "failed"
    REVERTED = "reverted"

class WorkflowStatus(str, Enum):
    PENDING = "pending"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    REVERTED = "reverted"


class ApprovalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CLARIFICATION_REQUIRED = "CLARIFICATION_REQUIRED"


# ── Embedded Sub-Document Schemas ───────────────────────────────────────────

class Address(BaseModel):
    building: Optional[str] = None
    street: str
    city: str
    district: str
    state: str
    pincode: str = Field(..., pattern=r"^\d{6}$")

class GeoJSONPoint(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]

class GeoJSONPolygon(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]  # [[[lng, lat], ...]]

class WorkflowStep(BaseModel):
    step_number: int
    step_name: str
    assigned_role: str
    assigned_person_id: Optional[PydanticObjectId] = None
    status: WorkflowStatus = WorkflowStatus.PENDING
    comments: Optional[str] = None
    action_taken_at: Optional[datetime] = None


# ── Top-Level Beanie Document Collections ───────────────────────────────────

class GovtOrganization(Document):
    org_id: str = Field(..., description="Unique Org ID / Registration Code, e.g., GOV-MP-AGRI-001")
    org_name: str = Field(..., min_length=2, max_length=200)
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
    contact_phone: str = Field(..., pattern=r"^[6-9]\d{9}$")

    # Personnel Details
    authorized_person_name: Optional[str] = None
    authorized_person_designation: Optional[str] = None
    authorized_person_email: Optional[EmailStr] = None
    authorized_person_phone: Optional[str] = None

    nodal_person_name: Optional[str] = None
    nodal_person_designation: Optional[str] = None
    nodal_person_email: Optional[EmailStr] = None
    nodal_person_phone: Optional[str] = None

    # Documents
    mou_document_url: Optional[str] = None
    authority_document_url: Optional[str] = None

    # Approval Workflow & Status
    approval_status: ApprovalStatus = ApprovalStatus.PENDING
    status_remarks: Optional[str] = None
    clarification_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    audit_trail: List[Dict[str, Any]] = Field(default_factory=list)

    state_portal_integration_id: Optional[str] = None
    is_active: bool = True

    # Audit & Security Fields
    created_by_id: Optional[PydanticObjectId] = None
    updated_by_id: Optional[PydanticObjectId] = None

    # Soft Delete Support
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by_id: Optional[PydanticObjectId] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    async def soft_delete(self, deleted_by: Optional[PydanticObjectId] = None):
        """Soft delete organization."""
        self.is_deleted = True
        self.is_active = False
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by_id = deleted_by
        self.updated_at = datetime.now(timezone.utc)
        await self.save()

    class Settings:
        name = "govt_organizations"
        indexes = [
            IndexModel([("org_id", ASCENDING)], unique=True),
            IndexModel([("approval_status", ASCENDING)]),
            IndexModel([("is_deleted", ASCENDING), ("is_active", ASCENDING)]),
            IndexModel([("state", ASCENDING), ("district", ASCENDING)])
        ]


class Department(Document):
    dept_id: str
    org_id: PydanticObjectId
    dept_name: str
    code: str
    head_officer_name: str
    head_officer_email: EmailStr
    budget_allocated_inr: float = 0.0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "departments"
        indexes = [
            IndexModel([("dept_id", ASCENDING)], unique=True),
            IndexModel([("org_id", ASCENDING), ("code", ASCENDING)], unique=True)
        ]


class AuthorizedPerson(Document):
    person_id: str
    org_id: PydanticObjectId
    dept_id: PydanticObjectId
    full_name: str
    designation: str
    official_email: EmailStr
    mobile: str = Field(..., pattern=r"^[6-9]\d{9}$")
    government_id_number: str
    digital_signature_id: Optional[str] = None
    dbt_approval_limit_inr: float = 500000.0
    role_permissions: List[str] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "authorized_persons"
        indexes = [
            IndexModel([("person_id", ASCENDING)], unique=True),
            IndexModel([("official_email", ASCENDING)], unique=True)
        ]


class GovtScheme(Document):
    scheme_code: str = Field(..., description="Unique code, e.g., SCH-MP-TREE-2026")
    org_id: PydanticObjectId
    dept_id: PydanticObjectId
    title: str = Field(..., min_length=2, max_length=200)
    category: SchemeCategory
    description: str
    eligibility_criteria: List[str] = Field(default_factory=list)
    benefits_summary: str
    budget_allocated_inr: float = Field(..., ge=0)
    disbursed_amount_inr: float = Field(default=0.0, ge=0)
    application_deadline: datetime
    is_active: bool = True

    # Audit & Security Fields
    created_by_id: Optional[PydanticObjectId] = None
    updated_by_id: Optional[PydanticObjectId] = None

    # Soft Delete Support
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by_id: Optional[PydanticObjectId] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    async def soft_delete(self, deleted_by: Optional[PydanticObjectId] = None):
        """Soft delete scheme."""
        self.is_deleted = True
        self.is_active = False
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by_id = deleted_by
        self.updated_at = datetime.now(timezone.utc)
        await self.save()

    class Settings:
        name = "govt_schemes"
        indexes = [
            IndexModel([("scheme_code", ASCENDING)], unique=True),
            IndexModel([("is_deleted", ASCENDING), ("is_active", ASCENDING)]),
            IndexModel([("org_id", ASCENDING), ("is_active", ASCENDING)])
        ]


class SchemeApplication(Document):
    application_number: str
    scheme_id: PydanticObjectId
    farmer_id: PydanticObjectId
    land_id: Optional[PydanticObjectId] = None
    status: ApplicationStatus = ApplicationStatus.PENDING
    sanctioned_amount_inr: float = 0.0
    verification_officer_id: Optional[PydanticObjectId] = None
    rejection_reason: Optional[str] = None
    applied_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "scheme_applications"
        indexes = [
            IndexModel([("application_number", ASCENDING)], unique=True),
            IndexModel([("farmer_id", ASCENDING), ("scheme_id", ASCENDING)]),
            IndexModel([("status", ASCENDING), ("applied_at", DESCENDING)])
        ]


class SubsidyDisbursement(Document):
    application_id: PydanticObjectId
    farmer_id: PydanticObjectId
    dbt_transaction_id: str
    amount: float = Field(..., gt=0)
    bank_account_number: str
    ifsc_code: str
    status: DBTStatus = DBTStatus.INITIATED
    disbursed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "subsidy_disbursements"
        indexes = [
            IndexModel([("dbt_transaction_id", ASCENDING)], unique=True),
            IndexModel([("farmer_id", ASCENDING), ("status", ASCENDING)])
        ]
