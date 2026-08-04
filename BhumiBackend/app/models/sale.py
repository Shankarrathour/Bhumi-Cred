from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from beanie import Document, PydanticObjectId
from pydantic import Field

class SaleStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class CarbonCreditSale(Document):
    farmer_id: PydanticObjectId
    credits_to_sell: float
    gross_amount: float
    platform_fee: float
    gst_amount: float
    net_amount: float
    status: SaleStatus = Field(default=SaleStatus.PENDING)
    remarks: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None

    class Settings:
        name = "carbon_credit_sales"
