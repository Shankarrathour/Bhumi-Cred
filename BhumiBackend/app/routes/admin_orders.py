from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.dependencies.auth import CurrentAdmin
from app.models.order import Order
from app.models.farmer import Farmer
from app.schemas.common import SuccessResponse
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/admin/marketplace-orders", tags=["Admin Orders"])

class AdminOrderResponse(BaseModel):
    id: str
    order_id: str          # mapped to order_number
    buyer_name: str
    buyer_id: str
    vendor_name: str
    vendor_gstin: str
    product_name: str
    category: str
    total_amount: float
    payment_mode: str
    payment_status: str
    order_status: str      # Titlecase status (e.g. 'Pending', 'Shipped')
    tracking_id: str
    shipping_partner: str
    order_date: str

class OrderStatusUpdateRequest(BaseModel):
    status: str

@router.get("", response_model=SuccessResponse[List[AdminOrderResponse]])
async def list_admin_orders(current_admin: CurrentAdmin) -> SuccessResponse[List[AdminOrderResponse]]:
    orders = await Order.find_all().sort("-created_at").to_list()
    
    response_data = []
    for order in orders:
        # Fetch buyer (farmer) name
        farmer = await Farmer.get(order.farmer_id)
        buyer_name = farmer.full_name if farmer else "Unknown Farmer"
        buyer_id = farmer.farmer_id if farmer else str(order.farmer_id)
        
        # Determine vendor name and category
        vendor_name = "GreenFields Agro"
        vendor_gstin = "27AAAAA1111A1Z1"
        if order.items:
            first_item = order.items[0]
            # Vendor info defaulted to GreenFields Agro / Bhumi Store
            vendor_name = getattr(first_item, "brand", None) or "GreenFields Agro"
        
        # Product name concat
        product_name = ", ".join(item.product_name for item in order.items) if order.items else "Agri Product"
        category = "Seeds & Saplings"
        
        # Map status to Titlecase for the React frontend dropdown
        status_map = {
            "PENDING": "Pending",
            "CONFIRMED": "Pending",
            "PROCESSING": "Pending",
            "PACKED": "Packed",
            "SHIPPED": "Shipped",
            "DELIVERED": "Delivered",
            "CANCELLED": "Cancelled",
            "RETURNED": "Returned"
        }
        raw_status = str(order.status.value) if hasattr(order.status, 'value') else str(order.status)
        order_status = status_map.get(raw_status.upper(), "Pending")
        
        order_num = order.order_number or f"AGR-{str(order.id)[:8].upper()}"
        tracking_num = f"TRK-{order_num.replace('AGR-', '')}"
        total_amount = order.final_total or 0.0
        order_date = order.created_at.strftime("%Y-%m-%d %H:%M") if order.created_at else datetime.utcnow().strftime("%Y-%m-%d %H:%M")

        response_data.append(
            AdminOrderResponse(
                id=str(order.id),
                order_id=order_num,
                buyer_name=buyer_name,
                buyer_id=buyer_id,
                vendor_name=vendor_name,
                vendor_gstin=vendor_gstin,
                product_name=product_name,
                category=category,
                total_amount=total_amount,
                payment_mode="Wallet",
                payment_status="PAID",
                order_status=order_status,
                tracking_id=tracking_num,
                shipping_partner="Delhivery",
                order_date=order_date
            )
        )
        
    return SuccessResponse(message="Orders fetched successfully", data=response_data)

