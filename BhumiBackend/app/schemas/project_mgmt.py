from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from beanie import PydanticObjectId
from app.models.project_mgmt import ProjectStatus, ProjectStage, MilestoneStatus, EnrollmentStatus, RiskRating, CarbonRegistry


class ProjectCreateSchema(BaseModel):
    project_id: str = Field(..., min_length=3, max_length=100, description="e.g. mp-agroforestry-carbon-mission")
    title: str = Field(..., min_length=3, max_length=200)
    category: str = "Sustainability Mission"
    description: str
    district: str
    state: str
    target_area_acres: float = Field(..., gt=0)
    target_trees_count: int = Field(default=0, ge=0)
    estimated_carbon_impact: float = Field(..., ge=0)
    ngo_partner: Optional[str] = "Green Earth NGO"
    ngo_partner_id: Optional[PydanticObjectId] = None
    eligibility: List[str] = Field(default_factory=list)
    required_documents: List[str] = Field(default_factory=list)


class ProjectUpdateSchema(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    category: Optional[str] = None
    description: Optional[str] = None
    target_area_acres: Optional[float] = Field(None, gt=0)
    target_trees_count: Optional[int] = Field(None, ge=0)
    estimated_carbon_impact: Optional[float] = Field(None, ge=0)
    status: Optional[ProjectStatus] = None
    is_public: Optional[bool] = None
    is_active: Optional[bool] = None


class ProjectMilestoneCreateSchema(BaseModel):
    milestone_id: str
    project_id: str
    title: str
    description: str
    target_date: datetime


class ProjectResponseSchema(BaseModel):
    id: str
    project_id: str
    title: str
    category: str
    description: str
    district: str
    state: str
    target_area_acres: float
    target_trees_count: int
    estimated_carbon_impact: float
    ngo_partner: str
    status: ProjectStatus
    is_public: bool
    is_active: bool
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
