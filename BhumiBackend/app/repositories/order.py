from typing import List, Optional, Tuple
from datetime import datetime, timezone
from pymongo import DESCENDING
from beanie import PydanticObjectId
from app.core.enums import OrderStatus
from app.models.order import Order, OrderStatusHistory
from app.utils.mongo import to_object_id

class OrderRepository:
    async def create(self, order: Order) -> Order:
        await order.insert()
        return order

    async def update_status(self, order: Order, status: OrderStatus, changed_by: str, remarks: Optional[str] = None) -> Order:
        history_entry = OrderStatusHistory(status=status, changed_by=changed_by, remarks=remarks)
        order.status = status
        order.status_history.append(history_entry)
        order.updated_at = datetime.now(timezone.utc)
        await order.save()
        return order

    async def cancel(self, order: Order, changed_by: str, remarks: Optional[str] = None) -> Order:
        return await self.update_status(order, OrderStatus.CANCELLED, changed_by, remarks)

    async def get_by_id(self, order_id: str) -> Optional[Order]:
        try:
            return await Order.get(PydanticObjectId(order_id))
        except Exception:
            return None

    async def get_by_order_number(self, order_number: str) -> Optional[Order]:
        return await Order.find_one(Order.order_number == order_number)

    async def get_by_farmer(
        self, 
        farmer_id: str, 
        page: int = 1, 
        limit: int = 20, 
        status: Optional[str] = None
    ) -> Tuple[List[Order], int]:
        try:
            query = {"farmer_id": PydanticObjectId(farmer_id)}
            if status:
                query["status"] = status
                
            find_query = Order.find(query)
            total = await find_query.count()
            skip = (page - 1) * limit
            
            orders = await find_query.sort([("created_at", DESCENDING)]).skip(skip).limit(limit).to_list()
            return orders, total
        except Exception:
            return [], 0

    async def count(self) -> int:
        return await Order.count()

    async def get_vendor_orders(
        self,
        vendor_id: str,
        page: int = 1,
        limit: int = 20,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[Order], int]:
        query = {"items.vendor_id": to_object_id(vendor_id, "vendor_id")}
        if status:
            query["status"] = status
            
        if search:
            search_regex = {"$regex": search, "$options": "i"}
            query["order_number"] = search_regex
            
        find_query = Order.find(query)
        total = await find_query.count()
        skip = (page - 1) * limit
        orders = await find_query.sort([("created_at", DESCENDING)]).skip(skip).limit(limit).to_list()
        return orders, total

    async def get_vendor_order(self, vendor_id: str, order_id: str) -> Optional[Order]:
        try:
            return await Order.find_one(
                Order.id == PydanticObjectId(order_id),
                Order.items.vendor_id == PydanticObjectId(vendor_id)
            )
        except Exception:
            return None

    async def get_vendor_order_stats(self, vendor_id: str) -> dict:
        vendor_object_id = to_object_id(vendor_id, "vendor_id")
        pipeline = [
            {"$match": {"items.vendor_id": vendor_object_id}},
            {"$facet": {
                "orders_status": [
                    {"$group": {
                        "_id": "$status",
                        "count": {"$sum": 1}
                    }}
                ],
                "sales": [
                    {"$unwind": "$items"},
                    {"$match": {"items.vendor_id": vendor_object_id}},
                    {"$group": {
                        "_id": "$_id",
                        "order_revenue": {"$sum": "$items.subtotal"},
                        "order_qty": {"$sum": "$items.quantity"}
                    }},
                    {"$group": {
                        "_id": None,
                        "total_orders": {"$sum": 1},
                        "total_quantity_sold": {"$sum": "$order_qty"},
                        "gross_revenue": {"$sum": "$order_revenue"}
                    }}
                ]
            }}
        ]
        
        results = await Order.aggregate(pipeline).to_list()
        
        if not results:
            return {}
            
        data = results[0]
        
        return {
            "orders_status": data.get("orders_status", []),
            "sales": data.get("sales", [])
        }
