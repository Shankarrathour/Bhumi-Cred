from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import BaseModel, Field
from pymongo import ASCENDING, IndexModel


class ProjectStage(str, Enum):
    REGISTERED = "registered"
    UNDER_REVIEW = "under_review"
    ACTIVE_MONITORING = "active_monitoring"
    MRV_STAGE = "mrv_stage"
    CARBON_ESTIMATION = "carbon_estimation"
    COMPLETED = "completed"


class EnrollmentStatus(str, Enum):
    PENDING_ADMIN_VERIFICATION = "pending_admin_verification"
    ACTIVE = "active"
    REJECTED = "rejected"
    CLARIFICATION_REQUESTED = "clarification_requested"
    COMPLETED = "completed"


class InsurancePolicy(str, Enum):
    GREEN_SHIELD = "green_shield"
    ECO_LIFE = "eco_life"
    AGRO_FOREST_SECURE = "agro_forest_secure"
    GREEN_FAMILY = "green_family"


class InsuranceStatus(str, Enum):
    NOT_ELIGIBLE = "not_eligible"
    PENDING_VERIFICATION = "pending_verification"
    ACTIVE = "active"
    EXPIRED = "expired"


class ProjectMilestone(BaseModel):
    label: str
    completed: bool = False


class InsuranceProtection(BaseModel):
    policy: InsurancePolicy = InsurancePolicy.GREEN_SHIELD
    status: InsuranceStatus = InsuranceStatus.NOT_ELIGIBLE
    protected_trees: int = 0
    claim_eligibility_percent: int = Field(default=0, ge=0, le=100)
    duration_years: int = Field(default=3, ge=1, le=10)
    expiry_date: Optional[datetime] = None


class ProjectEnrollment(Document):
    farmer_id: str
    project_id: str

    status: EnrollmentStatus = EnrollmentStatus.PENDING_ADMIN_VERIFICATION
    current_stage: ProjectStage = ProjectStage.REGISTERED
    progress_percent: int = Field(default=0, ge=0, le=100)

    land_area_acres: float = Field(default=0.0, ge=0)
    registered_trees: int = Field(default=0, ge=0)
    insured_trees: int = Field(default=0, ge=0)
    green_family_count: int = Field(default=0, ge=0)
    estimated_carbon_impact: float = Field(default=0.0, ge=0)
    sustainability_score: int = Field(default=0, ge=0, le=100)

    land_verified: bool = False
    trees_verified: bool = False
    mrv_verified: bool = False
    insurance: InsuranceProtection = Field(default_factory=InsuranceProtection)
    milestones: list[ProjectMilestone] = Field(default_factory=list)

    # Carbon Program roadmap — each of the 9 stages has its own independent,
    # explicitly-set backend status. Never derive one from another or from a
    # single current_stage/progress_percent value; each flag is only ever set
    # by the specific event/admin action that actually completes that stage.
    stage_project_assigned: bool = False
    stage_land_registered: bool = False
    stage_inspection_completed: bool = False
    stage_soil_verified: bool = False
    stage_trees_registered: bool = False
    stage_insurance_activated: bool = False
    stage_mrv_monitoring_started: bool = False
    stage_carbon_estimation_running: bool = False
    stage_reward_eligible: bool = False

    ngo_partner: Optional[str] = None
    rejection_reason: Optional[str] = None
    clarification_note: Optional[str] = None

    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

    class Settings:
        name = "project_enrollments"
        indexes = [
            IndexModel([("farmer_id", ASCENDING), ("project_id", ASCENDING)], unique=True),
            IndexModel([("farmer_id", ASCENDING), ("status", ASCENDING)]),
            IndexModel([("project_id", ASCENDING), ("current_stage", ASCENDING)]),
        ]
