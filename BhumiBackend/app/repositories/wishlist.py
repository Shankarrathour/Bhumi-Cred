from typing import List, Optional
from beanie import PydanticObjectId
from pymongo import DESCENDING
from app.models.wishlist import Wishlist

class WishlistRepository:
    async def create(self, farmer_id: str, product_id: str) -> Wishlist:
        wishlist_item = Wishlist(
            farmer_id=PydanticObjectId(farmer_id),
            product_id=PydanticObjectId(product_id)
        )
        await wishlist_item.insert()
        return wishlist_item

    async def get_by_farmer(self, farmer_id: str) -> List[Wishlist]:
        return await Wishlist.find(
            Wishlist.farmer_id == PydanticObjectId(farmer_id)
        ).sort([("created_at", DESCENDING)]).to_list()

    async def get_by_farmer_and_product(self, farmer_id: str, product_id: str) -> Optional[Wishlist]:
        return await Wishlist.find_one(
            Wishlist.farmer_id == PydanticObjectId(farmer_id),
            Wishlist.product_id == PydanticObjectId(product_id)
        )

    async def delete(self, wishlist_item: Wishlist) -> None:
        await wishlist_item.delete()

    async def count(self, farmer_id: str) -> int:
        return await Wishlist.find(
            Wishlist.farmer_id == PydanticObjectId(farmer_id)
        ).count()
