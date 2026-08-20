from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.models.project_enrollment import (
    EnrollmentStatus,
    InsurancePolicy,
    InsuranceStatus,
    ProjectStage,
)
from app.models.sustainability_project import SustainabilityProjectStatus


class ProjectMilestoneResponse(BaseModel):
    label: str
    completed: bool


class ProjectSummaryResponse(BaseModel):
    id: str
    title: str
    category: str
    description: str
    district: str
    state: str
    target_area_acres: float
    estimated_carbon_impact: float
    status_label: str
    is_tracking_active: bool
    progress_percent: Optional[int] = None
    current_stage: Optional[str] = None
    trees_registered: Optional[int] = None


class ProjectDetailResponse(ProjectSummaryResponse):
    roadmap: list[ProjectStage]
    eligibility: list[str]
    required_documents: list[str]


class ActiveProjectResponse(BaseModel):
    enrollment_id: str
    project: ProjectDetailResponse
    status: EnrollmentStatus
    current_stage: ProjectStage
    current_stage_label: str
    progress_percent: int
    joined_at: datetime
    ngo_partner: Optional[str] = None
    milestones: list[ProjectMilestoneResponse]
    land_verified: bool
    trees_verified: bool
    mrv_verified: bool
    insurance_active: bool

    # Independent per-stage roadmap status (source of truth for the 9-step
    # Carbon Program roadmap shown in the Farmer App).
    stage_project_assigned: bool
    stage_land_registered: bool
    stage_inspection_completed: bool
    stage_soil_verified: bool
    stage_trees_registered: bool
    stage_insurance_activated: bool
    stage_mrv_monitoring_started: bool
    stage_carbon_estimation_running: bool
    stage_reward_eligible: bool


class ContributionResponse(BaseModel):
    total_land_added_acres: float
    trees_registered: int
    trees_insured: int
    sustainability_score: int
    estimated_carbon_impact: float
    green_family_count: int


class InsuranceProtectionResponse(BaseModel):
    policy: InsurancePolicy
    policy_name: str
    status: InsuranceStatus
    protected_trees: int
    claim_eligibility_percent: int
    duration_years: int
    expiry_date: Optional[datetime] = None


class ProjectsHubResponse(BaseModel):
    active_project: Optional[ActiveProjectResponse]
    contribution: ContributionResponse
    insurance: Optional[InsuranceProtectionResponse]
    explore_projects: list[ProjectSummaryResponse]
    api_flow: list[str]


class JoinProjectRequest(BaseModel):
    land_area_acres: float = Field(..., gt=0, le=10000)
    tree_count: int = Field(..., ge=0, le=1000000)
    crop_type: Optional[str] = Field(None, min_length=2, max_length=80)
    soil_type: Optional[str] = Field(None, min_length=2, max_length=80)
    irrigation_type: Optional[str] = Field(None, min_length=2, max_length=80)
    geo_latitude: Optional[float] = Field(None, ge=-90, le=90)
    geo_longitude: Optional[float] = Field(None, ge=-180, le=180)
    plantation_photo_urls: list[str] = Field(default_factory=list, max_length=10)
    land_proof_url: Optional[str] = None

    @field_validator("plantation_photo_urls")
    @classmethod
    def validate_photo_urls(cls, value: list[str]) -> list[str]:
        for url in value:
            if not url.startswith(("http://", "https://", "/")):
                raise ValueError("Plantation photo URLs must be valid web or stored file URLs.")
        return value


class TreeRegistrationRequest(BaseModel):
    tree_count: int = Field(..., gt=0, le=1000000)
    plantation_photo_urls: list[str] = Field(default_factory=list, max_length=10)
    geo_latitude: float = Field(..., ge=-90, le=90)
    geo_longitude: float = Field(..., ge=-180, le=180)


class EnrollmentResponse(BaseModel):
    enrollment_id: str
    project_id: str
    status: EnrollmentStatus
    current_stage: ProjectStage
    progress_percent: int
    message: str


