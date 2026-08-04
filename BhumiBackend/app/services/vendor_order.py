from typing import List, Optional
from app.repositories.order import OrderRepository
from app.schemas.order import (
    VendorOrderResponse, VendorOrderSummaryResponse, VendorOrderListResponse, VendorOrderItemResponse
)
from app.models.order import Order
from app.core.enums import OrderStatus
from app.validators.order_status_validator import OrderStatusValidator
from fastapi import status
from app.core.exceptions import AppException

class VendorOrderService:
    def __init__(self, order_repo: OrderRepository):
        self.order_repo = order_repo

    async def get_vendor_orders(
        self,
        vendor_id: str,
        page: int,
        limit: int,
        status_filter: Optional[str] = None,
        search: Optional[str] = None
    ) -> VendorOrderListResponse:
        orders, total = await self.order_repo.get_vendor_orders(vendor_id, page, limit, status_filter, search)
        total_pages = (total + limit - 1) // limit
        
        items = []
        for o in orders:
            vendor_items = [item for item in o.items if str(item.vendor_id) == vendor_id]
            vendor_subtotal = sum(item.subtotal for item in vendor_items)
            vendor_total_items = sum(item.quantity for item in vendor_items)
            
            items.append(
                VendorOrderSummaryResponse(
                    order_id=str(o.id),
                    order_number=o.order_number,
                    status=o.status,
                    vendor_subtotal=vendor_subtotal,
                    vendor_total_items=vendor_total_items,
                    created_at=o.created_at
                )
            )
            
        return VendorOrderListResponse(
            items=items,
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1
        )

    async def get_vendor_order_details(self, vendor_id: str, order_id: str) -> VendorOrderResponse:
        order = await self.order_repo.get_vendor_order(vendor_id, order_id)
        if not order:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, error_code="ORDER_NOT_FOUND", detail="Order not found or does not contain your products.")
            
        vendor_items = [item for item in order.items if str(item.vendor_id) == vendor_id]
        if not vendor_items:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, error_code="ORDER_NOT_FOUND", detail="Order not found or does not contain your products.")
            
        vendor_subtotal = sum(item.subtotal for item in vendor_items)
        vendor_total_items = sum(item.quantity for item in vendor_items)
        
        return VendorOrderResponse(
            order_id=str(order.id),
            order_number=order.order_number,
            status=order.status,
            created_at=order.created_at,
            vendor_items=[
                VendorOrderItemResponse(
                    product_id=str(i.product_id),
                    product_name=i.product_name,
                    quantity=i.quantity,
                    price=i.price,
                    original_price=i.original_price,
                    subtotal=i.subtotal,
                    category_id=str(i.category_id),
                    primary_image=i.primary_image
                ) for i in vendor_items
            ],
            vendor_subtotal=vendor_subtotal,
            vendor_total_items=vendor_total_items,
            delivery_address=order.delivery_address.model_dump()
        )

    async def _update_status(self, vendor_id: str, order_id: str, new_status: OrderStatus, remarks: str) -> VendorOrderResponse:
        order = await self.order_repo.get_vendor_order(vendor_id, order_id)
        if not order:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, error_code="ORDER_NOT_FOUND", detail="Order not found or does not contain your products.")
            
        if not OrderStatusValidator.is_valid_transition(order.status, new_status):
            raise AppException(
                status_code=status.HTTP_409_CONFLICT,
                error_code="INVALID_TRANSITION",
                detail=f"Cannot transition order from {order.status} to {new_status}."
            )
            
        order = await self.order_repo.update_status(order, new_status, changed_by=f"VENDOR:{vendor_id}", remarks=remarks)
        
        # VendorOrderService logic continues using the same response building
        return await self.get_vendor_order_details(vendor_id, order_id)

    async def confirm_order(self, vendor_id: str, order_id: str) -> VendorOrderResponse:
        return await self._update_status(vendor_id, order_id, OrderStatus.CONFIRMED, "Confirmed by Vendor")

    async def start_processing(self, vendor_id: str, order_id: str) -> VendorOrderResponse:
        return await self._update_status(vendor_id, order_id, OrderStatus.PROCESSING, "Processing Started")

    async def pack_order(self, vendor_id: str, order_id: str) -> VendorOrderResponse:
        return await self._update_status(vendor_id, order_id, OrderStatus.PACKED, "Packed")

    async def ship_order(self, vendor_id: str, order_id: str) -> VendorOrderResponse:
        return await self._update_status(vendor_id, order_id, OrderStatus.SHIPPED, "Shipped")
