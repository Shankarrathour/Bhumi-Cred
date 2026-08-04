from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Dict, Any
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field, EmailStr
from pymongo import IndexModel, ASCENDING, DESCENDING


# ── Enums ──────────────────────────────────────────────────────────────────────

class PartnerType(str, Enum):
    CARBON_PARTNER = "carbon_partner"
    INSURANCE_PARTNER = "insurance_partner"
    GIS_PARTNER = "gis_partner"
    MARKETPLACE_VENDOR = "marketplace_vendor"
    BUYER = "buyer"
    NGO = "ngo"
    GOVERNMENT_PARTNER = "govt_partner"

class VerificationStatus(str, Enum):
    DRAFT = "draft"
    PENDING_VERIFICATION = "pending_verification"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"

class AgreementType(str, Enum):
    MOU = "mou"
    VENDOR_CONTRACT = "vendor_contract"
    SLA_AGREEMENT = "sla_agreement"
    REVENUE_SHARE = "revenue_share"

class AgreementStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    TERMINATED = "terminated"
    UNDER_RENEWAL = "under_renewal"

class CommissionType(str, Enum):
    PERCENTAGE_SHARE = "percentage_share"
    FLAT_FEE = "flat_fee"
    HYBRID = "hybrid"
    TIERED = "tiered"

class PayoutCycle(str, Enum):
    WEEKLY = "weekly"
    FORTNIGHTLY = "fortnightly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"

class PayoutStatus(str, Enum):
    INITIATED = "initiated"
    PROCESSING = "processing"
    PAID = "paid"
    FAILED = "failed"

class FulfillmentStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class ComplianceStatus(str, Enum):
    COMPLIANT = "compliant"
    MINOR_DEFICIENCY = "minor_deficiency"
    NON_COMPLIANT = "non_compliant"
    UNDER_REVIEW = "under_review"


# ── Embedded Sub-Document Schemas ───────────────────────────────────────────

class Address(BaseModel):
    street: str
    city: str
    state: str
    district: str
    pincode: str = Field(..., pattern=r"^\d{6}$")
    country: str = "India"

class GSTDetails(BaseModel):
    gstin: str = Field(..., pattern=r"^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$")
    legal_name: str
    trade_name: Optional[str] = None
    gst_certificate_url: Optional[str] = None
    is_verified: bool = False

