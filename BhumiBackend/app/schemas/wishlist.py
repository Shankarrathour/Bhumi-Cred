from typing import List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.product import StrObjectId, ProductCardResponse

class WishlistCreate(BaseModel):
    product_id: StrObjectId

class WishlistItemResponse(BaseModel):
    id: StrObjectId
    created_at: datetime
    product: ProductCardResponse

    class Config:
        from_attributes = True

class WishlistResponse(BaseModel):
    items: List[WishlistItemResponse]
    total_items: int

class WishlistStatusResponse(BaseModel):
    wishlisted: bool

class WishlistCountResponse(BaseModel):
    count: int

class WishlistToggleRequest(BaseModel):
    product_id: StrObjectId

class WishlistToggleResponse(BaseModel):
    wishlisted: bool
    message: str
