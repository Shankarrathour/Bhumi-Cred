from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from beanie import PydanticObjectId
from app.models.carbon_registry import RegistryType, RegistryStatus, RegistryDocType, BuyerType, TransferStatus, CreditAction


class CreditIssuanceCreateSchema(BaseModel):
    registry_project_id: PydanticObjectId
    verification_report_id: PydanticObjectId
    vintage_year: int = Field(..., ge=2000, le=2100)
    serial_number_range: str = Field(..., min_length=5, description="e.g. VRA-2026-000001 to 017700")
    quantity_tco2e: float = Field(..., gt=0)
    buffer_pool_quantity_tco2e: float = Field(default=0.0, ge=0)
    available_quantity_tco2e: float = Field(..., ge=0)
    issuance_date: datetime
    certificate_url: str


class CreditRetirementCreateSchema(BaseModel):
    issuance_id: PydanticObjectId
    buyer_id: PydanticObjectId
    quantity_retired: float = Field(..., gt=0)
    serial_numbers_retired: List[str] = Field(default_factory=list)
    retirement_reason: str = Field(..., min_length=3)
    beneficiary_name: str = Field(..., min_length=2)
    retirement_certificate_url: str


class CreditIssuanceResponseSchema(BaseModel):
    id: str
    issuance_id: str
    registry_project_id: PydanticObjectId
    verification_report_id: PydanticObjectId
    vintage_year: int
    serial_number_range: str
    quantity_tco2e: float
    buffer_pool_quantity_tco2e: float
    available_quantity_tco2e: float
    issuance_date: datetime
    certificate_url: str
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RegistryProjectResponseSchema(BaseModel):
    id: str
    registry_project_id: str
    project_name: str
    registry_type: RegistryType
    methodology_code: str
    developer_id: PydanticObjectId
    host_country: str
    crediting_period_start: datetime
    crediting_period_end: datetime
    registry_status: RegistryStatus
    is_active: bool
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
