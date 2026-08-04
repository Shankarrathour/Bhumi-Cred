from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.core.enums import OrderStatus
from app.schemas.checkout import CheckoutAddress

class OrderItemCreate(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    original_price: float
    subtotal: float
    category_id: str
    primary_image: Optional[str] = None

class OrderItemResponse(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    original_price: float
    subtotal: float
    category_id: str
    primary_image: Optional[str] = None

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    subtotal: float
    discount: float
    delivery_charge: float
    final_total: float
    delivery_address: CheckoutAddress

class OrderResponse(BaseModel):
    id: str
    order_number: str
    farmer_id: str
    items: List[OrderItemResponse]
    subtotal: float
    discount: float
    delivery_charge: float
    final_total: float
    delivery_address: CheckoutAddress
    status: OrderStatus
    created_at: datetime
    updated_at: datetime

class OrderSummaryResponse(BaseModel):
    order_id: str
    order_number: str
    status: OrderStatus
    final_total: float
    created_at: datetime

class OrderListItemResponse(BaseModel):
    order_id: str
    order_number: str
    status: OrderStatus
    total_items: int
    final_total: float
    created_at: datetime

class OrderListResponse(BaseModel):
    items: List[OrderListItemResponse]
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool

class OrderStatusHistoryResponse(BaseModel):
    status: OrderStatus
    changed_at: datetime
    changed_by: str
    remarks: Optional[str] = None

class OrderDetailsResponse(BaseModel):
    id: str
    order_number: str
    status: OrderStatus
    status_history: List[OrderStatusHistoryResponse]
    items: List[OrderItemResponse]
    subtotal: float
    discount: float
    delivery_charge: float
    final_total: float
    delivery_address: CheckoutAddress
    created_at: datetime

class VendorOrderItemResponse(OrderItemResponse):
    pass

class VendorOrderSummaryResponse(BaseModel):
    order_id: str
    order_number: str
    status: OrderStatus
    vendor_subtotal: float
    vendor_total_items: int
    created_at: datetime

class VendorOrderResponse(BaseModel):
    order_id: str
    order_number: str
    status: OrderStatus
    created_at: datetime
    vendor_items: List[VendorOrderItemResponse]
    vendor_subtotal: float
    vendor_total_items: int
    delivery_address: CheckoutAddress

class VendorOrderListResponse(BaseModel):
    items: List[VendorOrderSummaryResponse]
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool
