from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class ProductSummaryResponse(BaseModel):
    total_products: int
    pending_approval: int
    approved_products: int
    rejected_products: int
    suspended_products: int
    archived_products: int
    hidden_products: int
    visible_products: int

class VendorSummaryResponse(BaseModel):
    total_vendors: int
    active_vendors: int
    inactive_vendors: int
    vendors_with_products: int
    vendors_without_products: int

class CategorySummaryResponse(BaseModel):
    total_categories: int
    active_categories: int
    inactive_categories: int
    products_per_category: int  # Added as requested, will represent an average or total count 

class MarketplaceSummaryResponse(BaseModel):
    products_added_today: int
    products_added_this_week: int
    products_added_this_month: int
    newest_product_name: Optional[str] = None
    newest_product_id: Optional[str] = None
    latest_approved_product_name: Optional[str] = None
    latest_approved_product_id: Optional[str] = None

class InventorySummaryResponse(BaseModel):
    total_stock: int
    low_stock_products: int
    out_of_stock_products: int

class AdminMarketplaceDashboardResponse(BaseModel):
    product_summary: ProductSummaryResponse
    vendor_summary: VendorSummaryResponse
    category_summary: CategorySummaryResponse
    marketplace_summary: MarketplaceSummaryResponse
    inventory_summary: InventorySummaryResponse
