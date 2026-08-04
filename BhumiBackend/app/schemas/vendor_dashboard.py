from pydantic import BaseModel

class ProductSummary(BaseModel):
    total: int = 0
    active: int = 0
    inactive: int = 0
    pending_approval: int = 0
    approved: int = 0
    rejected: int = 0

class OrderSummary(BaseModel):
    total: int = 0
    pending: int = 0
    processing: int = 0
    packed: int = 0
    shipped: int = 0
    cancelled: int = 0

class InventorySummary(BaseModel):
    low_stock: int = 0
    out_of_stock: int = 0

class SalesSummary(BaseModel):
    total_quantity_sold: int = 0
    gross_revenue: float = 0.0
    average_order_value: float = 0.0

class VendorDashboardResponse(BaseModel):
    product_summary: ProductSummary
    order_summary: OrderSummary
    inventory_summary: InventorySummary
    sales_summary: SalesSummary
