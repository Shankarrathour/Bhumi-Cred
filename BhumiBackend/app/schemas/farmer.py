from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from beanie import PydanticObjectId
from app.models.farmer import KYCStatus, Gender, FarmerCategory, Education, FarmerLocale


class AddressSchema(BaseModel):
    state: str
    district: str
    tehsil: Optional[str] = None
    block: Optional[str] = None
    gram_panchayat: Optional[str] = None
    village: str
    pincode: str = Field(..., pattern=r"^\d{6}$")
    full_address: Optional[str] = None


class AadhaarDetailsSchema(BaseModel):
    aadhaar_number: str = Field(..., pattern=r"^\d{12}$")
    aadhaar_front_url: Optional[str] = None
    aadhaar_back_url: Optional[str] = None


class PANDetailsSchema(BaseModel):
    pan_number: str = Field(..., pattern=r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")
    pan_card_url: Optional[str] = None


class BankAccountDetailsSchema(BaseModel):
    bank_name: str
    branch_name: Optional[str] = None
    account_number: str = Field(..., pattern=r"^\d{9,18}$")
    account_holder_name: str
    ifsc_code: str = Field(..., pattern=r"^[A-Z]{4}0[A-Z0-9]{6}$")
    passbook_doc_url: Optional[str] = None


class FarmerCreateSchema(BaseModel):
    mobile: str = Field(..., pattern=r"^[6-9]\d{9}$")
    full_name: str = Field(..., min_length=2, max_length=100)
    father_name: Optional[str] = None
    email: Optional[EmailStr] = None
    gender: Optional[Gender] = None
    category: Optional[FarmerCategory] = None
    education: Optional[Education] = None
    state: str
    district: str
    village: str
    pincode: str = Field(..., pattern=r"^\d{6}$")


class FarmerUpdateSchema(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    father_name: Optional[str] = None
    email: Optional[EmailStr] = None
    gender: Optional[Gender] = None
    category: Optional[FarmerCategory] = None
    education: Optional[Education] = None
    occupation: Optional[str] = None
    current_address: Optional[AddressSchema] = None
    permanent_address: Optional[AddressSchema] = None
    is_active: Optional[bool] = None


class FarmerKYCReviewSchema(BaseModel):
    kyc_status: KYCStatus
    kyc_remarks: Optional[str] = None


class FarmerOverviewResponse(BaseModel):
    id: str
    farmer_id: Optional[str] = None
    mobile: str
    full_name: Optional[str] = None
    father_name: Optional[str] = None
    email: Optional[EmailStr] = None
    gender: Optional[Gender] = None
    category: Optional[FarmerCategory] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    kyc_status: KYCStatus
    kyc_remarks: Optional[str] = None
    wallet_balance: float = 0.0
    sustainability_score: int = 0
    total_acreage: float = 0.0
    total_trees: int = 0
    carbon_credits_generated: float = 0.0
    is_active: bool = True
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class FarmerActivityLogResponse(BaseModel):
    id: str
    activity_type: str
    title: str
    description: Optional[str] = None
    timestamp: Optional[datetime] = None


class FarmerPublicResponse(BaseModel):
    id: str
    farmer_id: Optional[str] = None
    full_name: Optional[str] = None
    mobile: str
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    kyc_status: KYCStatus = KYCStatus.UNVERIFIED
    is_active: bool = True
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class FarmerResponse(FarmerOverviewResponse):
    pass
