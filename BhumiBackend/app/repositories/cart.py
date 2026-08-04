from typing import List, Optional
from datetime import datetime, timezone
from beanie import PydanticObjectId
from pymongo import DESCENDING
from app.models.cart import CartItem

class CartRepository:
    async def create(self, farmer_id: str, product_id: str, quantity: int) -> CartItem:
        cart_item = CartItem(
            farmer_id=PydanticObjectId(farmer_id),
            product_id=PydanticObjectId(product_id),
            quantity=quantity
        )
        await cart_item.insert()
        return cart_item

    async def get_by_farmer(self, farmer_id: str) -> List[CartItem]:
        return await CartItem.find(
            CartItem.farmer_id == PydanticObjectId(farmer_id)
        ).sort([("created_at", DESCENDING)]).to_list()

    async def get_by_farmer_and_product(self, farmer_id: str, product_id: str) -> Optional[CartItem]:
        return await CartItem.find_one(
            CartItem.farmer_id == PydanticObjectId(farmer_id),
            CartItem.product_id == PydanticObjectId(product_id)
        )

    async def update_quantity(self, cart_item: CartItem, quantity: int) -> CartItem:
        await cart_item.set({
            "quantity": quantity,
            "updated_at": datetime.now(timezone.utc)
        })
        return cart_item

    async def delete(self, cart_item: CartItem) -> None:
        await cart_item.delete()

    async def count(self, farmer_id: str) -> int:
        return await CartItem.find(
            CartItem.farmer_id == PydanticObjectId(farmer_id)
        ).count()

    async def clear_cart(self, farmer_id: str) -> None:
        await CartItem.find(
            CartItem.farmer_id == PydanticObjectId(farmer_id)
        ).delete()

    async def count_items(self, farmer_id: str) -> int:
        pipeline = [
            {"$match": {"farmer_id": PydanticObjectId(farmer_id)}},
            {"$group": {"_id": None, "total": {"$sum": "$quantity"}}}
        ]
        result = await CartItem.aggregate(pipeline).to_list()
        if result and len(result) > 0:
            return result[0]["total"]
        return 0
