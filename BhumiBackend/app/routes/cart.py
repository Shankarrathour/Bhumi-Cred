from fastapi import APIRouter, Depends
from app.dependencies.auth import CurrentFarmer
from app.schemas.cart import (
    CartCreate, CartUpdate, CartResponse, 
    CartCountResponse, CartSummaryResponse
)
from app.services.cart import CartService
from app.repositories.cart import CartRepository
from app.repositories.product import ProductRepository
from app.repositories.category import CategoryRepository
from typing import Dict

router = APIRouter(prefix="/cart", tags=["Cart"])

def get_cart_service() -> CartService:
    cart_repo = CartRepository()
    product_repo = ProductRepository()
    category_repo = CategoryRepository()
    return CartService(cart_repo, product_repo, category_repo)

@router.post("", response_model=Dict[str, str])
async def add_to_cart(
    data: CartCreate,
    farmer: CurrentFarmer,
    service: CartService = Depends(get_cart_service)
):
    """
    Add a product to the authenticated farmer's shopping cart.
    """
    return await service.add_to_cart(str(farmer.id), data)

@router.get("", response_model=CartResponse)
async def get_cart(
    farmer: CurrentFarmer,
    service: CartService = Depends(get_cart_service)
):
    """
    Get the authenticated farmer's shopping cart.
    """
    return await service.get_cart(str(farmer.id))

@router.patch("/{product_id}", response_model=Dict[str, str])
async def update_cart_quantity(
    product_id: str,
    data: CartUpdate,
    farmer: CurrentFarmer,
    service: CartService = Depends(get_cart_service)
):
    """
    Update the quantity of a product in the authenticated farmer's shopping cart.
    """
    return await service.update_cart_quantity(str(farmer.id), product_id, data)

@router.delete("/{product_id}", response_model=Dict[str, str])
async def remove_from_cart(
    product_id: str,
    farmer: CurrentFarmer,
    service: CartService = Depends(get_cart_service)
):
    """
    Remove a product from the authenticated farmer's shopping cart.
    """
    return await service.remove_from_cart(str(farmer.id), product_id)

@router.get("/count", response_model=CartCountResponse)
async def get_cart_count(
    farmer: CurrentFarmer,
    service: CartService = Depends(get_cart_service)
):
    """
    Get the total quantity of products in the authenticated farmer's shopping cart.
    """
    return await service.get_cart_count(str(farmer.id))

@router.get("/summary", response_model=CartSummaryResponse)
async def get_cart_summary(
    farmer: CurrentFarmer,
    service: CartService = Depends(get_cart_service)
):
    """
    Get only the pricing summary for the authenticated farmer's shopping cart.
    """
    return await service.get_cart_summary(str(farmer.id))

@router.post("/clear", response_model=Dict[str, str])
async def clear_cart(
    farmer: CurrentFarmer,
    service: CartService = Depends(get_cart_service)
):
    """
    Clear all items from the authenticated farmer's shopping cart.
    """
    return await service.clear_cart(str(farmer.id))
