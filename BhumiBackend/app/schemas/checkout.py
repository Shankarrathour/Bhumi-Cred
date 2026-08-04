from typing import List, Optional
from pydantic import BaseModel
from app.schemas.product import ProductCardResponse

class CheckoutAddress(BaseModel):
    full_name: str
    mobile: str
    address_line_1: str
    address_line_2: Optional[str] = None
    city: str
    state: str
    pincode: str

class CheckoutRequest(BaseModel):
    delivery_address: CheckoutAddress

class CheckoutItemResponse(BaseModel):
    quantity: int
    subtotal: float
    product: ProductCardResponse

class CheckoutSummaryResponse(BaseModel):
    items: List[CheckoutItemResponse]
    total_items: int
    subtotal: float
    discount: float
    grand_total: float
    delivery_charge: float
    final_total: float
    delivery_address: CheckoutAddress
    stock_valid: bool = True
