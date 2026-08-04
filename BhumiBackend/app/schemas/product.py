from typing import Optional, List, Annotated, Any
from datetime import datetime
from pydantic import BaseModel, Field, BeforeValidator, model_validator
from app.models.product import ProductStatus

StrObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if v else v)]

class ProductCategoryResponse(BaseModel):
    id: str
    name: str
    slug: str

from enum import Enum

class ProductSort(str, Enum):
    NEWEST = "newest"
    OLDEST = "oldest"
    PRICE_LOW = "price_low"
    PRICE_HIGH = "price_high"

class ProductCardResponse(BaseModel):
    id: StrObjectId
    name: str
    slug: str
    price: float
    original_price: float
    primary_image: Optional[str] = None
    rating: float
    review_count: int
    category: ProductCategoryResponse

    class Config:
        from_attributes = True

class ProductDiscoveryResponse(BaseModel):
    items: List[ProductCardResponse]
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool

class ProductListResponse(BaseModel):
    items: List[ProductCardResponse]
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool


class ProductBase(BaseModel):
    name: str = Field(..., max_length=150)
    description: Optional[str] = None
    category_id: StrObjectId
    sku: str = Field(..., max_length=50)
    
    price: float = Field(..., gt=0)
    original_price: float = Field(..., gt=0)
    stock_quantity: int = Field(..., ge=0)
    unit: str
    
    brand: Optional[str] = None
    vendor_id: Optional[StrObjectId] = None
    
    primary_image: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    thumbnail: Optional[str] = None
    
    crop_tags: List[str] = Field(default_factory=list)
    soil_tags: List[str] = Field(default_factory=list)
    season_tags: List[str] = Field(default_factory=list)
    search_keywords: List[str] = Field(default_factory=list)
    
    delivery_time: Optional[str] = None
    low_stock_threshold: int = Field(10, ge=0)
    
    is_featured: bool = False
    is_active: bool = True
    status: ProductStatus = ProductStatus.PENDING

    @model_validator(mode='after')
    def check_prices(self) -> 'ProductBase':
        if self.price > self.original_price:
            raise ValueError('original_price must be greater than or equal to price')
        return self

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = None
    category_id: Optional[StrObjectId] = None
    sku: Optional[str] = Field(None, max_length=50)
    
    price: Optional[float] = Field(None, gt=0)
    original_price: Optional[float] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    unit: Optional[str] = None
    
    brand: Optional[str] = None
    vendor_id: Optional[StrObjectId] = None
    
    primary_image: Optional[str] = None
    images: Optional[List[str]] = None
    thumbnail: Optional[str] = None
    
    crop_tags: Optional[List[str]] = None
    soil_tags: Optional[List[str]] = None
    season_tags: Optional[List[str]] = None
    search_keywords: Optional[List[str]] = None
    
    delivery_time: Optional[str] = None
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    status: Optional[ProductStatus] = None

class ProductResponse(ProductBase):
    id: StrObjectId
    slug: str
    rating: float
    review_count: int
    total_sold: int
    created_at: datetime
    updated_at: datetime
    
    # Nested category details for the response
    category: ProductCategoryResponse
    
    # Remove raw category_id from response since we have the nested object
    category_id: Any = Field(exclude=True)

    class Config:
        from_attributes = True

class VendorProductUpdate(ProductUpdate):
    pass

class VendorStockUpdate(BaseModel):
    stock_quantity: int

class VendorProductResponse(ProductResponse):
    pass

class VendorProductListResponse(BaseModel):
    items: List[VendorProductResponse]
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool

class AdminPendingProductResponse(ProductResponse):
    pass

class AdminPendingProductListResponse(BaseModel):
    items: List[AdminPendingProductResponse]
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool

class AdminProductStatusUpdateResponse(BaseModel):
    product_id: str
    status: ProductStatus
    message: str
    updated_at: datetime
