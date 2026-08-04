from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.config.settings import settings
from app.models.product import ProductStatus
from app.schemas.product import AdminPendingProductListResponse, AdminPendingProductResponse, AdminProductStatusUpdateResponse
from app.services.admin_product import AdminProductApprovalService
from app.repositories.product import ProductRepository
from app.repositories.category import CategoryRepository
from app.services.product import ProductService
from app.dependencies.services import get_notification_service

router = APIRouter(prefix="/admin/products", tags=["Admin Product Approval"])

def get_admin_product_service() -> AdminProductApprovalService:
    product_repo = ProductRepository()
    category_repo = CategoryRepository()
    product_service = ProductService(product_repo, category_repo)
    return AdminProductApprovalService(product_repo, product_service, get_notification_service())

from app.dependencies.auth import CurrentAdmin

@router.get("", response_model=AdminPendingProductListResponse)
async def list_products(
    admin: CurrentAdmin,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by product name, SKU, or brand"),
    vendor_id: Optional[str] = Query(None, description="Filter by vendor ID"),
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    status: Optional[ProductStatus] = Query(None, description="Filter by product status; omit for all statuses"),
    service: AdminProductApprovalService = Depends(get_admin_product_service)
):
    """
    Get a paginated list of all marketplace products, optionally filtered by status.
    This is the moderation table's primary listing endpoint (all statuses, not just pending).
    """
    return await service.list_products(page, limit, search, vendor_id, category_id, status)

@router.get("/pending", response_model=AdminPendingProductListResponse)
async def get_pending_products(
    admin: CurrentAdmin,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by product name or SKU"),
    vendor_id: Optional[str] = Query(None, description="Filter by vendor ID"),
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    service: AdminProductApprovalService = Depends(get_admin_product_service)
):
    """
    Get a paginated list of all products waiting for admin approval.
    """
    return await service.get_pending_products(page, limit, search, vendor_id, category_id)

@router.get("/pending/{product_id}", response_model=AdminPendingProductResponse)
async def get_pending_product(
    product_id: str,
    admin: CurrentAdmin,
    service: AdminProductApprovalService = Depends(get_admin_product_service)
):
    """
    Get detailed information for a specific product waiting for approval.
    """
    return await service.get_pending_product(product_id)

@router.patch("/{product_id}/approve", response_model=AdminProductStatusUpdateResponse)
async def approve_product(
    product_id: str,
    admin: CurrentAdmin,
    service: AdminProductApprovalService = Depends(get_admin_product_service)
):
    """
    Approve a pending product for marketplace visibility.
    """
    return await service.approve_product(product_id, str(admin.id))

@router.patch("/{product_id}/reject", response_model=AdminProductStatusUpdateResponse)
async def reject_product(
    product_id: str,
    admin: CurrentAdmin,
    service: AdminProductApprovalService = Depends(get_admin_product_service)
):
    """
    Reject a pending product.
    """
    return await service.reject_product(product_id, str(admin.id))

@router.patch("/{product_id}/suspend", response_model=AdminProductStatusUpdateResponse)
async def suspend_product(
    product_id: str,
    admin: CurrentAdmin,
    service: AdminProductApprovalService = Depends(get_admin_product_service)
):
    """
    Suspend an already approved product.
    """
    return await service.suspend_product(product_id, str(admin.id))

@router.patch("/{product_id}/restore", response_model=AdminProductStatusUpdateResponse)
async def restore_product(
    product_id: str,
    admin: CurrentAdmin,
    service: AdminProductApprovalService = Depends(get_admin_product_service)
):
    """
    Restore a suspended product back to approved status.
    """
    return await service.restore_product(product_id, str(admin.id))
