from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class VendorSendOTPRequest(BaseModel):
    phone: str

class VendorRegisterRequest(BaseModel):
    name: str
    store_name: str
    phone: str
    gst_number: str
    address: str

class VendorVerifyOTPRequest(BaseModel):
    phone: str
    otp: str

class VendorAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_new_user: bool

class VendorProfileUpdateRequest(BaseModel):
    name: str
    store_name: str
    gst_number: str
    address: str

class VendorResponse(BaseModel):
    id: str
    vendor_id: Optional[str] = None
    name: Optional[str]
    phone: str
    store_name: Optional[str]
    gst_number: Optional[str]
    address: Optional[str]
    state: Optional[str] = None
    district: Optional[str] = None
    tehsil: Optional[str] = None
    village_city: Optional[str] = None
    status: str
    wallet_balance: float
    created_at: datetime

class VendorListResponse(BaseModel):
    items: List[VendorResponse]
    total: int
    page: int
    limit: int
    total_pages: int
    has_next: bool

class ProductCreateRequest(BaseModel):
    name: str
    category: str
    price: float
    stock: int
    image_url: Optional[str] = None
    description: Optional[str] = None

class ProductResponse(BaseModel):
    id: str
    vendor_id: str
    name: str
    category: str
    price: float
    stock: int
    image_url: Optional[str]
    description: Optional[str]
    status: str
    created_at: datetime

class OrderItemSchema(BaseModel):
    product_id: str
    name: str
    quantity: int
    price: float

class OrderResponse(BaseModel):
    id: str
    order_number: Optional[str] = None
    farmer_id: str
    farmer_name: Optional[str] = None
    vendor_id: str
    # Human-readable public vendor ID (e.g. "VEN-000028"), resolved from the
    # Vendor document. Distinct from `vendor_id` above, which remains the raw
    # Mongo ObjectId relationship reference and is unchanged.
    vendor_public_id: Optional[str] = None
    items: List[OrderItemSchema]
    total_amount: float
    status: str
    delivery_address: Optional[str]
    created_at: datetime

class OrderStatusUpdateRequest(BaseModel):
    status: str
