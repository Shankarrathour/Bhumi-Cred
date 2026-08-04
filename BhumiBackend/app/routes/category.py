from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.services.category import CategoryService
from app.repositories.category import CategoryRepository
from app.dependencies.auth import CurrentAdmin

router = APIRouter(prefix="/categories", tags=["Categories"])

def get_category_service() -> CategoryService:
    repo = CategoryRepository()
    return CategoryService(repo)

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    admin: CurrentAdmin,
    service: CategoryService = Depends(get_category_service),
):
    """
    Create a new category. Protected: Admin only.
    """
    return await service.create_category(category_data)

from fastapi import APIRouter, Depends, status, Query, Request
from fastapi.security import HTTPBearer
from app.dependencies.auth import _extract_token, decode_access_token, TOKEN_TYPE_ADMIN
from app.repositories.admin_user import AdminUserRepository
from app.core.exceptions import InvalidTokenException

async def get_optional_admin(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = decode_access_token(token)
        if payload.get("type") != TOKEN_TYPE_ADMIN:
            return None
        admin_id = payload.get("sub")
        if not admin_id:
            return None
        repo = AdminUserRepository()
        admin = await repo.get_by_id(admin_id)
        if admin and admin.is_active:
            return admin
    except Exception:
        return None
    return None

@router.get("", response_model=List[CategoryResponse])
async def list_categories(
    include_inactive: bool = Query(False, description="Include inactive categories (Admin only)"),
    admin: Optional[dict] = Depends(get_optional_admin),
    service: CategoryService = Depends(get_category_service),
):
    """
    List all categories. 
    Publicly accessible for active categories. 
    Requires admin to view inactive categories.
    """
    if include_inactive and not admin:
        include_inactive = False
    return await service.get_all_categories(include_inactive=include_inactive)

@router.get("/slug/{slug}", response_model=CategoryResponse)
async def get_category_by_slug(
    slug: str,
    service: CategoryService = Depends(get_category_service),
):
    """
    Get a specific category by slug. Publicly accessible.
    """
    return await service.get_category_by_slug(slug)

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: str,
    service: CategoryService = Depends(get_category_service),
):
    """
    Get a specific category by ID. Publicly accessible.
    """
    return await service.get_category_by_id(category_id)

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    update_data: CategoryUpdate,
    admin: CurrentAdmin,
    service: CategoryService = Depends(get_category_service),
):
    """
    Update a category. Protected: Admin only.
    """
    return await service.update_category(category_id, update_data)

@router.delete("/{category_id}")
async def delete_category(
    category_id: str,
    admin: CurrentAdmin,
    service: CategoryService = Depends(get_category_service),
):
    """
    Soft delete a category. Protected: Admin only.
    """
    return await service.delete_category(category_id)
