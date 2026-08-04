from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from beanie import PydanticObjectId
from app.models.marketplace import OrderStatus, PaymentStatus, ShippingStatus, ReturnStatus, DiscountType, ShippingAddress


class MarketplaceProductCreateSchema(BaseModel):
    vendor_id: PydanticObjectId
    category_id: PydanticObjectId
    title: str = Field(..., min_length=2, max_length=200)
    slug: str
    description: str
    brand: str
    sku: str = Field(..., min_length=3)
    pack_size: str = "5 kg Bag"
    weight_kg: float = Field(default=5.0, gt=0)
    technical_composition: Optional[str] = None
    price_inr: float = Field(..., gt=0)
    discount_price_inr: Optional[float] = Field(None, gt=0)
    stock_quantity: int = Field(default=0, ge=0)
    is_organic_certified: bool = False
    certification_doc_url: Optional[str] = None
    images: List[str] = Field(default_factory=list)


class MarketplaceProductUpdateSchema(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    brand: Optional[str] = None
    pack_size: Optional[str] = None
    weight_kg: Optional[float] = Field(None, gt=0)
    price_inr: Optional[float] = Field(None, gt=0)
    discount_price_inr: Optional[float] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    is_organic_certified: Optional[bool] = None
    is_active: Optional[bool] = None


class MarketplaceOrderItemCreateSchema(BaseModel):
    product_id: PydanticObjectId
    vendor_id: PydanticObjectId
    quantity: int = Field(..., gt=0)


class MarketplaceOrderCreateSchema(BaseModel):
    farmer_id: PydanticObjectId
    items: List[MarketplaceOrderItemCreateSchema] = Field(..., min_items=1)
    coupon_code: Optional[str] = None
    shipping_address: ShippingAddress


class MarketplaceProductResponseSchema(BaseModel):
    id: str
    product_id: str
    vendor_id: PydanticObjectId
    category_id: PydanticObjectId
    title: str
    slug: str
    description: str
    brand: str
    sku: str
    pack_size: str
    weight_kg: float
    price_inr: float
    discount_price_inr: Optional[float] = None
    stock_quantity: int
    is_organic_certified: bool
    rating: float
    reviews_count: int
    is_active: bool
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
