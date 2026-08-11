import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config.settings import settings
from app.models.admin_user import AdminUser

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    await init_beanie(database=db, document_models=[AdminUser])
    
    admins = await AdminUser.find_all().to_list()
    print(f"Found {len(admins)} admin users:")
    for admin in admins:
        print(f"Email: {admin.email}, Name: {admin.name}, Role: {admin.role}, IsActive: {admin.is_active}")

if __name__ == "__main__":
    asyncio.run(main())
