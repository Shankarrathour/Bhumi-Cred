from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime, timezone
from app.schemas.vendor import OrderResponse, OrderStatusUpdateRequest
from app.models.order import Order
from app.dependencies.auth import CurrentVendor

router = APIRouter(prefix="/vendor/orders", tags=["Vendor Orders"])

@router.get("", response_model=List[OrderResponse])
async def list_vendor_orders(current_vendor: CurrentVendor):
    # Query orders where at least one item belongs to this vendor
    from beanie import PydanticObjectId
    orders = await Order.find({"items.vendor_id": PydanticObjectId(str(current_vendor.id))}).to_list()
    return [
        OrderResponse(
            id=str(o.id), order_number=o.order_number if hasattr(o, "order_number") else None,
            farmer_id=str(o.farmer_id),
            vendor_id=str(current_vendor.id),
            items=[{
                "product_id": str(item.product_id),
                "name": item.product_name,
                "quantity": item.quantity,
                "price": item.price
            } for item in o.items if str(item.vendor_id) == str(current_vendor.id)],
            total_amount=sum(item.subtotal for item in o.items if str(item.vendor_id) == str(current_vendor.id)),
            status=str(o.status.value) if hasattr(o.status, 'value') else str(o.status),
            delivery_address=f"{o.delivery_address.address_line_1}, {o.delivery_address.city}",
            created_at=o.created_at
        ) for o in orders
    ]

@router.post("/simulate", response_model=OrderResponse)
async def simulate_order(current_vendor: CurrentVendor):
    from beanie import PydanticObjectId
    from app.models.order import OrderItemSnapshot, OrderAddressSnapshot
    from app.utils.order_number import generate_order_number
    
    order = Order(
        order_number=generate_order_number(),
        farmer_id=PydanticObjectId("507f1f77bcf86cd799439011"), # Mock objectid
        items=[
            OrderItemSnapshot(
                product_id=PydanticObjectId("507f1f77bcf86cd799439012"),
                product_name="Mock Organic Seeds",
                quantity=2,
                price=250.0,
                original_price=300.0,
                subtotal=500.0,
                category_id=PydanticObjectId("507f1f77bcf86cd799439013"),
                vendor_id=PydanticObjectId(str(current_vendor.id))
            )
        ],
        subtotal=500.0,
        discount=0.0,
        delivery_charge=50.0,
        final_total=550.0,
        status="Pending",
        delivery_address=OrderAddressSnapshot(
            full_name="Mock Farmer",
            mobile="9999999999",
            address_line_1="123 Farm Road",
            city="Village",
            state="State",
            pincode="123456"
        )
    )
    await order.insert()
    
    # Return it as OrderResponse
    return OrderResponse(
        id=str(order.id), order_number=order.order_number if hasattr(order, "order_number") else None,
        farmer_id=str(order.farmer_id),
        vendor_id=str(current_vendor.id),
        items=[{
            "product_id": str(item.product_id),
            "name": item.product_name,
            "quantity": item.quantity,
            "price": item.price
        } for item in order.items if str(item.vendor_id) == str(current_vendor.id)],
        total_amount=sum(item.subtotal for item in order.items if str(item.vendor_id) == str(current_vendor.id)),
        status=str(order.status.value) if hasattr(order.status, 'value') else str(order.status),
        delivery_address=f"{order.delivery_address.address_line_1}, {order.delivery_address.city}",
        created_at=order.created_at
    )
    return OrderResponse(
        id=str(order.id), order_number=order.order_number if hasattr(order, "order_number") else None,
        farmer_id=order.farmer_id,
        vendor_id=order.vendor_id,
        items=[item.model_dump() for item in order.items],
        total_amount=order.total_amount,
        status=order.status,
        delivery_address=order.delivery_address,
        created_at=order.created_at
    )

@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(order_id: str, request: OrderStatusUpdateRequest, current_vendor: CurrentVendor):
    order = await Order.get(order_id)
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    has_vendor_items = any(str(item.vendor_id) == str(current_vendor.id) for item in order.items)
    if not has_vendor_items:
        raise HTTPException(status_code=404, detail="Order not found")
        
    valid_statuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]
    if request.status.upper() not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    order.status = request.status.upper()
    order.updated_at = datetime.now(timezone.utc)
    
    if request.status == "Delivered":
        # Simulate crediting the vendor's wallet
        current_vendor.wallet_balance += sum(item.subtotal for item in order.items if str(item.vendor_id) == str(current_vendor.id))
        await current_vendor.save()
        
    await order.save()
    
    return OrderResponse(
        id=str(order.id), order_number=order.order_number if hasattr(order, "order_number") else None,
        farmer_id=str(order.farmer_id),
        vendor_id=str(current_vendor.id),
        items=[{
            "product_id": str(item.product_id),
            "name": item.product_name,
            "quantity": item.quantity,
            "price": item.price
        } for item in order.items if str(item.vendor_id) == str(current_vendor.id)],
        total_amount=sum(item.subtotal for item in order.items if str(item.vendor_id) == str(current_vendor.id)),
        status=str(order.status.value) if hasattr(order.status, 'value') else str(order.status),
        delivery_address=f"{order.delivery_address.address_line_1}, {order.delivery_address.city}",
        created_at=order.created_at
    )
