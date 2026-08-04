from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Dict, Any
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel, ASCENDING, DESCENDING


# ── Enums ──────────────────────────────────────────────────────────────────────

class ProjectStatus(str, Enum):
    PROPOSED = "proposed"
    PENDING_APPROVAL = "pending_approval"
    ACTIVE_TRACKING = "active_tracking"
    COMPLETED = "completed"
    SUSPENDED = "suspended"

class ProjectStage(str, Enum):
    REGISTERED = "registered"
    UNDER_REVIEW = "under_review"
    ACTIVE_MONITORING = "active_monitoring"
    MRV_STAGE = "mrv_stage"
    CARBON_ESTIMATION = "carbon_estimation"
    COMPLETED = "completed"

class MilestoneStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    VERIFIED = "verified"
    DELAYED = "delayed"

class EnrollmentStatus(str, Enum):
    PENDING_ADMIN_VERIFICATION = "pending_admin_verification"
    ACTIVE = "active"
    REJECTED = "rejected"
    COMPLETED = "completed"

class RiskRating(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"

class CarbonRegistry(str, Enum):
    VERRA = "Verra"
    GOLD_STANDARD = "Gold Standard"
    NCCF = "NCCF India"
    CER = "UNFCCC CER"


# ── Embedded GeoJSON & Sub-Document Schemas ─────────────────────────────────

class GeoJSONPolygon(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]

class MilestoneStep(BaseModel):
    title: str
    completed: bool = False
    completed_at: Optional[datetime] = None


# ── Top-Level Beanie Document Collections ───────────────────────────────────

class Project(Document):
    project_id: str = Field(..., description="Unique slug, e.g., mp-agroforestry-carbon-mission")
    title: str = Field(..., min_length=3, max_length=200)
    category: str = "Sustainability Mission"
    description: str
    district: str
    state: str
    target_area_acres: float = Field(..., gt=0)
    target_trees_count: int = Field(default=0, ge=0)
    estimated_carbon_impact: float = Field(..., ge=0)
    ngo_partner: str = "Green Earth NGO"
    is_tracking_active: bool = True
    ngo_partner_id: Optional[PydanticObjectId] = None
    
    roadmap: List[ProjectStage] = Field(
        default_factory=lambda: [
            ProjectStage.REGISTERED,
            ProjectStage.UNDER_REVIEW,
            ProjectStage.ACTIVE_MONITORING,
            ProjectStage.MRV_STAGE,
            ProjectStage.CARBON_ESTIMATION,
            ProjectStage.COMPLETED
        ]
    )
    eligibility: List[str] = Field(default_factory=list)
    required_documents: List[str] = Field(default_factory=list)

    status: ProjectStatus = ProjectStatus.ACTIVE_TRACKING
    is_public: bool = True
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
        """Soft delete project."""
        self.is_deleted = True
        self.is_active = False
        self.status = ProjectStatus.SUSPENDED
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by_id = deleted_by
        self.updated_at = datetime.now(timezone.utc)
        await self.save()

    class Settings:
        name = "projects"
        indexes = [
            IndexModel([("project_id", ASCENDING)], unique=True),
            IndexModel([("is_public", ASCENDING), ("is_active", ASCENDING), ("status", ASCENDING)]),
            IndexModel([("is_deleted", ASCENDING), ("is_active", ASCENDING)]),
            IndexModel([("state", ASCENDING), ("district", ASCENDING)]),
            IndexModel([("title", "text"), ("description", "text")])
        ]


class ProjectTreeRegistration(Document):
    registration_id: str = Field(..., description="Unique Reg ID, e.g., REG-TREE-2026-0091")
    project_id: str
    farmer_id: PydanticObjectId
    land_id: PydanticObjectId
    tree_species: str
    tree_count: int = Field(..., gt=0)
    plantation_photo_urls: List[str] = Field(default_factory=list)
    geo_latitude: float = Field(..., ge=-90, le=90)
    geo_longitude: float = Field(..., ge=-180, le=180)
    is_insured: bool = False
    registered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "project_tree_registrations"
        indexes = [
            IndexModel([("registration_id", ASCENDING)], unique=True),
            IndexModel([("project_id", ASCENDING), ("farmer_id", ASCENDING)])
        ]


class ProjectInsurancePolicy(Document):
    policy_id: str = Field(..., description="Unique Policy ID, e.g., POL-GREEN-SHIELD-01")
    project_id: str
    policy_name: str = "Green Shield"
    status: str = "active"
    protected_trees: int = 0
    claim_eligibility_percent: float = Field(default=100.0, ge=0.0, le=100.0)
    duration_years: int = 3
    expiry_date: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "project_insurance_policies"
        indexes = [
            IndexModel([("policy_id", ASCENDING)], unique=True),
            IndexModel([("project_id", ASCENDING), ("status", ASCENDING)])
        ]


class ProjectRiskAssessment(Document):
    assessment_id: str
    project_id: str
    assessed_by: PydanticObjectId
    flood_risk_score: float = Field(..., ge=0.0, le=100.0)
    drought_risk_score: float = Field(..., ge=0.0, le=100.0)
    fire_hazard_score: float = Field(..., ge=0.0, le=100.0)
    overall_risk_rating: RiskRating = RiskRating.MODERATE
    recommendations: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "project_risk_assessments"
        indexes = [
            IndexModel([("assessment_id", ASCENDING)], unique=True),
            IndexModel([("project_id", ASCENDING), ("created_at", DESCENDING)])
        ]


class ProjectTimeline(Document):
    project_id: str
    stage: ProjectStage
    stage_number: int
    stage_label: str
    planned_start_date: datetime
    planned_end_date: datetime
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    is_current_stage: bool = False

    class Settings:
        name = "project_timelines"
        indexes = [
            IndexModel([("project_id", ASCENDING), ("stage_number", ASCENDING)], unique=True)
        ]


class ProjectMilestone(Document):
    milestone_id: str
    project_id: str
    title: str
    description: str
    target_date: datetime
    achieved_date: Optional[datetime] = None
    completion_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    verified_by_admin_id: Optional[PydanticObjectId] = None
    status: MilestoneStatus = MilestoneStatus.PENDING
    steps: List[MilestoneStep] = Field(default_factory=list)

    class Settings:
        name = "project_milestones"
        indexes = [
            IndexModel([("milestone_id", ASCENDING)], unique=True),
            IndexModel([("project_id", ASCENDING), ("target_date", ASCENDING)])
        ]


class ProjectFarmerEnrollment(Document):
    project_id: str
    farmer_id: PydanticObjectId
    status: EnrollmentStatus = EnrollmentStatus.PENDING_ADMIN_VERIFICATION
    current_stage: ProjectStage = ProjectStage.REGISTERED
    progress_percent: int = Field(default=0, ge=0, le=100)
    
    land_area_acres: float = Field(..., gt=0)
    registered_trees: int = Field(..., ge=0)
    insured_trees: int = 0
    green_family_count: int = 0
    estimated_carbon_impact: float = 0.0

    plantation_photo_urls: List[str] = Field(default_factory=list)
    land_proof_url: Optional[str] = None
    geo_latitude: Optional[float] = None
    geo_longitude: Optional[float] = None

    land_verified: bool = False
    trees_verified: bool = False
    mrv_verified: bool = False
    enrolled_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "project_farmer_enrollments"
        indexes = [
            IndexModel([("farmer_id", ASCENDING), ("project_id", ASCENDING)], unique=True),
            IndexModel([("project_id", ASCENDING), ("status", ASCENDING)])
        ]


class ProjectGovtAlignment(Document):
    project_id: str
    org_id: PydanticObjectId
    dept_id: Optional[PydanticObjectId] = None
    scheme_id: Optional[PydanticObjectId] = None
    sanction_order_number: str
    approved_budget_inr: float = Field(..., ge=0)
    dbt_funding_share_percent: float = Field(default=0.0, ge=0.0, le=100.0)
    alignment_status: str = "approved"

    class Settings:
        name = "project_govt_alignments"
        indexes = [
            IndexModel([("project_id", ASCENDING), ("org_id", ASCENDING)], unique=True)
        ]


class ProjectPartnerAllocation(Document):
    project_id: str
    partner_id: PydanticObjectId
    partner_role: str
    assigned_acres: float = Field(default=0.0, ge=0.0)
    assigned_villages: List[str] = Field(default_factory=list)
    revenue_share_percent: float = Field(default=0.0, ge=0.0, le=100.0)
    allocation_status: str = "active"

    class Settings:
        name = "project_partner_allocations"
        indexes = [
            IndexModel([("project_id", ASCENDING), ("partner_id", ASCENDING)], unique=True)
        ]


class ProjectGISBoundary(Document):
    project_id: str
    project_area_polygon: GeoJSONPolygon
    total_polygons_count: int = 1
    sentinel_scene_id: Optional[str] = None
    satellite_coverage_percent: float = Field(default=100.0, ge=0.0, le=100.0)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "project_gis_boundaries"
        indexes = [
            IndexModel([("project_id", ASCENDING)], unique=True),
            IndexModel([("project_area_polygon", "2dsphere")])
        ]


class ProjectMRVCycle(Document):
    mrv_cycle_id: str
    project_id: str
    cycle_name: str
    start_date: datetime
    end_date: datetime
    mrv_verified_by_partner_id: PydanticObjectId
    canopy_cover_density_percent: float = Field(..., ge=0.0, le=100.0)
    carbon_sequestration_rate_tons_per_acre: float = Field(..., ge=0.0)
    mrv_report_document_url: str
    status: str = "completed"

    class Settings:
        name = "project_mrv_cycles"
        indexes = [
            IndexModel([("mrv_cycle_id", ASCENDING)], unique=True),
            IndexModel([("project_id", ASCENDING), ("start_date", DESCENDING)])
        ]


class ProjectCarbonIssuance(Document):
    serial_number_range: str
    project_id: str
    registry_name: CarbonRegistry = CarbonRegistry.VERRA
    total_credits_issued: float = Field(..., gt=0)
    price_per_credit_usd: float = Field(..., gt=0)
    issuance_date: datetime
    certificate_url: str

    class Settings:
        name = "project_carbon_issuances"
        indexes = [
            IndexModel([("serial_number_range", ASCENDING)], unique=True),
            IndexModel([("project_id", ASCENDING), ("issuance_date", DESCENDING)])
        ]


class ProjectRevenue(Document):
    project_id: str
    total_budget_inr: float = Field(default=0.0, ge=0)
    total_grants_received_inr: float = Field(default=0.0, ge=0)
    carbon_credit_sales_usd: float = Field(default=0.0, ge=0)
    net_farmer_disbursements_inr: float = Field(default=0.0, ge=0)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "project_revenues"
        indexes = [
            IndexModel([("project_id", ASCENDING)], unique=True)
        ]


class ProjectProgressTracker(Document):
    project_id: str
    overall_progress_percent: float = Field(default=0.0, ge=0.0, le=100.0)
    enrolled_acres_percent: float = Field(default=0.0, ge=0.0, le=100.0)
    trees_planted_percent: float = Field(default=0.0, ge=0.0, le=100.0)
    carbon_credits_issued_percent: float = Field(default=0.0, ge=0.0, le=100.0)
    active_farmers_count: int = 0
    total_green_families_count: int = 0
    last_updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "project_progress_trackers"
        indexes = [
            IndexModel([("project_id", ASCENDING)], unique=True)
        ]
