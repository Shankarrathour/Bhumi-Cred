from datetime import datetime, timezone
from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel, ASCENDING

class CartItem(Document):
    farmer_id: PydanticObjectId
    product_id: PydanticObjectId
    quantity: int = 1
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "cart_items"
        indexes = [
            IndexModel([("farmer_id", ASCENDING), ("product_id", ASCENDING)], unique=True),
            IndexModel([("farmer_id", ASCENDING)]),
            IndexModel([("product_id", ASCENDING)]),
        ]
