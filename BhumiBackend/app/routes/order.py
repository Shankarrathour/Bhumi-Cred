from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.dependencies.auth import CurrentFarmer, VerifiedFarmer
from app.config.settings import settings
from app.schemas.checkout import CheckoutRequest
from app.schemas.order import OrderSummaryResponse, OrderListResponse, OrderDetailsResponse
from app.services.order import OrderService
from app.services.checkout import CheckoutService
from app.services.inventory import InventoryService
from app.repositories.order import OrderRepository
from app.repositories.cart import CartRepository
from app.repositories.product import ProductRepository
from app.repositories.category import CategoryRepository
from app.dependencies.services import get_notification_service

router = APIRouter(prefix="/orders", tags=["Orders"])

def get_order_service() -> OrderService:
    order_repo = OrderRepository()
    cart_repo = CartRepository()
    product_repo = ProductRepository()
    category_repo = CategoryRepository()
    checkout_service = CheckoutService(cart_repo, product_repo, category_repo)
    inventory_service = InventoryService(product_repo)
    return OrderService(order_repo, checkout_service, inventory_service, notification_service=get_notification_service())

@router.post("", response_model=OrderSummaryResponse)
async def create_order(
    data: CheckoutRequest,
    farmer: VerifiedFarmer,
    service: OrderService = Depends(get_order_service)
):
    """
    Create a new order from the current cart.
    Does NOT modify inventory or clear the cart in Phase 1.
    """
    return await service.create_order(str(farmer.id), data)

@router.get("", response_model=OrderListResponse)
async def get_farmer_orders(
    farmer: CurrentFarmer,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    service: OrderService = Depends(get_order_service)
):
    """
    Get paginated order history for the current farmer.
    """
    return await service.get_farmer_orders(str(farmer.id), page, limit, status)

@router.get("/{order_id}", response_model=OrderDetailsResponse)
async def get_order_details(
    order_id: str,
    farmer: CurrentFarmer,
    service: OrderService = Depends(get_order_service)
):
    """
    Get full details for a specific order using internal ID.
    """
    return await service.get_order_details(str(farmer.id), order_id)

@router.get("/number/{order_number}", response_model=OrderDetailsResponse)
async def get_order_by_number(
    order_number: str,
    farmer: CurrentFarmer,
    service: OrderService = Depends(get_order_service)
):
    """
    Get full details for a specific order using human-readable order number.
    """
    return await service.get_order_by_number(str(farmer.id), order_number)

@router.patch("/{order_id}/cancel", response_model=OrderDetailsResponse)
async def cancel_order(
    order_id: str,
    farmer: CurrentFarmer,
    service: OrderService = Depends(get_order_service)
):
    """
    Cancel a pending order and restore stock.
    """
    return await service.cancel_order(str(farmer.id), order_id)