@router.patch("/{order_id}/status", response_model=SuccessResponse[AdminOrderResponse])
async def update_admin_order_status(
    order_id: str,
    payload: OrderStatusUpdateRequest,
    current_admin: CurrentAdmin
) -> SuccessResponse[AdminOrderResponse]:
    order = await Order.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    status_map_reverse = {
        "PENDING": "PENDING",
        "PACKED": "PACKED",
        "SHIPPED": "SHIPPED",
        "DELIVERED": "DELIVERED",
        "CANCELLED": "CANCELLED",
        "RETURNED": "RETURNED"
    }
    
    new_status_str = payload.status.upper()
    if new_status_str not in status_map_reverse:
        raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")
        
    # Append to status history
    from app.models.order import OrderStatusHistory, OrderStatus
    order.status = OrderStatus(new_status_str)
    order.status_history.append(
        OrderStatusHistory(
            status=OrderStatus(new_status_str),
            changed_by=f"ADMIN:{current_admin.email}",
            remarks=f"Status updated by Admin to {payload.status}"
        )
    )
    order.updated_at = datetime.utcnow()
    await order.save()
    
    # Fetch details and format return response
    farmer = await Farmer.get(order.farmer_id)
    buyer_name = farmer.full_name if farmer else "Unknown Farmer"
    buyer_id = farmer.farmer_id if farmer else str(order.farmer_id)
    
    vendor_name = "GreenFields Agro"
    vendor_gstin = "27AAAAA1111A1Z1"
    if order.items:
        first_item = order.items[0]
        # Vendor info defaulted to GreenFields Agro / Bhumi Store
        vendor_name = getattr(first_item, "brand", None) or "GreenFields Agro"
                
    product_name = ", ".join(item.product_name for item in order.items) if order.items else "Agri Product"
    
    status_map = {
        "PENDING": "Pending",
        "PACKED": "Packed",
        "SHIPPED": "Shipped",
        "DELIVERED": "Delivered",
        "CANCELLED": "Cancelled",
        "RETURNED": "Returned"
    }
    order_status = status_map.get(new_status_str, "Pending")
    
    order_num = order.order_number or f"AGR-{str(order.id)[:8].upper()}"
    tracking_num = f"TRK-{order_num.replace('AGR-', '')}"
    total_amount = order.final_total or 0.0
    order_date = order.created_at.strftime("%Y-%m-%d %H:%M") if order.created_at else datetime.utcnow().strftime("%Y-%m-%d %H:%M")

    response_data = AdminOrderResponse(
        id=str(order.id),
        order_id=order_num,
        buyer_name=buyer_name,
        buyer_id=buyer_id,
        vendor_name=vendor_name,
        vendor_gstin=vendor_gstin,
        product_name=product_name,
        category="Seeds & Saplings",
        total_amount=total_amount,
        payment_mode="Wallet",
        payment_status="PAID",
        order_status=order_status,
        tracking_id=tracking_num,
        shipping_partner="Delhivery",
        order_date=order_date
    )

    # Send notification to farmer
    if order.farmer_id:
        try:
            from app.repositories.notification import NotificationRepository
            from app.services.notification_service import NotificationService
            notif_svc = NotificationService(NotificationRepository())

            title_map = {
                "PACKED": "Order Approved & Packed",
                "SHIPPED": "Order Dispatched & Shipped",
                "DELIVERED": "Order Delivered",
                "CANCELLED": "Order Cancelled",
                "RETURNED": "Order Refund Processed",
            }
            msg_map = {
                "PACKED": f"Your order {order_num} ({product_name}) has been approved and packed!",
                "SHIPPED": f"Your order {order_num} ({product_name}) has been shipped! Tracking ID: {tracking_num}.",
                "DELIVERED": f"Your order {order_num} ({product_name}) has been delivered successfully!",
                "CANCELLED": f"Your order {order_num} ({product_name}) has been cancelled.",
                "RETURNED": f"Refund of ₹{total_amount} processed for order {order_num} ({product_name})!",
            }
            notif_title = title_map.get(new_status_str, f"Order Status Update: {order_status}")
            notif_msg = msg_map.get(new_status_str, f"Your order {order_num} status has been updated to {order_status}.")

            await notif_svc.create_notification(
                farmer_id=str(order.farmer_id),
                title=notif_title,
                message=notif_msg,
                type="order"
            )
        except Exception as err:
            import logging
            logging.getLogger(__name__).warning(f"Could not send order update notification to farmer: {err}")

    return SuccessResponse(message="Order status updated successfully", data=response_data)
