from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class OverviewCardMetrics(BaseModel):
    total_farmers: int = Field(default=7842)
    total_govt_bodies: int = Field(default=124)
    total_partners: int = Field(default=892)
    pending_approval: int = Field(default=38)
    pending_kyc: int = Field(default=148)
    pending_land: int = Field(default=312)
    pending_projects: int = Field(default=24)
    pending_insurance: int = Field(default=67)
    pending_withdrawals: int = Field(default=42)
    total_revenue_inr: float = Field(default=28400000.0) # ₹2.84 Cr
    total_carbon_credits_tco2e: float = Field(default=1240000.0) # 1.24M tCO2e
    total_marketplace_orders: int = Field(default=1840)


class ActivityFeedItem(BaseModel):
    id: str
    type: str  # Farmer Registered, Land Submitted, Govt Body Approved, Partner Registered, Insurance Purchased, Marketplace Order, Withdrawal Request
    title: str
    subtitle: str
    time: str
    route: str


class ProductSummaryResponse(BaseModel):
    total_products: int = 25
    pending_approval: int = 3
    approved_products: int = 20
    rejected_products: int = 2
    suspended_products: int = 0
    archived_products: int = 0
    hidden_products: int = 0
    visible_products: int = 20


class VendorSummaryResponse(BaseModel):
    total_vendors: int = 73
    active_vendors: int = 68
    inactive_vendors: int = 5
    vendors_with_products: int = 42
    vendors_without_products: int = 31


class CategorySummaryResponse(BaseModel):
    total_categories: int = 12
    active_categories: int = 12
    inactive_categories: int = 0
    products_per_category: int = 2


class MarketplaceSummaryResponse(BaseModel):
    products_added_today: int = 2
    products_added_this_week: int = 8
    products_added_this_month: int = 25
    newest_product_name: Optional[str] = "Organic Neem Fertilizer"
    newest_product_id: Optional[str] = "PRD-9021"
    latest_approved_product_name: Optional[str] = "Solar Water Pump 5HP"
    latest_approved_product_id: Optional[str] = "PRD-9018"


class InventorySummaryResponse(BaseModel):
    total_stock: int = 15400
    low_stock_products: int = 3
    out_of_stock_products: int = 1


class AdminMarketplaceDashboardResponse(BaseModel):
    overview_cards: OverviewCardMetrics = Field(default_factory=OverviewCardMetrics)
    recent_activities: List[ActivityFeedItem] = Field(default_factory=list)
    product_summary: ProductSummaryResponse = Field(default_factory=ProductSummaryResponse)
    vendor_summary: VendorSummaryResponse = Field(default_factory=VendorSummaryResponse)
    category_summary: CategorySummaryResponse = Field(default_factory=CategorySummaryResponse)
    marketplace_summary: MarketplaceSummaryResponse = Field(default_factory=MarketplaceSummaryResponse)
    inventory_summary: InventorySummaryResponse = Field(default_factory=InventorySummaryResponse)
