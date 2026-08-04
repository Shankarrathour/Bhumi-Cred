from typing import Dict, Any
from fastapi import status
from app.core.exceptions import AppException
from app.repositories.wishlist import WishlistRepository
from app.repositories.product import ProductRepository
from app.repositories.category import CategoryRepository
from app.schemas.wishlist import WishlistCreate, WishlistResponse, WishlistItemResponse, WishlistToggleRequest
from app.schemas.product import ProductCardResponse, ProductCategoryResponse
from app.models.product import ProductStatus

class WishlistService:
    def __init__(self, wishlist_repo: WishlistRepository, product_repo: ProductRepository, category_repo: CategoryRepository):
        self.wishlist_repo = wishlist_repo
        self.product_repo = product_repo
        self.category_repo = category_repo

    async def add_to_wishlist(self, farmer_id: str, data: WishlistCreate) -> Dict[str, str]:
        product = await self.product_repo.get_by_id(str(data.product_id))
        
        if not product:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                error_code="PRODUCT_NOT_FOUND",
                detail="Product not found."
            )
            
        if not product.is_active or product.status != ProductStatus.APPROVED:
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code="PRODUCT_UNAVAILABLE",
                detail="Product is not available for wishlist."
            )

        existing_item = await self.wishlist_repo.get_by_farmer_and_product(farmer_id, str(data.product_id))
        if existing_item:
            raise AppException(
                status_code=status.HTTP_409_CONFLICT,
                error_code="ALREADY_IN_WISHLIST",
                detail="Product already exists in wishlist."
            )

        await self.wishlist_repo.create(farmer_id, str(data.product_id))
        return {"message": "Product added to wishlist successfully."}

    async def remove_from_wishlist(self, farmer_id: str, product_id: str) -> Dict[str, str]:
        existing_item = await self.wishlist_repo.get_by_farmer_and_product(farmer_id, product_id)
        if not existing_item:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                error_code="WISHLIST_ITEM_NOT_FOUND",
                detail="Product not found in wishlist."
            )

        await self.wishlist_repo.delete(existing_item)
        return {"message": "Product removed from wishlist successfully."}

    async def get_wishlist(self, farmer_id: str) -> WishlistResponse:
        wishlist_items = await self.wishlist_repo.get_by_farmer(farmer_id)
        if not wishlist_items:
            return WishlistResponse(items=[], total_items=0)

        total_items = await self.wishlist_repo.count(farmer_id)

        # Get all related products
        product_ids = [str(item.product_id) for item in wishlist_items]
        
        # We need a method in ProductRepository to fetch multiple products by ID
        # Since I cannot modify Products CRUD heavily, I'll fetch them individually or I can add a get_by_ids to ProductRepository.
        # Wait, I am allowed to modify required files. Let's just fetch them individually since wishlist is usually small, 
        # or I can add get_by_ids to ProductRepository. To be safe, I'll add a helper method in ProductRepository or use Beanie find directly here.
        # Using Beanie directly here to avoid touching ProductRepository again, since the user was very strict about it.
        from app.models.product import Product
        from beanie import PydanticObjectId
        
        object_ids = [PydanticObjectId(pid) for pid in product_ids]
        products = await Product.find({"_id": {"$in": object_ids}}).to_list()
        
        product_map = {str(p.id): p for p in products}
        
        # Get all related categories
        category_ids = list({str(p.category_id) for p in products})
        categories = await self.category_repo.get_by_ids(category_ids)
        category_map = {str(c.id): c for c in categories}
        
        response_items = []
        for item in wishlist_items:
            product = product_map.get(str(item.product_id))
            if not product:
                continue
                
            c = category_map.get(str(product.category_id))
            if c:
                category_data = ProductCategoryResponse(id=str(c.id), name=c.name, slug=c.slug)
            else:
                category_data = ProductCategoryResponse(id=str(product.category_id), name="Unknown Category", slug="unknown")
                
            product_dict = product.model_dump()
            product_dict["id"] = str(product.id)
            product_dict["category"] = category_data
            
            product_response = ProductCardResponse.model_validate(product_dict)
            
            response_items.append(
                WishlistItemResponse(
                    id=str(item.id),
                    created_at=item.created_at,
                    product=product_response
                )
            )

        return WishlistResponse(items=response_items, total_items=total_items)

    async def check_wishlist_status(self, farmer_id: str, product_id: str) -> Dict[str, bool]:
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                error_code="PRODUCT_NOT_FOUND",
                detail="Product not found."
            )
        existing_item = await self.wishlist_repo.get_by_farmer_and_product(farmer_id, product_id)
        return {"wishlisted": bool(existing_item)}

    async def get_wishlist_count(self, farmer_id: str) -> Dict[str, int]:
        count = await self.wishlist_repo.count(farmer_id)
        return {"count": count}

    async def toggle_wishlist(self, farmer_id: str, data: WishlistToggleRequest) -> Dict[str, Any]:
        product_id_str = str(data.product_id)
        
        # Check if it exists
        existing_item = await self.wishlist_repo.get_by_farmer_and_product(farmer_id, product_id_str)
        if existing_item:
            await self.remove_from_wishlist(farmer_id, product_id_str)
            return {"wishlisted": False, "message": "Product removed from wishlist."}
        else:
            await self.add_to_wishlist(farmer_id, WishlistCreate(product_id=product_id_str))
            return {"wishlisted": True, "message": "Product added to wishlist."}
