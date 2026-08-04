from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timezone
from app.config.settings import settings
from app.schemas.vendor import VendorResponse, VendorListResponse
from app.models.vendor import Vendor
from app.models.order import Order
from app.models.farmer import Farmer
from app.schemas.vendor import OrderResponse
from app.dependencies.auth import CurrentAdmin
from app.dependencies.services import get_admin_vendor_service
from app.services.admin_vendor_service import AdminVendorService

router = APIRouter(prefix="/admin", tags=["Admin Vendor Moderation"])

@router.get("/vendors", response_model=VendorListResponse)
async def list_vendors(
    current_admin: CurrentAdmin,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE, description="Results per page"),
    search: Optional[str] = Query(None, min_length=1, max_length=100, description="Search by store name, name, or phone"),
    svc: AdminVendorService = Depends(get_admin_vendor_service),
) -> VendorListResponse:
    return await svc.list_vendors(page=page, limit=limit, search=search)

@router.put("/vendors/{vendor_id}/status", response_model=VendorResponse)
async def update_vendor_status(vendor_id: str, status: str, current_admin: CurrentAdmin):
    vendor = await Vendor.get(vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    if status not in ["Active", "Rejected", "Pending", "Suspended"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    vendor.status = status
    if status == "Active":
        vendor.is_verified = True
    else:
        vendor.is_verified = False
        
    vendor.updated_at = datetime.now(timezone.utc)
    await vendor.save()
    
    return VendorResponse(
        id=str(vendor.id),
        vendor_id=vendor.vendor_id,
        name=vendor.name,
        phone=vendor.phone,
        store_name=vendor.business_name or vendor.store_name,
        gst_number=vendor.gst_number,
        address=vendor.address,
        status=vendor.status,
        wallet_balance=vendor.wallet_balance,
        created_at=vendor.created_at
    )

@router.get("/orders", response_model=List[OrderResponse])
@router.get("/vendors/orders", response_model=List[OrderResponse])
async def list_all_orders(current_admin: CurrentAdmin):
    from bson import ObjectId

    orders = await Order.find_all().sort("-created_at").to_list()

    order_vendor_ids = {
        str(o.items[0].vendor_id)
        for o in orders
        if o.items and o.items[0].vendor_id
    }
    object_ids = [ObjectId(vid) for vid in order_vendor_ids if ObjectId.is_valid(vid)]
    vendors = await Vendor.find({"_id": {"$in": object_ids}}).to_list()
    vendor_public_id_map = {str(v.id): v.vendor_id for v in vendors}

    farmer_ids = {str(o.farmer_id) for o in orders if o.farmer_id}
    farmer_object_ids = [ObjectId(fid) for fid in farmer_ids if ObjectId.is_valid(fid)]
    farmers = await Farmer.find({"_id": {"$in": farmer_object_ids}}).to_list()
    farmer_name_map = {str(f.id): f.full_name for f in farmers}

    return [
        OrderResponse(
            id=str(o.id),
            order_number=o.order_number if hasattr(o, "order_number") else None,
            farmer_id=str(o.farmer_id),
            farmer_name=farmer_name_map.get(str(o.farmer_id), "Farmer"),
            vendor_id=str(o.items[0].vendor_id) if o.items and o.items[0].vendor_id else "None",
            vendor_public_id=vendor_public_id_map.get(str(o.items[0].vendor_id)) if o.items and o.items[0].vendor_id else None,
            items=[{
                "product_id": str(item.product_id),
                "name": item.product_name,
                "quantity": item.quantity,
                "price": item.price
            } for item in o.items],
            total_amount=o.final_total,
            status=str(o.status.value) if hasattr(o.status, 'value') else str(o.status),
            delivery_address=f"{o.delivery_address.address_line_1}, {o.delivery_address.city}" if o.delivery_address else "Local Delivery Address",
            created_at=o.created_at
        ) for o in orders
    ]


@router.put("/orders/{order_id}/status", response_model=OrderResponse)
@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status_admin(
    order_id: str,
    status: str,
    current_admin: CurrentAdmin
):
    from bson import ObjectId
    from app.core.enums import OrderStatus
    from app.models.order import OrderStatusHistory

    order = await Order.get(order_id)
    if not order and ObjectId.is_valid(order_id):
        order = await Order.get(ObjectId(order_id))
    if not order:
        order = await Order.find_one(Order.order_number == order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    new_status_str = status.upper()
    try:
        new_status_enum = OrderStatus(new_status_str)
    except ValueError:
        new_status_enum = OrderStatus.PENDING

    order.status = new_status_enum
    order.updated_at = datetime.now(timezone.utc)
    if order.status_history is None:
        order.status_history = []
    order.status_history.append(
        OrderStatusHistory(
            status=new_status_enum,
            changed_by=f"ADMIN ({current_admin.email})",
            remarks=f"Status updated to {status} by Admin"
        )
    )
    await order.save()

    farmer = await Farmer.get(order.farmer_id)
    farmer_name = farmer.full_name if farmer else "Farmer"

    vendor_public_id = None
    if order.items and order.items[0].vendor_id:
        v = await Vendor.get(order.items[0].vendor_id)
        if v:
            vendor_public_id = v.vendor_id

    return OrderResponse(
        id=str(order.id),
        order_number=order.order_number,
        farmer_id=str(order.farmer_id),
        farmer_name=farmer_name,
        vendor_id=str(order.items[0].vendor_id) if order.items and order.items[0].vendor_id else "None",
        vendor_public_id=vendor_public_id,
        items=[{
            "product_id": str(item.product_id),
            "name": item.product_name,
            "quantity": item.quantity,
            "price": item.price
        } for item in order.items],
        total_amount=order.final_total,
        status=str(order.status.value) if hasattr(order.status, 'value') else str(order.status),
        delivery_address=f"{order.delivery_address.address_line_1}, {order.delivery_address.city}" if order.delivery_address else "Local Delivery Address",
        created_at=order.created_at
    )

