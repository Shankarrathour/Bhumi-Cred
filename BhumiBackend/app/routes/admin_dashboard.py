from fastapi import APIRouter, Depends
from app.schemas.admin_dashboard import AdminMarketplaceDashboardResponse
from app.services.admin_dashboard import AdminMarketplaceDashboardService
from app.repositories.product import ProductRepository
from app.repositories.category import CategoryRepository
from app.repositories.farmer import FarmerRepository

router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])

def get_admin_dashboard_service() -> AdminMarketplaceDashboardService:
    return AdminMarketplaceDashboardService(
        product_repo=ProductRepository(),
        category_repo=CategoryRepository(),
        farmer_repo=FarmerRepository()
    )

from app.dependencies.auth import CurrentAdmin

@router.get("", response_model=AdminMarketplaceDashboardResponse)
async def get_dashboard_summary(
    admin: CurrentAdmin,
    service: AdminMarketplaceDashboardService = Depends(get_admin_dashboard_service)
):
    """
    Get the centralized marketplace dashboard summary.
    """
    return await service.get_dashboard_summary()
