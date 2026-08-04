from typing import List, Optional
from beanie import PydanticObjectId
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from datetime import datetime, timezone

class CategoryRepository:
    async def create(self, category_data: CategoryCreate, slug: str) -> Category:
        category = Category(
            **category_data.model_dump(),
            slug=slug,
        )
        await category.insert()
        return category

    async def get_by_id(self, category_id: str) -> Optional[Category]:
        try:
            return await Category.get(PydanticObjectId(category_id))
        except Exception:
            return None

    async def get_by_ids(self, category_ids: List[str]) -> List[Category]:
        try:
            object_ids = [PydanticObjectId(cid) for cid in category_ids]
            return await Category.find({"_id": {"$in": object_ids}}).to_list()
        except Exception:
            return []

    async def get_by_name(self, name: str) -> Optional[Category]:
        return await Category.find_one(Category.name == name)

    async def get_by_slug(self, slug: str) -> Optional[Category]:
        return await Category.find_one(Category.slug == slug)

    async def get_all(self, include_inactive: bool = False) -> List[Category]:
        query = {} if include_inactive else {"is_active": True}
        return await Category.find(query).sort("display_order").to_list()

    async def update(self, category: Category, update_data: CategoryUpdate, new_slug: Optional[str] = None) -> Category:
        update_dict = update_data.model_dump(exclude_unset=True)
        if new_slug:
            update_dict["slug"] = new_slug
            
        if update_dict:
            update_dict["updated_at"] = datetime.now(timezone.utc)
            await category.set(update_dict)
        return category

    async def delete(self, category: Category) -> None:
        await category.set({
            "is_active": False,
            "updated_at": datetime.now(timezone.utc)
        })

    async def get_admin_category_stats(self) -> dict:
        pipeline = [
            {"$group": {
                "_id": None,
                "total": {"$sum": 1},
                "active": {"$sum": {"$cond": [{"$eq": ["$is_active", True]}, 1, 0]}},
                "inactive": {"$sum": {"$cond": [{"$eq": ["$is_active", False]}, 1, 0]}}
            }}
        ]
        results = await Category.aggregate(pipeline).to_list()
        return results[0] if results else {}
