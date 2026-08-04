from typing import List
from pydantic import BaseModel, Field
from app.schemas.product import StrObjectId, ProductCardResponse

class CartCreate(BaseModel):
    product_id: StrObjectId
    quantity: int = Field(default=1, ge=1)

class CartUpdate(BaseModel):
    quantity: int = Field(..., ge=1)

class CartItemResponse(BaseModel):
    id: StrObjectId
    quantity: int
    subtotal: float
    product: ProductCardResponse

    class Config:
        from_attributes = True

class CartResponse(BaseModel):
    items: List[CartItemResponse]
    total_items: int
    subtotal: float
    discount: float
    grand_total: float

class CartCountResponse(BaseModel):
    count: int

class CartSummaryResponse(BaseModel):
    total_items: int
    subtotal: float
    discount: float
    grand_total: float