class PANDetails(BaseModel):
    pan_number: str = Field(..., pattern=r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")
    name_on_pan: str
    pan_doc_url: Optional[str] = None
    is_verified: bool = False

class BankDetails(BaseModel):
    account_number: str = Field(..., pattern=r"^\d{9,18}$")
    account_holder_name: str
    bank_name: str
    branch_name: Optional[str] = None
    ifsc_code: str = Field(..., pattern=r"^[A-Z]{4}0[A-Z0-9]{6}$")
    is_verified: bool = False

class CompanyDetails(BaseModel):
    company_name: str
    registration_number: str
    incorporation_date: Optional[datetime] = None
    registered_address: Address
    billing_address: Optional[Address] = None
    website_url: Optional[str] = None
    contact_person_name: str
    contact_email: EmailStr
    contact_phone: str = Field(..., pattern=r"^[6-9]\d{9}$")
    gst: GSTDetails
    pan: PANDetails
    bank: BankDetails


# ── Top-Level Beanie Document Collections ───────────────────────────────────

class Partner(Document):
    partner_id: str = Field(..., description="Unique Business ID, e.g., PTR-2026-0045")
    partner_type: PartnerType
    company_details: CompanyDetails
    verification_status: VerificationStatus = VerificationStatus.DRAFT
    verification_remarks: Optional[str] = None

    overall_rating: float = Field(default=0.0, ge=0.0, le=5.0)
    total_reviews_count: int = 0
    total_revenue_generated_inr: float = 0.0
    total_payout_settled_inr: float = 0.0
    pending_payout_inr: float = 0.0

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
        """Soft delete partner."""
        self.is_deleted = True
        self.is_active = False
        self.verification_status = VerificationStatus.SUSPENDED
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by_id = deleted_by
        self.updated_at = datetime.now(timezone.utc)
        await self.save()

    class Settings:
        name = "partners"
        indexes = [
            IndexModel([("partner_id", ASCENDING)], unique=True),
            IndexModel([("company_details.gst.gstin", ASCENDING)], unique=True, sparse=True),
            IndexModel([("company_details.pan.pan_number", ASCENDING)], unique=True, sparse=True),
            IndexModel([("is_deleted", ASCENDING), ("is_active", ASCENDING)]),
            IndexModel([("partner_type", ASCENDING), ("verification_status", ASCENDING)])
        ]


class PartnerAgreement(Document):
    agreement_number: str
    partner_id: PydanticObjectId
    agreement_type: AgreementType
    title: str
    effective_date: datetime
    expiry_date: datetime
    agreement_document_url: str
    signed_by_partner: bool = False
    signed_by_admin: bool = False
    status: AgreementStatus = AgreementStatus.ACTIVE

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
        """Soft delete agreement."""
        self.is_deleted = True
        self.status = AgreementStatus.TERMINATED
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by_id = deleted_by
        self.updated_at = datetime.now(timezone.utc)
        await self.save()

    class Settings:
        name = "partner_agreements"
        indexes = [
            IndexModel([("agreement_number", ASCENDING)], unique=True),
            IndexModel([("is_deleted", ASCENDING)]),
            IndexModel([("partner_id", ASCENDING), ("status", ASCENDING)])
        ]


class CommissionStructure(Document):
    partner_id: PydanticObjectId
    commission_type: CommissionType
    rate_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    flat_fee_inr: float = Field(default=0.0, ge=0.0)
    payout_cycle: PayoutCycle = PayoutCycle.MONTHLY
    minimum_payout_threshold_inr: float = 1000.0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "commission_structures"
        indexes = [
            IndexModel([("partner_id", ASCENDING), ("is_active", ASCENDING)])
        ]


class PartnerJurisdiction(Document):
    partner_id: PydanticObjectId
    assigned_states: List[str] = Field(default_factory=list)
    assigned_districts: List[str] = Field(default_factory=list)
    assigned_blocks: List[str] = Field(default_factory=list)
    assigned_villages: List[str] = Field(default_factory=list)

    class Settings:
        name = "partner_jurisdictions"
        indexes = [
            IndexModel([("partner_id", ASCENDING)], unique=True),
            IndexModel([("assigned_districts", ASCENDING)])
        ]


class PartnerStaff(Document):
    staff_id: str
    partner_id: PydanticObjectId
    full_name: str
    role: str
    mobile: str = Field(..., pattern=r"^[6-9]\d{9}$")
    assigned_farmer_ids: List[PydanticObjectId] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "partner_staff"
        indexes = [
            IndexModel([("staff_id", ASCENDING)], unique=True),
            IndexModel([("partner_id", ASCENDING), ("is_active", ASCENDING)])
        ]


class GISApiLog(Document):
    partner_id: PydanticObjectId
    land_id: PydanticObjectId
    request_type: str
    satellite_source: str
    ndvi_mean_score: float
    raw_geojson_response: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "gis_api_logs"
        indexes = [
            IndexModel([("partner_id", ASCENDING), ("created_at", DESCENDING)]),
            IndexModel([("land_id", ASCENDING), ("request_type", ASCENDING)])
        ]


class InsuranceMasterPlan(Document):
    plan_code: str
    partner_id: PydanticObjectId
    plan_name: str
    coverage_type: str
    premium_rate_per_acre: float = Field(..., gt=0)
    max_coverage_inr_per_acre: float = Field(..., gt=0)
    claim_settlement_sla_days: int = 7
    is_active: bool = True

    class Settings:
        name = "insurance_master_plans"
        indexes = [
            IndexModel([("plan_code", ASCENDING)], unique=True),
            IndexModel([("partner_id", ASCENDING), ("is_active", ASCENDING)])
        ]


class CarbonOfftakeContract(Document):
    contract_number: str
    partner_id: PydanticObjectId
    project_id: str
    contracted_credits_volume: float = Field(..., gt=0)
    agreed_price_per_credit_usd: float = Field(..., gt=0)
    credits_retired_count: float = 0.0
    contract_status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "carbon_offtake_contracts"
        indexes = [
            IndexModel([("contract_number", ASCENDING)], unique=True),
            IndexModel([("partner_id", ASCENDING), ("contract_status", ASCENDING)])
        ]


class VendorOrder(Document):
    partner_id: PydanticObjectId
    order_id: PydanticObjectId
    items: List[Dict[str, Any]] = Field(default_factory=list)
    commission_amount_inr: float = Field(..., ge=0)
    fulfillment_status: FulfillmentStatus = FulfillmentStatus.PENDING
    tracking_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "vendor_orders"
        indexes = [
            IndexModel([("order_id", ASCENDING)], unique=True),
            IndexModel([("partner_id", ASCENDING), ("fulfillment_status", ASCENDING)])
        ]


class PartnerComplianceAudit(Document):
    partner_id: PydanticObjectId
    audited_by_admin_id: PydanticObjectId
    audit_date: datetime
    compliance_status: ComplianceStatus
    findings: str
    corrective_action_plan: Optional[str] = None
    next_audit_due_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "partner_compliance_audits"
        indexes = [
            IndexModel([("partner_id", ASCENDING), ("audit_date", DESCENDING)]),
            IndexModel([("compliance_status", ASCENDING)])
        ]


class PartnerPerformance(Document):
    partner_id: PydanticObjectId
    audit_period: str
    sla_score_percent: float = Field(..., ge=0.0, le=100.0)
    fulfillment_rate_percent: float = Field(..., ge=0.0, le=100.0)
    mrv_accuracy_percent: Optional[float] = Field(None, ge=0.0, le=100.0)
    escalations_count: int = 0
    audited_by: PydanticObjectId
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "partner_performances"
        indexes = [
            IndexModel([("partner_id", ASCENDING), ("audit_period", DESCENDING)], unique=True)
        ]


class PartnerRevenue(Document):
    settlement_number: str
    partner_id: PydanticObjectId
    period_start: datetime
    period_end: datetime
    gross_revenue_inr: float = Field(..., ge=0)
    commission_deducted_inr: float = Field(..., ge=0)
    net_payout_inr: float = Field(..., ge=0)
    payout_status: PayoutStatus = PayoutStatus.INITIATED
    gateway_reference_id: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "partner_revenues"
        indexes = [
            IndexModel([("settlement_number", ASCENDING)], unique=True),
            IndexModel([("partner_id", ASCENDING), ("created_at", DESCENDING)])
        ]


class PartnerRating(Document):
    partner_id: PydanticObjectId
    reviewer_id: PydanticObjectId
    reviewer_type: str
    rating_score: int = Field(..., ge=1, le=5)
    review_text: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "partner_ratings"
        indexes = [
            IndexModel([("partner_id", ASCENDING), ("rating_score", DESCENDING)]),
            IndexModel([("reviewer_id", ASCENDING), ("partner_id", ASCENDING)])
        ]
