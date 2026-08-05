from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Dict, Any
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field, EmailStr
from pymongo import IndexModel, ASCENDING, DESCENDING


# ── Enums ──────────────────────────────────────────────────────────────────────

class PolicyStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    CLAIMED = "claimed"
    CANCELLED = "cancelled"

class DamageCause(str, Enum):
    FLOOD = "flood"
    DROUGHT = "drought"
    FIRE = "fire"
    PEST_ATTACK = "pest_attack"
    STORM = "storm"
    LIGHTNING = "lightning"

class ClaimStatus(str, Enum):
    SUBMITTED = "submitted"
    SURVEY_PENDING = "survey_pending"
    SURVEY_COMPLETED = "survey_completed"
    APPROVED = "approved"
    SETTLED = "settled"
    REJECTED = "rejected"

class SettlementMethod(str, Enum):
    DIRECT_BANK_TRANSFER = "DBT_Bank"
    WALLET = "Wallet"


# ── Embedded Schemas ─────────────────────────────────────────────────────────

class SpeciesPremiumItem(BaseModel):
    species: str
    tree_count: int = Field(..., gt=0)
    rate_per_tree_inr: float = Field(..., ge=0)
    sum_insured_inr: float = Field(..., ge=0)


# ── Top-Level Beanie Document Collections ───────────────────────────────────

class InsuranceSpeciesRate(Document):
    rate_id: str = Field(..., description="Unique Rate ID, e.g., RAT-TEAK-01")
    insurance_company_id: PydanticObjectId
    tree_species: str
    base_rate_per_tree_inr: float = Field(..., gt=0)
    risk_multiplier: float = Field(default=1.0, ge=0.5, le=3.0)
    max_sum_insured_per_tree_inr: float = Field(..., gt=0)
    is_active: bool = True

    class Settings:
        name = "insurance_species_rates"
        indexes = [
            IndexModel([("rate_id", ASCENDING)], unique=True),
            IndexModel([("insurance_company_id", ASCENDING), ("tree_species", ASCENDING)], unique=True)
        ]


class InsuranceSatelliteAudit(Document):
    audit_id: str = Field(..., description="Unique Audit Ref, e.g., AUD-SAT-CLM-0091")
    claim_id: PydanticObjectId
    pre_damage_ndvi: float = Field(..., ge=-1.0, le=1.0)
    post_damage_ndvi: float = Field(..., ge=-1.0, le=1.0)
    tree_loss_verified_percent: float = Field(..., ge=0.0, le=100.0)
    satellite_scene_id: str
    audit_report_url: str
    audited_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "insurance_satellite_audits"
        indexes = [
            IndexModel([("audit_id", ASCENDING)], unique=True),
            IndexModel([("claim_id", ASCENDING)], unique=True)
        ]


