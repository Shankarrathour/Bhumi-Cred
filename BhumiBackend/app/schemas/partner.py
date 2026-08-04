from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from beanie import PydanticObjectId
from app.models.partner import PartnerType, VerificationStatus, AgreementType, AgreementStatus, CompanyDetails


class PartnerCreateSchema(BaseModel):
    partner_id: str = Field(..., min_length=3, max_length=100, description="e.g. PTR-2026-0045")
    partner_type: PartnerType
    company_details: CompanyDetails


class PartnerAgreementCreateSchema(BaseModel):
    agreement_number: str = Field(..., min_length=3, max_length=100, description="e.g. AGR-2026-0091")
    partner_id: PydanticObjectId
    agreement_type: AgreementType
    title: str = Field(..., min_length=3, max_length=200)
    effective_date: datetime
    expiry_date: datetime
    agreement_document_url: str


class PartnerResponseSchema(BaseModel):
    id: str
    partner_id: str
    partner_type: PartnerType
    company_details: CompanyDetails
    verification_status: VerificationStatus
    overall_rating: float
    total_reviews_count: int
    total_revenue_generated_inr: float
    total_payout_settled_inr: float
    pending_payout_inr: float
    is_active: bool
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PartnerAgreementResponseSchema(BaseModel):
    id: str
    agreement_number: str
    partner_id: PydanticObjectId
    agreement_type: AgreementType
    title: str
    effective_date: datetime
    expiry_date: datetime
    agreement_document_url: str
    signed_by_partner: bool
    signed_by_admin: bool
    status: AgreementStatus
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