class AdminProjectReviewRequest(BaseModel):
    status: EnrollmentStatus
    current_stage: Optional[ProjectStage] = None
    progress_percent: Optional[int] = Field(None, ge=0, le=100)
    land_verified: Optional[bool] = None
    trees_verified: Optional[bool] = None
    mrv_verified: Optional[bool] = None
    insured_trees: Optional[int] = Field(None, ge=0, le=1000000)
    land_area_acres: Optional[float] = Field(None, ge=0.0)
    registered_trees: Optional[int] = Field(None, ge=0)
    estimated_carbon_impact: Optional[float] = Field(None, ge=0.0)
    rejection_reason: Optional[str] = Field(None, max_length=500)
    clarification_note: Optional[str] = Field(None, max_length=500)

    # Independent per-stage roadmap actions — each is only applied when
    # explicitly sent as True by the specific Admin lifecycle action that
    # completes that stage (Complete Inspection, Verify Soil, Approve Trees,
    # Activate Insurance, Start MRV, Run Carbon Estimation, Mark Reward Eligible).
    stage_inspection_completed: Optional[bool] = None
    stage_soil_verified: Optional[bool] = None
    stage_trees_registered: Optional[bool] = None
    stage_insurance_activated: Optional[bool] = None
    stage_mrv_monitoring_started: Optional[bool] = None
    stage_carbon_estimation_running: Optional[bool] = None
    stage_reward_eligible: Optional[bool] = None

    @field_validator("status")
    @classmethod
    def validate_review_status(cls, value: EnrollmentStatus) -> EnrollmentStatus:
        allowed = {
            EnrollmentStatus.ACTIVE,
            EnrollmentStatus.REJECTED,
            EnrollmentStatus.CLARIFICATION_REQUESTED,
            EnrollmentStatus.COMPLETED,
        }
        if value not in allowed:
            raise ValueError("Admin review must activate, reject, request clarification, or complete.")
        return value


class CreateProjectRequest(BaseModel):
    project_id: str = Field(..., min_length=3, max_length=120, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    title: str = Field(..., min_length=3, max_length=160)
    category: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=10, max_length=1000)
    district: str = Field(..., min_length=2, max_length=80)
    state: str = Field(..., min_length=2, max_length=80)
    target_area_acres: float = Field(..., gt=0)
    estimated_carbon_impact: float = Field(..., ge=0)
    ngo_partner: Optional[str] = Field(None, max_length=160)
    status: SustainabilityProjectStatus = SustainabilityProjectStatus.AVAILABLE
    eligibility: list[str] = Field(default_factory=list, max_length=20)
    required_documents: list[str] = Field(default_factory=list, max_length=20)
    is_public: bool = True


class UpdateProjectRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=160)
    category: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, min_length=10, max_length=1000)
    district: Optional[str] = Field(None, min_length=2, max_length=80)
    state: Optional[str] = Field(None, min_length=2, max_length=80)
    target_area_acres: Optional[float] = Field(None, gt=0)
    estimated_carbon_impact: Optional[float] = Field(None, ge=0)
    ngo_partner: Optional[str] = Field(None, max_length=160)
    status: Optional[SustainabilityProjectStatus] = None
    eligibility: Optional[list[str]] = Field(None, max_length=20)
    required_documents: Optional[list[str]] = Field(None, max_length=20)
    is_public: Optional[bool] = None
    is_active: Optional[bool] = None


class AdminProjectResponse(ProjectDetailResponse):
    project_id: str
    status: SustainabilityProjectStatus
    is_public: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AdminProjectEnrollmentResponse(BaseModel):
    enrollment_id: str
    farmer_id: str
    farmer_name: Optional[str] = None
    project_id: str
    project_title: str
    status: EnrollmentStatus
    current_stage: ProjectStage
    current_stage_label: str
    progress_percent: int
    land_area_acres: float
    registered_trees: int
    insured_trees: int
    green_family_count: int
    estimated_carbon_impact: float
    land_verified: bool
    trees_verified: bool
    mrv_verified: bool
    insurance_active: bool
    joined_at: datetime
    updated_at: datetime

    # Independent per-stage roadmap status — same source of truth the Farmer
    # App reads, so the Admin panel's own action buttons stay in sync with it.
    stage_project_assigned: bool
    stage_land_registered: bool
    stage_inspection_completed: bool
    stage_soil_verified: bool
    stage_trees_registered: bool
    stage_insurance_activated: bool
    stage_mrv_monitoring_started: bool
    stage_carbon_estimation_running: bool
    stage_reward_eligible: bool


class AdminAssignProjectRequest(BaseModel):
    farmer_id: str = Field(..., min_length=3, max_length=100)
    land_area_acres: float = Field(..., gt=0, le=10000)
    tree_count: int = Field(default=0, ge=0, le=1000000)
