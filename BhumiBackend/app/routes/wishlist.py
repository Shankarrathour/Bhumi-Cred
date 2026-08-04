from fastapi import APIRouter, Depends
from app.dependencies.auth import CurrentFarmer
from app.schemas.wishlist import (
    WishlistCreate, WishlistResponse, WishlistStatusResponse, 
    WishlistCountResponse, WishlistToggleRequest, WishlistToggleResponse
)
from app.services.wishlist import WishlistService
from app.repositories.wishlist import WishlistRepository
from app.repositories.product import ProductRepository
from app.repositories.category import CategoryRepository
from typing import Dict

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])

def get_wishlist_service() -> WishlistService:
    wishlist_repo = WishlistRepository()
    product_repo = ProductRepository()
    category_repo = CategoryRepository()
    return WishlistService(wishlist_repo, product_repo, category_repo)

@router.post("", response_model=Dict[str, str])
async def add_to_wishlist(
    data: WishlistCreate,
    farmer: CurrentFarmer,
    service: WishlistService = Depends(get_wishlist_service)
):
    """
    Add a product to the authenticated farmer's wishlist.
    """
    return await service.add_to_wishlist(str(farmer.id), data)

@router.get("", response_model=WishlistResponse)
async def get_wishlist(
    farmer: CurrentFarmer,
    service: WishlistService = Depends(get_wishlist_service)
):
    """
    Get the authenticated farmer's wishlist.
    """
    return await service.get_wishlist(str(farmer.id))

@router.delete("/{product_id}", response_model=Dict[str, str])
async def remove_from_wishlist(
    product_id: str,
    farmer: CurrentFarmer,
    service: WishlistService = Depends(get_wishlist_service)
):
    """
    Remove a product from the authenticated farmer's wishlist.
    """
    return await service.remove_from_wishlist(str(farmer.id), product_id)

@router.get("/check/{product_id}", response_model=WishlistStatusResponse)
async def check_wishlist_status(
    product_id: str,
    farmer: CurrentFarmer,
    service: WishlistService = Depends(get_wishlist_service)
):
    """
    Check whether the logged-in farmer has already wishlisted the given product.
    """
    return await service.check_wishlist_status(str(farmer.id), product_id)

@router.get("/count", response_model=WishlistCountResponse)
async def get_wishlist_count(
    farmer: CurrentFarmer,
    service: WishlistService = Depends(get_wishlist_service)
):
    """
    Get the total number of items in the authenticated farmer's wishlist.
    """
    return await service.get_wishlist_count(str(farmer.id))

@router.post("/toggle", response_model=WishlistToggleResponse)
async def toggle_wishlist(
    data: WishlistToggleRequest,
    farmer: CurrentFarmer,
    service: WishlistService = Depends(get_wishlist_service)
):
    """
    Toggle a product in the authenticated farmer's wishlist.
    """
    return await service.toggle_wishlist(str(farmer.id), data)
