from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


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
    full_name: str
    father_name: Optional[str] = None
    email: Optional[EmailStr] = None
    gender: Optional[str] = None
    category: Optional[str] = None
    state: str
    district: str
    village: str
    pincode: str = Field(..., pattern=r"^\d{6}$")


class FarmerUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    father_name: Optional[str] = None
    email: Optional[EmailStr] = None
    gender: Optional[str] = None
    category: Optional[str] = None
    occupation: Optional[str] = None
    current_address: Optional[AddressSchema] = None
    permanent_address: Optional[AddressSchema] = None


class FarmerKYCReviewSchema(BaseModel):
    kyc_status: str = Field(..., example="approved / rejected / suspended")
    kyc_remarks: Optional[str] = None


class FarmerOverviewResponse(BaseModel):
    id: str
    farmer_id: Optional[str] = None
    mobile: str
    full_name: Optional[str] = None
    father_name: Optional[str] = None
    email: Optional[EmailStr] = None
    gender: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    kyc_status: str
    kyc_remarks: Optional[str] = None
    wallet_balance: float
    sustainability_score: int
    total_acreage: float
    total_trees: int
    carbon_credits_generated: float
    is_active: bool
    created_at: datetime


class FarmerActivityLogResponse(BaseModel):
    id: str
    activity_type: str
    title: str
    description: Optional[str] = None
    timestamp: datetime


class FarmerPublicResponse(BaseModel):
    id: str
    farmer_id: Optional[str] = None
    full_name: Optional[str] = None
    mobile: str
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    kyc_status: str = "unverified"
    is_active: bool = True
    created_at: datetime


class FarmerResponse(FarmerOverviewResponse):
    pass
