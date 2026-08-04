from typing import Optional, List
from datetime import datetime, timezone
from beanie import Document
from pydantic import BaseModel, Field
from pymongo import IndexModel, ASCENDING

class InvoiceItemModel(BaseModel):
    name: str
    amount: float

class Invoice(Document):
    registration_id: str
    invoice_number: str
    farmer_details: dict
    land_details: dict
    billing_items: List[InvoiceItemModel]
    grand_total: float
    tax: float
    insurance_charges: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "invoices"
        indexes = [
            IndexModel([("registration_id", ASCENDING)]),
            IndexModel([("invoice_number", ASCENDING)], unique=True),
        ]
