import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
from app.models.admin_user import AdminUser, AdminRole
from passlib.context import CryptContext
import requests
from beanie import init_beanie

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client.get_database("bhumi")
    await init_beanie(database=db, document_models=[AdminUser])
    
    # Check if exists
    exists = await AdminUser.find_one(AdminUser.email == "test@bhumicred.com")
    if not exists:
        await AdminUser(
            name="Test", 
            email="test@bhumicred.com", 
            password_hash=pwd_context.hash("password"), 
            role=AdminRole.SUPER_ADMIN
        ).insert()

asyncio.run(create_admin())

# Login
login_res = requests.post("http://localhost:8000/v1/admin/auth/login", json={
    "email": "test@bhumicred.com",
    "password": "password"
})
token = login_res.json().get("access_token")
print("LOGIN TOKEN:", token)

# GET vendors
res = requests.get("http://localhost:8000/v1/admin/vendors", headers={
    "Authorization": f"Bearer {token}"
})
print("STATUS:", res.status_code)
print("RESPONSE:", res.text)
