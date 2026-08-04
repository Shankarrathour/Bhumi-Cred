from fastapi import status
from app.core.exceptions import AppException
from app.repositories.cart import CartRepository
from app.repositories.product import ProductRepository
from app.repositories.category import CategoryRepository
from app.schemas.checkout import CheckoutRequest, CheckoutSummaryResponse, CheckoutItemResponse
from app.schemas.product import ProductCardResponse, ProductCategoryResponse
from app.models.product import ProductStatus
from app.config.settings import settings

class CheckoutService:
    def __init__(self, cart_repo: CartRepository, product_repo: ProductRepository, category_repo: CategoryRepository):
        self.cart_repo = cart_repo
        self.product_repo = product_repo
        self.category_repo = category_repo

    async def _prepare_checkout(self, farmer_id: str, request_data: CheckoutRequest):
        cart_items = await self.cart_repo.get_by_farmer(farmer_id)
        if not cart_items:
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code="CART_EMPTY",
                detail="Cart is empty."
            )

        product_ids = [str(item.product_id) for item in cart_items]
        from app.models.product import Product
        from beanie import PydanticObjectId
        
        object_ids = [PydanticObjectId(pid) for pid in product_ids]
        products = await Product.find({"_id": {"$in": object_ids}}).to_list()
        product_map = {str(p.id): p for p in products}

        category_ids = list({str(p.category_id) for p in products})
        categories = await self.category_repo.get_by_ids(category_ids)
        category_map = {str(c.id): c for c in categories}

        pricing_items = []
        response_items = []

        for item in cart_items:
            product = product_map.get(str(item.product_id))
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
                    detail=f"Product {product.name} is no longer available."
                )

            if item.quantity > product.stock_quantity:
                raise AppException(
                    status_code=status.HTTP_409_CONFLICT,
                    error_code="STOCK_UNAVAILABLE",
                    detail=f"Only {product.stock_quantity} items are available for {product.name}."
                )
                
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
            pricing_items.append({
                "price": product.price,
                "original_price": product.original_price,
                "quantity": item.quantity
            })
            
            item_subtotal = PricingService.calculate_item_subtotal(product.price, item.quantity)
            
            response_items.append(
                CheckoutItemResponse(
                    quantity=item.quantity,
                    subtotal=item_subtotal,
                    product=product_response
                )
            )

        summary = PricingService.calculate_pricing_summary(pricing_items)

        response = CheckoutSummaryResponse(
            items=response_items,
            total_items=summary["total_items"],
            subtotal=summary["subtotal"],
            discount=summary["discount"],
            grand_total=summary["grand_total"],
            delivery_charge=summary["delivery_charge"],
            final_total=summary["final_total"],
            delivery_address=request_data.delivery_address,
            stock_valid=True
        )
        return response, product_map

    async def prepare_checkout(self, farmer_id: str, request_data: CheckoutRequest) -> CheckoutSummaryResponse:
        response, _ = await self._prepare_checkout(farmer_id, request_data)
        return response
