from typing import Dict, Any, Tuple
from fastapi import status
from app.core.exceptions import AppException
from app.repositories.cart import CartRepository
from app.repositories.product import ProductRepository
from app.repositories.category import CategoryRepository
from app.schemas.cart import CartCreate, CartUpdate, CartResponse, CartItemResponse, CartCountResponse, CartSummaryResponse
from app.schemas.product import ProductCardResponse, ProductCategoryResponse
from app.models.product import ProductStatus

class CartService:
    def __init__(self, cart_repo: CartRepository, product_repo: ProductRepository, category_repo: CategoryRepository):
        self.cart_repo = cart_repo
        self.product_repo = product_repo
        self.category_repo = category_repo

    async def add_to_cart(self, farmer_id: str, data: CartCreate) -> Dict[str, str]:
        product = await self.product_repo.get_by_id(str(data.product_id))
        
        if not product:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                error_code="PRODUCT_NOT_FOUND",
                detail="Product not found."
            )
            
        if not product.is_active or product.status != ProductStatus.APPROVED:
            raise AppException(
                status_code=status.HTTP_409_CONFLICT,
                error_code="PRODUCT_UNAVAILABLE",
                detail="Product is inactive or unavailable."
            )

        if data.quantity < 1:
            raise AppException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                error_code="INVALID_QUANTITY",
                detail="Quantity must be at least 1."
            )

        if data.quantity > product.stock_quantity:
            raise AppException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                error_code="INVALID_QUANTITY",
                detail=f"Only {product.stock_quantity} items are currently available in stock."
            )

        existing_item = await self.cart_repo.get_by_farmer_and_product(farmer_id, str(data.product_id))
        if existing_item:
            new_quantity = existing_item.quantity + data.quantity
            if new_quantity > product.stock_quantity:
                raise AppException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    error_code="INVALID_QUANTITY",
                    detail=f"Only {product.stock_quantity} items are currently available in stock."
                )
            await self.cart_repo.update_quantity(existing_item, new_quantity)
            return {"message": "Product quantity increased in cart successfully."}
        else:
            await self.cart_repo.create(farmer_id, str(data.product_id), data.quantity)
            return {"message": "Product added to cart successfully."}

    async def update_cart_quantity(self, farmer_id: str, product_id: str, data: CartUpdate) -> Dict[str, str]:
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                error_code="PRODUCT_NOT_FOUND",
                detail="Product not found."
            )

        if data.quantity < 1:
            raise AppException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                error_code="INVALID_QUANTITY",
                detail="Quantity must be at least 1."
            )
            
        if data.quantity > product.stock_quantity:
            raise AppException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                error_code="INVALID_QUANTITY",
                detail=f"Only {product.stock_quantity} items are currently available in stock."
            )

        existing_item = await self.cart_repo.get_by_farmer_and_product(farmer_id, product_id)
        if not existing_item:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                error_code="CART_ITEM_NOT_FOUND",
                detail="Product not found in cart."
            )

        await self.cart_repo.update_quantity(existing_item, data.quantity)
        return {"message": "Cart item quantity updated successfully."}

    async def remove_from_cart(self, farmer_id: str, product_id: str) -> Dict[str, str]:
        existing_item = await self.cart_repo.get_by_farmer_and_product(farmer_id, product_id)
        if not existing_item:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                error_code="CART_ITEM_NOT_FOUND",
                detail="Product not found in cart."
            )

        await self.cart_repo.delete(existing_item)
        return {"message": "Product removed from cart successfully."}

    async def clear_cart(self, farmer_id: str) -> Dict[str, str]:
        await self.cart_repo.clear_cart(farmer_id)
        return {"message": "Cart cleared successfully."}

    async def get_cart_count(self, farmer_id: str) -> CartCountResponse:
        count = await self.cart_repo.count_items(farmer_id)
        return CartCountResponse(count=count)

    async def _calculate_pricing(self, cart_items) -> Tuple[int, float, float, float, Dict[str, Any]]:
        if not cart_items:
            return 0, 0.0, 0.0, 0.0, {}

        product_ids = [str(item.product_id) for item in cart_items]
        from app.models.product import Product
        from beanie import PydanticObjectId
        
        object_ids = [PydanticObjectId(pid) for pid in product_ids]
        products = await Product.find({"_id": {"$in": object_ids}}).to_list()
        product_map = {str(p.id): p for p in products}

        from app.services.pricing import PricingService

        pricing_items = []
        for item in cart_items:
            product = product_map.get(str(item.product_id))
            if not product:
                continue
                
            pricing_items.append({
                "price": product.price,
                "original_price": product.original_price,
                "quantity": item.quantity
            })

        summary = PricingService.calculate_pricing_summary(pricing_items)
        return summary["total_items"], summary["subtotal"], summary["discount"], summary["grand_total"], product_map

    async def get_cart_summary(self, farmer_id: str) -> CartSummaryResponse:
        cart_items = await self.cart_repo.get_by_farmer(farmer_id)
        total_items, subtotal, discount, grand_total, _ = await self._calculate_pricing(cart_items)
        
        return CartSummaryResponse(
            total_items=total_items,
            subtotal=subtotal,
            discount=discount,
            grand_total=grand_total
        )

    async def get_cart(self, farmer_id: str) -> CartResponse:
        cart_items = await self.cart_repo.get_by_farmer(farmer_id)
        if not cart_items:
            return CartResponse(items=[], total_items=0, subtotal=0.0, discount=0.0, grand_total=0.0)

        total_items, overall_subtotal, overall_discount, grand_total, product_map = await self._calculate_pricing(cart_items)
        
        # Batch load categories
        category_ids = list({str(p.category_id) for p in product_map.values()})
        categories = await self.category_repo.get_by_ids(category_ids)
        category_map = {str(c.id): c for c in categories}
        
        response_items = []
        for item in cart_items:
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
            from app.services.pricing import PricingService
            item_subtotal = PricingService.calculate_item_subtotal(product.price, item.quantity)
            
            response_items.append(
                CartItemResponse(
                    id=str(item.id),
                    quantity=item.quantity,
                    subtotal=item_subtotal,
                    product=product_response
                )
            )

        return CartResponse(
            items=response_items,
            total_items=total_items,
            subtotal=overall_subtotal,
            discount=overall_discount,
            grand_total=grand_total
        )
