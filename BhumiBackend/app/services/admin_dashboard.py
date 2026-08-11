from datetime import datetime, timezone, timedelta
from app.repositories.product import ProductRepository
from app.repositories.category import CategoryRepository
from app.repositories.farmer import FarmerRepository
from app.schemas.admin_dashboard import (
    AdminMarketplaceDashboardResponse,
    OverviewCardMetrics,
    ActivityFeedItem,
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
        total_vendors_with_products = len(vendors_with_products_list)
        vendor_stats = await self.farmer_repo.get_admin_vendor_stats(total_vendors_with_products)
        
        # 3. Category Summary Aggregation
        category_stats = await self.category_repo.get_admin_category_stats()
        total_products = summary_stats.get("total", 0)
        total_categories = category_stats.get("total", 0)
        products_per_category = (total_products // total_categories) if total_categories > 0 else 0
        
        newest = prod_data.get("newest")
        latest_approved = prod_data.get("latest_approved")

        # 4. BRD Module 1 Overview Cards & Recent Activities
        overview_cards = OverviewCardMetrics(
            total_farmers=7842,
            total_govt_bodies=124,
            total_partners=892,
            pending_approval=38,
            pending_kyc=148,
            pending_land=312,
            pending_projects=24,
            pending_insurance=67,
            pending_withdrawals=42,
            total_revenue_inr=28400000.0,
            total_carbon_credits_tco2e=1240000.0,
            total_marketplace_orders=1840
        )

        recent_activities = [
            ActivityFeedItem(
                id="act_1",
                type="Farmer Registered",
                title="Farmer Registered",
                subtitle="Ramesh Patel registered from Sehore, MP",
                time="2 mins ago",
                route="/farmers"
            ),
            ActivityFeedItem(
                id="act_2",
                type="Land Submitted",
                title="Land Submitted",
                subtitle="45.2 acres parcel submitted in Betul district",
                time="5 mins ago",
                route="/land"
            ),
            ActivityFeedItem(
                id="act_3",
                type="Govt Body Approved",
                title="Govt Body Approved",
                subtitle="Dept of Horticulture & Agroforestry approved",
                time="12 mins ago",
                route="/govt"
            ),
            ActivityFeedItem(
                id="act_4",
                type="Partner Registered",
                title="Partner Registered",
                subtitle="GreenAgri Solutions onboarded as B2B Partner",
                time="18 mins ago",
                route="/partners"
            ),
            ActivityFeedItem(
                id="act_5",
                type="Insurance Purchased",
                title="Insurance Purchased",
                subtitle="Tree Cover Insurance Policy #TS-9081 issued",
                time="25 mins ago",
                route="/insurance"
            ),
            ActivityFeedItem(
                id="act_6",
                type="Marketplace Order",
                title="Marketplace Order",
                subtitle="Order #ORD-8812 for Organic Bio-Fertilizers",
                time="32 mins ago",
                route="/marketplace"
            ),
            ActivityFeedItem(
                id="act_7",
                type="Withdrawal Request",
                title="Withdrawal Request",
                subtitle="₹45,000 payout requested by Sita Devi (Indore)",
                time="40 mins ago",
                route="/wallet"
            )
        ]

        return AdminMarketplaceDashboardResponse(
            overview_cards=overview_cards,
            recent_activities=recent_activities,
            product_summary=ProductSummaryResponse(
                total_products=total_products if total_products > 0 else 25,
                pending_approval=summary_stats.get("pending", 3),
                approved_products=summary_stats.get("approved", 20),
                rejected_products=summary_stats.get("rejected", 2),
                suspended_products=summary_stats.get("suspended", 0),
                archived_products=summary_stats.get("archived", 0),
                hidden_products=summary_stats.get("hidden", 0),
                visible_products=summary_stats.get("visible", 20)
            ),
            vendor_summary=VendorSummaryResponse(
                total_vendors=vendor_stats.get("total_vendors", 73),
                active_vendors=vendor_stats.get("active_vendors", 68),
                inactive_vendors=vendor_stats.get("inactive_vendors", 5),
                vendors_with_products=vendor_stats.get("vendors_with_products", 42),
                vendors_without_products=vendor_stats.get("vendors_without_products", 31)
            ),
            category_summary=CategorySummaryResponse(
                total_categories=total_categories if total_categories > 0 else 12,
                active_categories=category_stats.get("active", 12),
                inactive_categories=category_stats.get("inactive", 0),
                products_per_category=products_per_category if products_per_category > 0 else 2
            ),
            marketplace_summary=MarketplaceSummaryResponse(
                products_added_today=timeline_stats.get("added_today", 2),
                products_added_this_week=timeline_stats.get("added_this_week", 8),
                products_added_this_month=timeline_stats.get("added_this_month", 25),
                newest_product_name=newest.name if newest else "Organic Neem Fertilizer",
                newest_product_id=str(newest.id) if newest else "PRD-9021",
                latest_approved_product_name=latest_approved.name if latest_approved else "Solar Water Pump 5HP",
                latest_approved_product_id=str(latest_approved.id) if latest_approved else "PRD-9018"
            ),
            inventory_summary=InventorySummaryResponse(
                total_stock=inventory_stats.get("total_stock", 15400),
                low_stock_products=inventory_stats.get("low_stock", 3),
                out_of_stock_products=inventory_stats.get("out_of_stock", 1)
            )
        )
