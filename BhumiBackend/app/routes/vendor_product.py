from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from typing import Optional
from app.config.settings import settings
from app.schemas.product import ProductCreate, VendorProductUpdate, VendorStockUpdate, VendorProductResponse, VendorProductListResponse
from app.services.product import VendorProductService
from app.dependencies.services import get_vendor_product_service

router = APIRouter(prefix="/vendor/products", tags=["Vendor Products"])

from app.dependencies.auth import CurrentVendor, VerifiedVendor

@router.post("", response_model=VendorProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    vendor: VerifiedVendor,
    service: VendorProductService = Depends(get_vendor_product_service)
):
    """
    Create a new product owned by the current vendor.
    """
    return await service.create_product(str(vendor.id), data)

@router.get("", response_model=VendorProductListResponse)
async def get_vendor_products(
    vendor: CurrentVendor,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search query"),
    service: VendorProductService = Depends(get_vendor_product_service)
):
    """
    List all products owned by the current vendor.
    """
    return await service.get_vendor_products(str(vendor.id), page, limit, search, status)

@router.get("/{product_id}", response_model=VendorProductResponse)
async def get_vendor_product(
    product_id: str,
    vendor: CurrentVendor,
    service: VendorProductService = Depends(get_vendor_product_service)
):
    """
    Get a specific product owned by the current vendor.
    """
    return await service.get_vendor_product(str(vendor.id), product_id)

@router.put("/{product_id}", response_model=VendorProductResponse)
async def update_vendor_product(
    product_id: str,
    data: VendorProductUpdate,
    vendor: VerifiedVendor,
    service: VendorProductService = Depends(get_vendor_product_service)
):
    """
    Update a specific product owned by the current vendor.
    """
    return await service.update_vendor_product(str(vendor.id), product_id, data)

@router.patch("/{product_id}/stock", response_model=VendorProductResponse)
async def update_vendor_product_stock(
    product_id: str,
    data: VendorStockUpdate,
    vendor: VerifiedVendor,
    service: VendorProductService = Depends(get_vendor_product_service)
):
    """
    Update stock directly for a specific product owned by the current vendor.
    """
    return await service.update_stock(str(vendor.id), product_id, data.stock_quantity)

@router.post("/{product_id}/images", response_model=VendorProductResponse)
async def upload_vendor_product_image(
    product_id: str,
    vendor: VerifiedVendor,
    file: UploadFile = File(...),
    service: VendorProductService = Depends(get_vendor_product_service)
):
    """
    Upload one image and append it to a product owned by the current vendor.
    The first image uploaded becomes the product's primary_image/thumbnail.
    Call once per image to upload multiple.
    """
    return await service.upload_product_image(str(vendor.id), product_id, file)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vendor_product(
    product_id: str,
    vendor: VerifiedVendor,
    service: VendorProductService = Depends(get_vendor_product_service)
):
    """
    Soft-delete a specific product owned by the current vendor.
    """
    await service.delete_vendor_product(str(vendor.id), product_id)
