from app.repositories.product import ProductRepository
from app.repositories.order import OrderRepository
from app.schemas.vendor_dashboard import (
    VendorDashboardResponse, ProductSummary, OrderSummary, InventorySummary, SalesSummary
)
from app.core.enums import OrderStatus

class VendorDashboardService:
    def __init__(self, product_repo: ProductRepository, order_repo: OrderRepository):
        self.product_repo = product_repo
        self.order_repo = order_repo

    async def get_dashboard_stats(self, vendor_id: str) -> VendorDashboardResponse:
        product_data = await self.product_repo.get_vendor_product_stats(vendor_id)
        order_data = await self.order_repo.get_vendor_order_stats(vendor_id)
        
        p_summary = product_data.get("summary", {})
        p_inventory = product_data.get("inventory", {})
        
        product_summary = ProductSummary(
            total=p_summary.get("total", 0),
            active=p_summary.get("active", 0),
            inactive=p_summary.get("inactive", 0),
            pending_approval=p_summary.get("pending", 0),
            approved=p_summary.get("approved", 0),
            rejected=p_summary.get("rejected", 0)
        )
        
        inventory_summary = InventorySummary(
            low_stock=p_inventory.get("low_stock", 0),
            out_of_stock=p_inventory.get("out_of_stock", 0)
        )
        
        orders_status = order_data.get("orders_status", [])
        sales = order_data.get("sales", [])
        
        status_map = {item["_id"]: item["count"] for item in orders_status}
        
        order_summary = OrderSummary(
            total=sum(status_map.values()),
            pending=status_map.get(OrderStatus.PENDING, 0),
            processing=status_map.get(OrderStatus.PROCESSING, 0),
            packed=status_map.get(OrderStatus.PACKED, 0),
            shipped=status_map.get(OrderStatus.SHIPPED, 0),
            cancelled=status_map.get(OrderStatus.CANCELLED, 0)
        )
        
        sales_summary_data = sales[0] if sales else {}
        total_orders = sales_summary_data.get("total_orders", 0)
        gross_revenue = sales_summary_data.get("gross_revenue", 0.0)
        avg_value = gross_revenue / total_orders if total_orders > 0 else 0.0
        
        sales_summary = SalesSummary(
            total_quantity_sold=sales_summary_data.get("total_quantity_sold", 0),
            gross_revenue=gross_revenue,
            average_order_value=avg_value
        )
        
        return VendorDashboardResponse(
            product_summary=product_summary,
            order_summary=order_summary,
            inventory_summary=inventory_summary,
            sales_summary=sales_summary
        )
