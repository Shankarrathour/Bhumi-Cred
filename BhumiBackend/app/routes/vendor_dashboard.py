from fastapi import APIRouter, Depends
from app.schemas.vendor_dashboard import VendorDashboardResponse
from app.services.vendor_dashboard import VendorDashboardService
from app.repositories.product import ProductRepository
from app.repositories.order import OrderRepository

router = APIRouter(prefix="/vendor/dashboard", tags=["Vendor Dashboard"])

def get_vendor_dashboard_service() -> VendorDashboardService:
    return VendorDashboardService(ProductRepository(), OrderRepository())

from app.dependencies.auth import VerifiedVendor

@router.get("", response_model=VendorDashboardResponse)
async def get_vendor_dashboard(
    vendor: VerifiedVendor,
    service: VendorDashboardService = Depends(get_vendor_dashboard_service)
):
    """
    Get aggregated dashboard statistics for the current vendor.
    """
    return await service.get_dashboard_stats(str(vendor.id))
