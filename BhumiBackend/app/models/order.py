from enum import Enum
from datetime import datetime, timezone
from typing import List, Optional
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel, ASCENDING, DESCENDING
from app.core.enums import OrderStatus

class OrderStatusHistory(BaseModel):
    status: OrderStatus
    changed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    changed_by: str
    remarks: Optional[str] = None

class OrderItemSnapshot(BaseModel):
    product_id: PydanticObjectId
    product_name: str
    quantity: int
    price: float
    original_price: float
    subtotal: float
    category_id: PydanticObjectId
    primary_image: Optional[str] = None
    vendor_id: Optional[PydanticObjectId] = None

class OrderAddressSnapshot(BaseModel):
    full_name: str
    mobile: str
    address_line_1: str
    address_line_2: Optional[str] = None
    city: str
    state: str
    pincode: str

class Order(Document):
    order_number: str
    farmer_id: PydanticObjectId
    items: List[OrderItemSnapshot]
    
    subtotal: float
    discount: float
    delivery_charge: float
    final_total: float
    
    delivery_address: OrderAddressSnapshot
    status: OrderStatus = OrderStatus.PENDING
    status_history: List[OrderStatusHistory] = []
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "orders"
        indexes = [
            IndexModel([("order_number", ASCENDING)], unique=True),
            IndexModel([("farmer_id", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
            IndexModel([("items.vendor_id", ASCENDING)]),
        ]