class InsuranceReinsuranceAllocation(Document):
    reinsurance_id: str = Field(..., description="Unique Ref, e.g., REINS-GIC-0091")
    policy_id: PydanticObjectId
    reinsurer_name: str = "GIC Re India"
    ceded_risk_percent: float = Field(default=80.0, ge=0.0, le=100.0)
    reinsurance_premium_inr: float = Field(..., ge=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "insurance_reinsurance_allocations"
        indexes = [
            IndexModel([("reinsurance_id", ASCENDING)], unique=True),
            IndexModel([("policy_id", ASCENDING)])
        ]


class InsuranceCompany(Document):
    company_id: str = Field(..., description="Unique Company ID, e.g., INS-ICICI-LOMBARD-01")
    company_name: str
    irda_registration_number: str = Field(..., description="IRDA Registration Number")
    contact_email: EmailStr
    contact_phone: str = Field(..., pattern=r"^[6-9]\d{9}$")
    supported_species: List[str] = Field(default_factory=lambda: ["Teak", "Mahogany", "Bamboo", "Subabul"])
    claim_settlement_ratio_percent: float = Field(default=98.5, ge=0.0, le=100.0)
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "insurance_companies"
        indexes = [
            IndexModel([("company_id", ASCENDING)], unique=True),
            IndexModel([("irda_registration_number", ASCENDING)], unique=True)
        ]


class TreeInsurancePolicy(Document):
    policy_number: str = Field(..., description="Unique Policy Number, e.g., POL-GREEN-2026-0091")
    farmer_id: PydanticObjectId
    land_id: PydanticObjectId
    insurance_company_id: PydanticObjectId
    policy_name: str = "Green Shield Tree Cover"
    trees_insured_count: int = Field(..., gt=0)
    green_family_count: int = 0
    species_breakdown: List[SpeciesPremiumItem] = Field(default_factory=list)
    sum_insured_inr: float = Field(..., gt=0)
    annual_premium_inr: float = Field(..., gt=0)
    subsidy_amount_inr: float = Field(default=0.0, ge=0)
    farmer_payable_premium_inr: float = Field(..., ge=0)
    start_date: datetime
    expiry_date: datetime
    policy_status: PolicyStatus = PolicyStatus.ACTIVE
    certificate_url: Optional[str] = None

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
        """Soft delete policy."""
        self.is_deleted = True
        self.policy_status = PolicyStatus.CANCELLED
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by_id = deleted_by
        self.updated_at = datetime.now(timezone.utc)
        await self.save()

    class Settings:
        name = "tree_insurance_policies"
        indexes = [
            IndexModel([("policy_number", ASCENDING)], unique=True),
            IndexModel([("farmer_id", ASCENDING), ("policy_status", ASCENDING)]),
            IndexModel([("is_deleted", ASCENDING)]),
            IndexModel([("land_id", ASCENDING)]),
            IndexModel([("expiry_date", ASCENDING)])
        ]


class PolicyPremium(Document):
    premium_id: str = Field(..., description="Unique Premium Ref, e.g., PRM-POL-0091")
    policy_id: PydanticObjectId
    farmer_id: PydanticObjectId
    amount_inr: float = Field(..., gt=0)
    dbt_govt_subsidy_inr: float = Field(default=0.0, ge=0)
    payment_method: str = "Wallet"
    payment_status: str = "success"
    transaction_id: Optional[str] = None
    paid_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "policy_premiums"
        indexes = [
            IndexModel([("premium_id", ASCENDING)], unique=True),
            IndexModel([("policy_id", ASCENDING), ("paid_at", DESCENDING)]),
            IndexModel([("farmer_id", ASCENDING)])
        ]


class PolicyRenewal(Document):
    renewal_id: str = Field(..., description="Unique Renewal Ref, e.g., REN-POL-0091-01")
    policy_id: PydanticObjectId
    farmer_id: PydanticObjectId
    renewal_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    previous_expiry_date: datetime
    new_expiry_date: datetime
    premium_paid_inr: float = Field(..., gt=0)
    renewal_status: str = "completed"

    class Settings:
        name = "policy_renewals"
        indexes = [
            IndexModel([("renewal_id", ASCENDING)], unique=True),
            IndexModel([("policy_id", ASCENDING), ("renewal_date", DESCENDING)])
        ]


class InsuranceSurveyor(Document):
    surveyor_id: str = Field(..., description="Unique Surveyor ID, e.g., SRV-INS-0042")
    insurance_company_id: PydanticObjectId
    surveyor_name: str
    license_number: str = Field(..., description="IRDA Surveyor License Number")
    phone_number: str = Field(..., pattern=r"^[6-9]\d{9}$")
    email: EmailStr
    assigned_districts: List[str] = Field(default_factory=list)
    rating: float = Field(default=4.8, ge=1.0, le=5.0)
    is_active: bool = True

    class Settings:
        name = "insurance_surveyors"
        indexes = [
            IndexModel([("surveyor_id", ASCENDING)], unique=True),
            IndexModel([("license_number", ASCENDING)], unique=True),
            IndexModel([("insurance_company_id", ASCENDING)])
        ]


class TreeInsuranceClaim(Document):
    claim_number: str = Field(..., description="Unique Claim No., e.g., CLM-2026-08-0091")
    policy_id: PydanticObjectId
    farmer_id: PydanticObjectId
    damaged_trees_count: int = Field(..., gt=0)
    damage_cause: DamageCause = DamageCause.FLOOD
    damage_date: datetime
    claimed_amount_inr: float = Field(..., gt=0)
    is_govt_calamity_declared: bool = False
    state_disaster_relief_ref: Optional[str] = None
    surveyor_id: Optional[PydanticObjectId] = None
    survey_report_url: Optional[str] = None
    damage_photos: List[str] = Field(default_factory=list)
    claim_status: ClaimStatus = ClaimStatus.SUBMITTED

    # Audit & Security Fields
    created_by_id: Optional[PydanticObjectId] = None
    updated_by_id: Optional[PydanticObjectId] = None

    # Soft Delete Support
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by_id: Optional[PydanticObjectId] = None

    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    async def soft_delete(self, deleted_by: Optional[PydanticObjectId] = None):
        """Soft delete claim."""
        self.is_deleted = True
        self.claim_status = ClaimStatus.REJECTED
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by_id = deleted_by
        self.updated_at = datetime.now(timezone.utc)
        await self.save()

    class Settings:
        name = "tree_insurance_claims"
        indexes = [
            IndexModel([("claim_number", ASCENDING)], unique=True),
            IndexModel([("policy_id", ASCENDING), ("submitted_at", DESCENDING)]),
            IndexModel([("farmer_id", ASCENDING), ("claim_status", ASCENDING)]),
            IndexModel([("is_deleted", ASCENDING)]),
            IndexModel([("surveyor_id", ASCENDING)])
        ]


class ClaimHistory(Document):
    history_id: str = Field(..., description="Unique History Ref, e.g., HST-CLM-0091-01")
    claim_id: PydanticObjectId
    previous_status: Optional[str] = None
    new_status: ClaimStatus
    remarks: str
    updated_by: PydanticObjectId
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "claim_histories"
        indexes = [
            IndexModel([("history_id", ASCENDING)], unique=True),
            IndexModel([("claim_id", ASCENDING), ("timestamp", DESCENDING)])
        ]


class ClaimSettlement(Document):
    settlement_id: str = Field(..., description="Unique Settlement Ref, e.g., STL-CLM-2026-0091")
    claim_id: PydanticObjectId
    policy_id: PydanticObjectId
    farmer_id: PydanticObjectId
    insurance_company_id: PydanticObjectId
    approved_claim_amount_inr: float = Field(..., ge=0)
    deductible_amount_inr: float = Field(default=0.0, ge=0)
    net_settled_amount_inr: float = Field(..., ge=0)
    settlement_method: SettlementMethod = SettlementMethod.DIRECT_BANK_TRANSFER
    bank_transaction_ref: Optional[str] = None
    settled_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "claim_settlements"
        indexes = [
            IndexModel([("settlement_id", ASCENDING)], unique=True),
            IndexModel([("claim_id", ASCENDING)], unique=True),
            IndexModel([("farmer_id", ASCENDING), ("settled_at", DESCENDING)])
        ]
