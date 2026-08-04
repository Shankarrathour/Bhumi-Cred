from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.config.settings import settings
from app.schemas.order import VendorOrderResponse, VendorOrderListResponse
from app.services.vendor_order import VendorOrderService
from app.repositories.order import OrderRepository

router = APIRouter(prefix="/vendor/orders", tags=["Vendor Orders"])

def get_vendor_order_service() -> VendorOrderService:
    order_repo = OrderRepository()
    return VendorOrderService(order_repo)

from app.dependencies.auth import CurrentVendor, VerifiedVendor

@router.get("", response_model=VendorOrderListResponse)
async def get_vendor_orders(
    vendor: CurrentVendor,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by order number"),
    service: VendorOrderService = Depends(get_vendor_order_service)
):
    """
    List all orders containing items owned by the current vendor.
    """
    return await service.get_vendor_orders(str(vendor.id), page, limit, status, search)

@router.get("/{order_id}", response_model=VendorOrderResponse)
async def get_vendor_order(
    order_id: str,
    vendor: CurrentVendor,
    service: VendorOrderService = Depends(get_vendor_order_service)
):
    """
    Get specific order details containing ONLY items owned by the current vendor.
    """
    return await service.get_vendor_order_details(str(vendor.id), order_id)

@router.patch("/{order_id}/confirm", response_model=VendorOrderResponse)
async def confirm_vendor_order(
    order_id: str,
    vendor: VerifiedVendor,
    service: VendorOrderService = Depends(get_vendor_order_service)
):
    """
    Confirm an order that contains items owned by the current vendor.
    """
    return await service.confirm_order(str(vendor.id), order_id)

@router.patch("/{order_id}/processing", response_model=VendorOrderResponse)
async def start_processing_vendor_order(
    order_id: str,
    vendor: VerifiedVendor,
    service: VendorOrderService = Depends(get_vendor_order_service)
):
    """
    Start processing an order that contains items owned by the current vendor.
    """
    return await service.start_processing(str(vendor.id), order_id)

@router.patch("/{order_id}/pack", response_model=VendorOrderResponse)
async def pack_vendor_order(
    order_id: str,
    vendor: VerifiedVendor,
    service: VendorOrderService = Depends(get_vendor_order_service)
):
    """
    Pack an order that contains items owned by the current vendor.
    """
    return await service.pack_order(str(vendor.id), order_id)

@router.patch("/{order_id}/ship", response_model=VendorOrderResponse)
async def ship_vendor_order(
    order_id: str,
    vendor: VerifiedVendor,
    service: VendorOrderService = Depends(get_vendor_order_service)
):
    """
    Ship an order that contains items owned by the current vendor.
    """
    return await service.ship_order(str(vendor.id), order_id)
