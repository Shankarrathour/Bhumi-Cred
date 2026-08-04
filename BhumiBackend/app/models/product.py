from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel, ASCENDING, DESCENDING

from app.models.cloudinary import CloudinaryAsset

class ProductStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"
    ARCHIVED = "archived"

class Product(Document):
    name: str
    slug: str
    description: Optional[str] = None
    category_id: PydanticObjectId
    sku: str
    
    price: float
    original_price: float
    stock_quantity: int
    unit: str  # e.g., "kg", "packet", "litre", "piece"
    
    brand: Optional[str] = None
    vendor_id: Optional[PydanticObjectId] = None
    
    primary_image: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    thumbnail: Optional[str] = None
    # Cloudinary asset metadata for each entry in `images`, same order/length —
    # kept so an image can be deleted from Cloudinary later (mirrors the
    # `*_asset` fields already used on Vendor/Farmer for their photo uploads).
    image_assets: List[CloudinaryAsset] = Field(default_factory=list)
    
    rating: float = 0.0
    review_count: int = 0
    total_sold: int = 0
    
    crop_tags: List[str] = Field(default_factory=list)
    soil_tags: List[str] = Field(default_factory=list)
    season_tags: List[str] = Field(default_factory=list)
    search_keywords: List[str] = Field(default_factory=list)
    
    delivery_time: Optional[str] = None
    low_stock_threshold: int = 10
    
    is_featured: bool = False
    is_active: bool = True
    status: ProductStatus = ProductStatus.PENDING
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "products"
        indexes = [
            IndexModel([("sku", ASCENDING)], unique=True),
            IndexModel([("slug", ASCENDING)], unique=True),
            IndexModel([("name", ASCENDING)]),
            IndexModel([("category_id", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("is_active", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
        ]
