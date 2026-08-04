from typing import Optional
from app.repositories.product import ProductRepository
from app.models.product import Product

class InventoryService:
    def __init__(self, product_repo: ProductRepository):
        self.product_repo = product_repo

    async def validate_stock(self, product_id: str, quantity: int) -> bool:
        """
        Validates if sufficient stock exists without modifying it.
        """
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            return False
        return product.stock_quantity >= quantity

    async def decrease_stock(self, product_id: str, quantity: int, product: Optional[Product] = None) -> Product:
        """
        Decreases stock quantity. Raises ValueError if insufficient stock.
        """
        return await self.product_repo.decrease_stock(product_id, quantity, product)

    async def increase_stock(self, product_id: str, quantity: int, product: Optional[Product] = None) -> Product:
        """
        Increases stock quantity.
        """
        return await self.product_repo.increase_stock(product_id, quantity, product)

    # TODO: Implement reserve_stock() for Future cart/checkout holds
    # async def reserve_stock(self, product_id: str, quantity: int) -> bool:
    #     pass

    # TODO: Implement release_stock() for expiring reserved holds
    # async def release_stock(self, product_id: str, quantity: int) -> bool:
    #     pass
