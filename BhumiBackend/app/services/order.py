import logging
from typing import Optional
from app.repositories.order import OrderRepository
from app.services.checkout import CheckoutService
from app.schemas.checkout import CheckoutRequest
from app.schemas.order import (
    OrderSummaryResponse, OrderListResponse, OrderListItemResponse, OrderDetailsResponse, OrderItemResponse
)
from app.models.order import Order, OrderItemSnapshot, OrderAddressSnapshot, OrderStatusHistory
from app.models.farmer import Farmer
from app.core.enums import OrderStatus
from app.utils.order_number import generate_order_number
from app.services.inventory import InventoryService
from app.validators.order_status_validator import OrderStatusValidator
from app.repositories.notification import NotificationRepository
from app.services.notification_service import NotificationService
from beanie import PydanticObjectId
from fastapi import status
from app.core.exceptions import AppException

logger = logging.getLogger(__name__)

class OrderService:
    def __init__(
        self,
        order_repo: OrderRepository,
        checkout_service: CheckoutService,
        inventory_service: InventoryService,
        notification_service: Optional[NotificationService] = None,
    ):
        self.order_repo = order_repo
        self.checkout_service = checkout_service
        self.inventory_service = inventory_service
        self._notifications = notification_service or NotificationService(NotificationRepository())

    # Notification Extension Points (Phase 5 placeholders)
    def _emit_order_created(self, order: Order):
        # TODO: Integrate Email Notification
        # TODO: Integrate SMS Notification
        # TODO: Integrate Push Notification
        # TODO: Integrate WebSocket Event
        pass

    def _emit_order_cancelled(self, order: Order):
        # TODO: Integrate Email Notification
        # TODO: Integrate SMS Notification
        # TODO: Integrate Push Notification
        # TODO: Integrate WebSocket Event
        pass

    def _emit_status_changed(self, order: Order, old_status: OrderStatus, new_status: OrderStatus):
        # TODO: Integrate Email Notification
        # TODO: Integrate SMS Notification
        # TODO: Integrate Push Notification
        # TODO: Integrate WebSocket Event
        pass

    async def create_order(self, farmer_id: str, request_data: CheckoutRequest) -> OrderSummaryResponse:
        checkout_summary, product_map = await self.checkout_service._prepare_checkout(farmer_id, request_data)
        
        order_number = generate_order_number()
        
        items_snapshot = []
        for item in checkout_summary.items:
            product = product_map.get(str(item.product.id))
            items_snapshot.append(
                OrderItemSnapshot(
                    product_id=PydanticObjectId(item.product.id),
                    product_name=item.product.name,
                    quantity=item.quantity,
                    price=item.product.price,
                    original_price=item.product.original_price,
                    subtotal=item.subtotal,
                    category_id=PydanticObjectId(item.product.category.id),
                    primary_image=item.product.primary_image,
                    vendor_id=product.vendor_id if product else None
                )
            )
            
        address_snapshot = OrderAddressSnapshot(
            full_name=checkout_summary.delivery_address.full_name,
            mobile=checkout_summary.delivery_address.mobile,
            address_line_1=checkout_summary.delivery_address.address_line_1,
            address_line_2=checkout_summary.delivery_address.address_line_2,
            city=checkout_summary.delivery_address.city,
            state=checkout_summary.delivery_address.state,
            pincode=checkout_summary.delivery_address.pincode
        )
        
        order = Order(
            order_number=order_number,
            farmer_id=PydanticObjectId(farmer_id),
            items=items_snapshot,
            subtotal=checkout_summary.subtotal,
            discount=checkout_summary.discount,
            delivery_charge=checkout_summary.delivery_charge,
            final_total=checkout_summary.final_total,
            delivery_address=address_snapshot,
            status=OrderStatus.PENDING,
            status_history=[
                OrderStatusHistory(
                    status=OrderStatus.PENDING,
                    changed_by="SYSTEM",
                    remarks="Order created"
                )
            ]
        )
        
        # TODO: Implement MongoDB Multi-Document Transactions here.
        # Once Replica Set/Atlas is verified, wrap the below in:
        # async with await Order.get_motor_client().start_session() as session:
        #     async with session.start_transaction():
        #         (pass session=session to repositories)

        for item in checkout_summary.items:
            product = product_map.get(str(item.product.id))
            try:
                await self.inventory_service.decrease_stock(str(item.product.id), item.quantity, product=product)
            except ValueError as e:
                raise AppException(
                    status_code=status.HTTP_409_CONFLICT,
                    error_code="STOCK_UNAVAILABLE",
                    detail=str(e)
                )

        await self.order_repo.create(order)
        await self.checkout_service.cart_repo.clear_cart(farmer_id)

        # Fire notification hook
        self._emit_order_created(order)

        try:
            farmer = await Farmer.get(PydanticObjectId(farmer_id))
            if farmer:
                await self._notifications.create_admin_notification(
                    "Marketplace Purchase",
                    f"Farmer {farmer.farmer_id} purchased a marketplace product.",
                    type="purchase",
                    actor_type="farmer",
                )
        except Exception:
            logger.exception(f"Failed to create admin notification for order {order.id}")

        return OrderSummaryResponse(
            order_id=str(order.id),
            order_number=order.order_number,
            status=order.status,
            final_total=order.final_total,
            created_at=order.created_at
        )

    async def get_farmer_orders(self, farmer_id: str, page: int, limit: int, status_filter: str = None) -> OrderListResponse:
        orders, total = await self.order_repo.get_by_farmer(farmer_id, page, limit, status_filter)
        total_pages = (total + limit - 1) // limit
        
        items = []
        for o in orders:
            total_items = sum(item.quantity for item in o.items)
            items.append(
                OrderListItemResponse(
                    order_id=str(o.id),
                    order_number=o.order_number,
                    status=o.status,
                    total_items=total_items,
                    final_total=o.final_total,
                    created_at=o.created_at
                )
            )
            
        return OrderListResponse(
            items=items,
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1
        )

    def _map_order_details(self, order: Order) -> OrderDetailsResponse:
        return OrderDetailsResponse(
            id=str(order.id),
            order_number=order.order_number,
            status=order.status,
            items=[
                OrderItemResponse(
                    product_id=str(i.product_id),
                    product_name=i.product_name,
                    quantity=i.quantity,
                    price=i.price,
                    original_price=i.original_price,
                    subtotal=i.subtotal,
                    category_id=str(i.category_id),
                    primary_image=i.primary_image
                ) for i in order.items
            ],
            subtotal=order.subtotal,
            discount=order.discount,
            delivery_charge=order.delivery_charge,
            final_total=order.final_total,
            delivery_address=order.delivery_address.model_dump(),
            created_at=order.created_at
        )

    async def get_order_details(self, farmer_id: str, order_id: str) -> OrderDetailsResponse:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, error_code="ORDER_NOT_FOUND", detail="Order not found.")
        
        if str(order.farmer_id) != farmer_id:
            raise AppException(status_code=status.HTTP_403_FORBIDDEN, error_code="FORBIDDEN", detail="Access denied.")
            
        return self._map_order_details(order)

    async def get_order_by_number(self, farmer_id: str, order_number: str) -> OrderDetailsResponse:
        order = await self.order_repo.get_by_order_number(order_number)
        if not order:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, error_code="ORDER_NOT_FOUND", detail="Order not found.")
            
        if str(order.farmer_id) != farmer_id:
            raise AppException(status_code=status.HTTP_403_FORBIDDEN, error_code="FORBIDDEN", detail="Access denied.")
            
        return self._map_order_details(order)

    async def update_order_status(self, order_id: str, new_status: OrderStatus, changed_by: str, remarks: str = None) -> OrderDetailsResponse:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, error_code="ORDER_NOT_FOUND", detail="Order not found.")
            
        if not OrderStatusValidator.is_valid_transition(order.status, new_status):
            raise AppException(
                status_code=status.HTTP_409_CONFLICT,
                error_code="INVALID_TRANSITION",
                detail=f"Cannot transition order from {order.status} to {new_status}."
            )
            
        old_status = order.status
        order = await self.order_repo.update_status(order, new_status, changed_by, remarks)
        
        self._emit_status_changed(order, old_status, new_status)
        return self._map_order_details(order)

    async def cancel_order(self, farmer_id: str, order_id: str) -> OrderDetailsResponse:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, error_code="ORDER_NOT_FOUND", detail="Order not found.")
            
        if str(order.farmer_id) != farmer_id:
            raise AppException(status_code=status.HTTP_403_FORBIDDEN, error_code="FORBIDDEN", detail="Access denied.")
            
        if not OrderStatusValidator.can_cancel(order.status):
            raise AppException(
                status_code=status.HTTP_409_CONFLICT,
                error_code="INVALID_STATUS",
                detail="This order can no longer be cancelled."
            )
            
        # Restore stock using immutable order snapshots via InventoryService
        for item in order.items:
            try:
                await self.inventory_service.increase_stock(str(item.product_id), item.quantity)
            except ValueError:
                pass
                
        old_status = order.status
        order = await self.order_repo.cancel(order, changed_by="FARMER", remarks="Order cancelled by farmer")
        
        self._emit_order_cancelled(order)
        self._emit_status_changed(order, old_status, OrderStatus.CANCELLED)
        
        return self._map_order_details(order)
