import re
from typing import List, Optional, Tuple
from datetime import datetime, timezone

from pymongo import ASCENDING, DESCENDING
from beanie import PydanticObjectId

from app.models.product import Product, ProductStatus
from app.schemas.product import ProductCreate, ProductUpdate
from app.utils.mongo import to_object_id

class ProductRepository:
    async def create(self, product_data: ProductCreate, slug: str) -> Product:
        product = Product(
            **product_data.model_dump(),
            slug=slug,
        )
        await product.insert()
        return product

    async def get_by_id(self, product_id: str) -> Optional[Product]:
        try:
            return await Product.get(PydanticObjectId(product_id))
        except Exception:
            return None

    async def get_by_slug(self, slug: str) -> Optional[Product]:
        return await Product.find_one(Product.slug == slug)

    async def get_by_name(self, name: str) -> Optional[Product]:
        return await Product.find_one(Product.name == name)

    async def get_by_sku(self, sku: str) -> Optional[Product]:
        return await Product.find_one(Product.sku == sku)

    async def get_all(
        self,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        category_id: Optional[str] = None,
        featured: Optional[bool] = None,
        sort: Optional[str] = "newest",
    ) -> Tuple[List[Product], int]:
        skip = (page - 1) * limit
        
        # Base query: active and approved
        query = {
            "is_active": True,
            "status": ProductStatus.APPROVED,
        }
        
        if category_id:
            query["category_id"] = to_object_id(category_id, "category_id")

        if featured is not None:
            query["is_featured"] = featured
            
        if search:
            # Case-insensitive search on name, brand, description, and search_keywords
            search_regex = {"$regex": search, "$options": "i"}
            query["$or"] = [
                {"name": search_regex},
                {"brand": search_regex},
                {"description": search_regex},
                {"search_keywords": search_regex},
            ]
            
        # Determine sort order
        sort_config = [("created_at", DESCENDING)]
        if sort == "oldest":
            sort_config = [("created_at", ASCENDING)]
        elif sort == "price_low":
            sort_config = [("price", ASCENDING)]
        elif sort == "price_high":
            sort_config = [("price", DESCENDING)]
            
        find_query = Product.find(query)
        total = await find_query.count()
        
        products = await find_query.sort(sort_config).skip(skip).limit(limit).to_list()
        return products, total

    async def update(self, product: Product, update_data: ProductUpdate, new_slug: Optional[str] = None) -> Product:
        update_dict = update_data.model_dump(exclude_unset=True)
        if new_slug:
            update_dict["slug"] = new_slug
            
        if update_dict:
            update_dict["updated_at"] = datetime.now(timezone.utc)
            await product.set(update_dict)
        return product

    async def soft_delete(self, product: Product) -> None:
        await product.set({
            "is_active": False,
            "updated_at": datetime.now(timezone.utc)
        })

    async def get_products_by_tag(self, field_name: str, tag_value: str) -> List[Product]:
        query = {
            "is_active": True,
            "status": ProductStatus.APPROVED,
            field_name: {
                "$regex": f"^{re.escape(tag_value)}$",
                "$options": "i"
            }
        }
        
        sort_config = [
            ("is_featured", DESCENDING),
            ("rating", DESCENDING),
            ("created_at", DESCENDING)
        ]
        
        return await Product.find(query).sort(sort_config).to_list()

    async def get_products_by_crop(self, crop: str) -> List[Product]:
        return await self.get_products_by_tag("crop_tags", crop)

    async def get_products_by_soil(self, soil: str) -> List[Product]:
        return await self.get_products_by_tag("soil_tags", soil)

    async def decrease_stock(self, product_id: str, quantity: int, product: Optional[Product] = None) -> Product:
        if not product:
            product = await self.get_by_id(product_id)
            if not product:
                raise ValueError("Product not found.")
                
        if product.stock_quantity < quantity:
            raise ValueError(f"Insufficient stock for {product.name}.")
            
        product.stock_quantity -= quantity
        product.updated_at = datetime.now(timezone.utc)
        await product.save()
        return product

    async def increase_stock(self, product_id: str, quantity: int, product: Optional[Product] = None) -> Product:
        if not product:
            product = await self.get_by_id(product_id)
            if not product:
                raise ValueError("Product not found.")
                
        product.stock_quantity += quantity
        product.updated_at = datetime.now(timezone.utc)
        await product.save()
        return product

    async def get_by_vendor(
        self,
        vendor_id: str,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None
    ) -> Tuple[List[Product], int]:
        skip = (page - 1) * limit
        query = {"vendor_id": to_object_id(vendor_id, "vendor_id")}

        if status:
            query["status"] = status
            
        if search:
            search_regex = {"$regex": search, "$options": "i"}
            query["$or"] = [
                {"name": search_regex},
                {"sku": search_regex}
            ]
            
        find_query = Product.find(query)
        total = await find_query.count()
        products = await find_query.sort([("created_at", DESCENDING)]).skip(skip).limit(limit).to_list()
        return products, total

    async def get_vendor_product(self, vendor_id: str, product_id: str) -> Optional[Product]:
        try:
            return await Product.find_one(
                Product.id == PydanticObjectId(product_id),
                Product.vendor_id == PydanticObjectId(vendor_id)
            )
        except Exception:
            return None

    async def update_vendor_product(self, product: Product, update_data: dict) -> Product:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await product.set(update_data)
        return product

    async def update_stock(self, product: Product, stock_quantity: int) -> Product:
        await product.set({
            "stock_quantity": stock_quantity,
            "updated_at": datetime.now(timezone.utc)
        })
        return product

    async def soft_delete_vendor_product(self, product: Product) -> None:
        await product.set({
            "is_active": False,
            "updated_at": datetime.now(timezone.utc)
        })

    async def get_vendor_product_stats(self, vendor_id: str) -> dict:
        pipeline = [
            {"$match": {"vendor_id": to_object_id(vendor_id, "vendor_id")}},
            {"$facet": {
                "summary": [
                    {"$group": {
                        "_id": None,
                        "total": {"$sum": 1},
                        "active": {"$sum": {"$cond": [{"$eq": ["$is_active", True]}, 1, 0]}},
                        "inactive": {"$sum": {"$cond": [{"$eq": ["$is_active", False]}, 1, 0]}},
                        "pending": {"$sum": {"$cond": [{"$eq": ["$status", "pending"]}, 1, 0]}},
                        "approved": {"$sum": {"$cond": [{"$eq": ["$status", "approved"]}, 1, 0]}},
                        "rejected": {"$sum": {"$cond": [{"$eq": ["$status", "rejected"]}, 1, 0]}},
                    }}
                ],
                "inventory": [
                    {"$group": {
                        "_id": None,
                        "out_of_stock": {"$sum": {"$cond": [{"$lte": ["$stock_quantity", 0]}, 1, 0]}},
                        "low_stock": {"$sum": {"$cond": [
                            {"$and": [
                                {"$gt": ["$stock_quantity", 0]}, 
                                {"$lte": ["$stock_quantity", "$low_stock_threshold"]}
                            ]}, 1, 0
                        ]}}
                    }}
                ]
            }}
        ]
        
        results = await Product.aggregate(pipeline).to_list()
        
        if not results:
            return {}
            
        data = results[0]
        
        summary = data.get("summary", [])
        inventory = data.get("inventory", [])
        
        return {
            "summary": summary[0] if summary else {},
            "inventory": inventory[0] if inventory else {}
        }

    async def get_all_for_admin(
        self,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        vendor_id: Optional[str] = None,
        category_id: Optional[str] = None,
        status: Optional[ProductStatus] = None,
    ) -> Tuple[List[Product], int]:
        """List products of any status for the admin moderation view (unlike
        get_pending_products, which is scoped to PENDING only)."""
        skip = (page - 1) * limit
        query: dict = {}
        if status is not None:
            query["status"] = status

        if vendor_id:
            query["vendor_id"] = to_object_id(vendor_id, "vendor_id")

        if category_id:
            query["category_id"] = to_object_id(category_id, "category_id")

        if search:
            search_regex = {"$regex": search, "$options": "i"}
            query["$or"] = [
                {"name": search_regex},
                {"sku": search_regex},
                {"brand": search_regex}
            ]

        find_query = Product.find(query)
        total = await find_query.count()
        products = await find_query.sort([("created_at", DESCENDING)]).skip(skip).limit(limit).to_list()
        return products, total

    async def get_pending_products(
        self,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        vendor_id: Optional[str] = None,
        category_id: Optional[str] = None
    ) -> Tuple[List[Product], int]:
        skip = (page - 1) * limit
        query = {"status": ProductStatus.PENDING}

        
        if vendor_id:
            query["vendor_id"] = to_object_id(vendor_id, "vendor_id")

        if category_id:
            query["category_id"] = to_object_id(category_id, "category_id")

        if search:
            search_regex = {"$regex": search, "$options": "i"}
            query["$or"] = [
                {"name": search_regex},
                {"sku": search_regex},
                {"brand": search_regex}
            ]
            
        find_query = Product.find(query)
        total = await find_query.count()
        products = await find_query.sort([("created_at", DESCENDING)]).skip(skip).limit(limit).to_list()
        return products, total

    async def get_pending_product(self, product_id: str) -> Optional[Product]:
        try:
            return await Product.find_one(
                Product.id == PydanticObjectId(product_id),
                Product.status == ProductStatus.PENDING
            )
        except Exception:
            return None

    async def update_status(self, product: Product, new_status: ProductStatus, changed_by: str, remarks: Optional[str] = None) -> Product:
        # Future compatibility: Push to product.status_history here when implemented
        await product.set({
            "status": new_status,
            "updated_at": datetime.now(timezone.utc)
        })
        return product

    async def get_admin_marketplace_product_stats(self, today_start: datetime, week_start: datetime, month_start: datetime) -> dict:
        pipeline = [
            {"$facet": {
                "summary": [
                    {"$group": {
                        "_id": None,
                        "total": {"$sum": 1},
                        "pending": {"$sum": {"$cond": [{"$eq": ["$status", "pending"]}, 1, 0]}},
                        "approved": {"$sum": {"$cond": [{"$eq": ["$status", "approved"]}, 1, 0]}},
                        "rejected": {"$sum": {"$cond": [{"$eq": ["$status", "rejected"]}, 1, 0]}},
                        "suspended": {"$sum": {"$cond": [{"$eq": ["$status", "suspended"]}, 1, 0]}},
                        "archived": {"$sum": {"$cond": [{"$eq": ["$status", "archived"]}, 1, 0]}},
                        "hidden": {"$sum": {"$cond": [{"$eq": ["$is_active", False]}, 1, 0]}},
                        "visible": {"$sum": {"$cond": [{"$and": [{"$eq": ["$is_active", True]}, {"$eq": ["$status", "approved"]}]}, 1, 0]}}
                    }}
                ],
                "inventory": [
                    {"$group": {
                        "_id": None,
                        "total_stock": {"$sum": "$stock_quantity"},
                        "out_of_stock": {"$sum": {"$cond": [{"$lte": ["$stock_quantity", 0]}, 1, 0]}},
                        "low_stock": {"$sum": {"$cond": [
                            {"$and": [{"$gt": ["$stock_quantity", 0]}, {"$lte": ["$stock_quantity", "$low_stock_threshold"]}]}, 1, 0
                        ]}}
                    }}
                ],
                "timeline": [
                    {"$group": {
                        "_id": None,
                        "added_today": {"$sum": {"$cond": [{"$gte": ["$created_at", today_start]}, 1, 0]}},
                        "added_this_week": {"$sum": {"$cond": [{"$gte": ["$created_at", week_start]}, 1, 0]}},
                        "added_this_month": {"$sum": {"$cond": [{"$gte": ["$created_at", month_start]}, 1, 0]}}
                    }}
                ],
                "vendors_with_products": [
                    {"$match": {"vendor_id": {"$ne": None}}},
                    {"$group": {"_id": "$vendor_id"}},
                    {"$count": "count"}
                ]
            }}
        ]
        results = await Product.aggregate(pipeline).to_list()
        
        newest = await Product.find().sort([("created_at", DESCENDING)]).limit(1).to_list()
        latest_approved = await Product.find({"status": ProductStatus.APPROVED}).sort([("updated_at", DESCENDING)]).limit(1).to_list()
        
        data = results[0] if results else {}
        return {
            "stats": data,
            "newest": newest[0] if newest else None,
            "latest_approved": latest_approved[0] if latest_approved else None
        }
