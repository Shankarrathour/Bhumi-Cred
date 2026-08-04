import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
from app.models.admin_user import AdminUser, AdminRole
from passlib.context import CryptContext
from beanie import init_beanie

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client.get_database("bhumi")
    await init_beanie(database=db, document_models=[AdminUser])
    
    await AdminUser.find_all().delete()
    
    admin = AdminUser(
        name="Test", 
        email="test@bhumicred.com", 
        password_hash=pwd_context.hash("password"), 
        role=AdminRole.SUPER_ADMIN
    )
    await admin.insert()
    
    admins = await AdminUser.find_all().to_list()
    print("ADMINS NOW IN DB:", [(a.email, a.role) for a in admins])

asyncio.run(main())
