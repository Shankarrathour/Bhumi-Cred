import asyncio
from app.database.connection import connect_db
from app.routes.admin_orders import list_admin_orders
from app.models.admin_user import AdminUser

async def main():
    await connect_db()
    admin = await AdminUser.find_one()
    res = await list_admin_orders(current_admin=admin)
    print("Response data count:", len(res.data))
    for idx, item in enumerate(res.data):
        print(f"--- Order {idx} ---")
        for k, v in item.model_dump().items():
            print(f"  {k}: {v} (Type: {type(v).__name__})")

if __name__ == "__main__":
    asyncio.run(main())
