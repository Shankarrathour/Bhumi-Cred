from datetime import datetime, timezone, timedelta
from app.repositories.product import ProductRepository
from app.repositories.category import CategoryRepository
from app.repositories.farmer import FarmerRepository
from app.schemas.admin_dashboard import (
    AdminMarketplaceDashboardResponse,
    ProductSummaryResponse,
    VendorSummaryResponse,
    CategorySummaryResponse,
    MarketplaceSummaryResponse,
    InventorySummaryResponse
)

class AdminMarketplaceDashboardService:
    def __init__(
        self,
        product_repo: ProductRepository,
        category_repo: CategoryRepository,
        farmer_repo: FarmerRepository
    ):
        self.product_repo = product_repo
        self.category_repo = category_repo
        self.farmer_repo = farmer_repo

    async def get_dashboard_summary(self) -> AdminMarketplaceDashboardResponse:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        month_start = today_start.replace(day=1)
        
        # 1. Product & Marketplace Aggregation
        prod_data = await self.product_repo.get_admin_marketplace_product_stats(today_start, week_start, month_start)
        stats = prod_data.get("stats", {})
        
        summary_stats = stats.get("summary", [{}])[0] if stats.get("summary") else {}
        inventory_stats = stats.get("inventory", [{}])[0] if stats.get("inventory") else {}
        timeline_stats = stats.get("timeline", [{}])[0] if stats.get("timeline") else {}
        vendors_with_products_list = stats.get("vendors_with_products", [])
        
        # 2. Vendors Summary Aggregation
        # Count distinct vendors with products from the facet
        total_vendors_with_products = len(vendors_with_products_list)
        vendor_stats = await self.farmer_repo.get_admin_vendor_stats(total_vendors_with_products)
        
        # 3. Category Summary Aggregation
        category_stats = await self.category_repo.get_admin_category_stats()
        # Compute avg products per category:
        total_products = summary_stats.get("total", 0)
        total_categories = category_stats.get("total", 0)
        products_per_category = (total_products // total_categories) if total_categories > 0 else 0
        
        newest = prod_data.get("newest")
        latest_approved = prod_data.get("latest_approved")

        return AdminMarketplaceDashboardResponse(
            product_summary=ProductSummaryResponse(
                total_products=total_products,
                pending_approval=summary_stats.get("pending", 0),
                approved_products=summary_stats.get("approved", 0),
                rejected_products=summary_stats.get("rejected", 0),
                suspended_products=summary_stats.get("suspended", 0),
                archived_products=summary_stats.get("archived", 0),
                hidden_products=summary_stats.get("hidden", 0),
                visible_products=summary_stats.get("visible", 0)
            ),
            vendor_summary=VendorSummaryResponse(
                total_vendors=vendor_stats.get("total_vendors", 0),
                active_vendors=vendor_stats.get("active_vendors", 0),
                inactive_vendors=vendor_stats.get("inactive_vendors", 0),
                vendors_with_products=vendor_stats.get("vendors_with_products", 0),
                vendors_without_products=vendor_stats.get("vendors_without_products", 0)
            ),
            category_summary=CategorySummaryResponse(
                total_categories=total_categories,
                active_categories=category_stats.get("active", 0),
                inactive_categories=category_stats.get("inactive", 0),
                products_per_category=products_per_category
            ),
            marketplace_summary=MarketplaceSummaryResponse(
                products_added_today=timeline_stats.get("added_today", 0),
                products_added_this_week=timeline_stats.get("added_this_week", 0),
                products_added_this_month=timeline_stats.get("added_this_month", 0),
                newest_product_name=newest.name if newest else None,
                newest_product_id=str(newest.id) if newest else None,
                latest_approved_product_name=latest_approved.name if latest_approved else None,
                latest_approved_product_id=str(latest_approved.id) if latest_approved else None
            ),
            inventory_summary=InventorySummaryResponse(
                total_stock=inventory_stats.get("total_stock", 0),
                low_stock_products=inventory_stats.get("low_stock", 0),
                out_of_stock_products=inventory_stats.get("out_of_stock", 0)
            )
        )
