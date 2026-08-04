from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, status, Query
from app.schemas.product import (
    ProductCreate, ProductResponse, ProductListResponse, ProductUpdate,
    ProductCardResponse, ProductSort
)
from app.config.settings import settings
from app.services.product import ProductService
from app.repositories.product import ProductRepository
from app.repositories.category import CategoryRepository
from app.dependencies.auth import CurrentAdmin
from app.schemas.common import SuccessResponse

router = APIRouter(prefix="/products", tags=["Products"])

def get_product_service() -> ProductService:
    product_repo = ProductRepository()
    category_repo = CategoryRepository()
    return ProductService(product_repo, category_repo)

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    admin: CurrentAdmin,
    service: ProductService = Depends(get_product_service),
):
    """
    Create a new product. Protected: Admin only.
    """
    return await service.create_product(product_data)

@router.get("", response_model=ProductListResponse)
async def list_products(
    skip: int = Query(0, ge=0, description="Items to skip"),
    limit: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name, brand, or keywords"),
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    category_slug: Optional[str] = Query(None, description="Filter by category slug"),
    featured: Optional[bool] = Query(None, description="Filter by featured status"),
    sort: ProductSort = Query(ProductSort.NEWEST, description="Sort order"),
    service: ProductService = Depends(get_product_service),
):
    """
    List active products with pagination, filtering, and sorting. Publicly accessible.
    """
    return await service.get_all_products(
        page=(skip // limit) + 1,
        limit=limit,
        search=search,
        category_id=category_id,
        category_slug=category_slug,
        featured=featured,
        sort=sort
    )

@router.get("/slug/{slug}", response_model=ProductResponse)
async def get_product_by_slug(
    slug: str,
    service: ProductService = Depends(get_product_service),
):
    """
    Get a specific product by slug. Publicly accessible.
    """
    return await service.get_product_by_slug(slug)

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    service: ProductService = Depends(get_product_service),
):
    """
    Get a specific product by ID. Publicly accessible.
    """
    return await service.get_product_by_id(product_id)

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    update_data: ProductUpdate,
    admin: CurrentAdmin,
    service: ProductService = Depends(get_product_service),
):
    """
    Update a product. Protected: Admin only.
    """
    return await service.update_product(product_id, update_data)

@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    admin: CurrentAdmin,
    service: ProductService = Depends(get_product_service),
):
    """
    Soft delete a product. Protected: Admin only.
    """
    return await service.delete_product(product_id)
