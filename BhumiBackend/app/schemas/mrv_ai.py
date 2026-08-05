from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from beanie import PydanticObjectId
from app.models.mrv_ai import FlightStatus, VerificationStatus, PriorityLevel, MediaType, SpeciesDetection


class MRVAIDetectionCreateSchema(BaseModel):
    land_id: PydanticObjectId
    source_type: str = "drone"
    source_id: PydanticObjectId
    ai_model_name: str = "TreeNet-v2.1"
    detected_trees_count: int = Field(..., ge=0)
    ai_accuracy_score_percent: float = Field(default=96.5, ge=0.0, le=100.0)
    species_breakdown: List[SpeciesDetection] = Field(default_factory=list)


class MRVVerificationQueueCreateSchema(BaseModel):
    land_id: PydanticObjectId
    project_id: str
    mrv_stage: str = "mrv_stage"
    priority: PriorityLevel = PriorityLevel.MEDIUM
    assigned_auditor_id: Optional[PydanticObjectId] = None


class MRVAIDetectionResponseSchema(BaseModel):
    id: str
    detection_id: str
    land_id: PydanticObjectId
    source_type: str
    source_id: PydanticObjectId
    ai_model_name: str
    detected_trees_count: int
    ground_truth_verified_count: Optional[int] = None
    ai_accuracy_score_percent: float
    species_breakdown: List[SpeciesDetection]
    is_deleted: bool = False
    processed_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MRVVerificationQueueResponseSchema(BaseModel):
    id: str
    queue_id: str
    land_id: PydanticObjectId
    project_id: str
    mrv_stage: str
    priority: PriorityLevel
    assigned_auditor_id: Optional[PydanticObjectId] = None
    verification_status: VerificationStatus
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
