from datetime import datetime, timezone
from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel, ASCENDING

class Wishlist(Document):
    farmer_id: PydanticObjectId
    product_id: PydanticObjectId
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "wishlists"
        indexes = [
            IndexModel([("farmer_id", ASCENDING), ("product_id", ASCENDING)], unique=True),
            IndexModel([("farmer_id", ASCENDING)]),
            IndexModel([("product_id", ASCENDING)]),
        ]
