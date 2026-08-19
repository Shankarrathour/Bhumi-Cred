import sys
import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config.settings import settings
from app.models.order import Order, OrderStatusHistory
from app.core.enums import OrderStatus

async def update_status(order_identifier: str, status_str: str):
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    await init_beanie(database=db, document_models=[Order])
    from bson import ObjectId
    
    order = None
    # Only try finding by MongoDB ObjectId if it is valid format
    if len(order_identifier) == 24 and all(c in "0123456789abcdefABCDEF" for c in order_identifier):
        try:
            order = await Order.get(order_identifier)
            if not order:
                order = await Order.get(ObjectId(order_identifier))
        except Exception:
            pass
            
    if not order:
        # Try finding by order number
        order = await Order.find_one(Order.order_number == order_identifier)
        
    if not order:
        print(f"Error: Order with identifier '{order_identifier}' not found.")
        return False
        
    status_str = status_str.upper()
    try:
        new_status = OrderStatus(status_str)
    except ValueError:
        print(f"Error: Invalid status '{status_str}'. Must be one of PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED.")
        return False
        
    order.status = new_status
    order.updated_at = datetime.now(timezone.utc)
    if order.status_history is None:
        order.status_history = []
        
    order.status_history.append(
        OrderStatusHistory(
            status=new_status,
            changed_by="DEVELOPER_SCRIPT",
            remarks=f"Status updated to {status_str} via local utility script."
        )
    )
    
    await order.save()
    print(f"\n=========================================")
    print(f" SUCCESS: Status Updated")
    print(f"=========================================")
    print(f"Order Number: {order.order_number}")
    print(f"New Status  : {status_str}")
    print(f"=========================================\n")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python update_order_status.py <order_number_or_id> <PENDING|PROCESSING|SHIPPED|DELIVERED|CANCELLED>")
        sys.exit(1)
        
    order_id = sys.argv[1]
    status = sys.argv[2]
    
    asyncio.run(update_status(order_id, status))
