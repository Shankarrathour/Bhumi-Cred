"""
Admin Reset Script
------------------
Yeh script DB mein se existing admins list karti hai,
aur .env file ke credentials se naya Super Admin create/update karti hai.

Run: python reset_admin.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
from app.models.admin_user import AdminUser, AdminRole
from passlib.context import CryptContext
from beanie import init_beanie

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def main():
    print("=" * 50)
    print("  BHUMI ADMIN RESET SCRIPT")
    print("=" * 50)

    # DB Connect
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client.get_database(settings.DATABASE_NAME)
    await init_beanie(database=db, document_models=[AdminUser])

    # Step 1: List existing admins
    all_admins = await AdminUser.find_all().to_list()
    if all_admins:
        print(f"\n📋 DB mein {len(all_admins)} admin(s) milé:")
        for a in all_admins:
            print(f"   • Email: {a.email} | Role: {a.role} | Active: {a.is_active}")
    else:
        print("\n⚠️  DB mein koi admin nahi mila.")

    # Step 2: .env se credentials lo
    new_email    = settings.SEED_ADMIN_EMAIL
    new_password = settings.SEED_ADMIN_PASSWORD
    new_name     = settings.SEED_ADMIN_NAME

    print(f"\n🔧 .env se naye credentials:")
    print(f"   Name     : {new_name}")
    print(f"   Email    : {new_email}")
    print(f"   Password : {new_password}")

    # Step 3: Purana admin same email pe ho to update karo, warna naya banao
    existing = await AdminUser.find_one(AdminUser.email == new_email)

    if existing:
        existing.name          = new_name
        existing.password_hash = pwd_context.hash(new_password)
        existing.role          = AdminRole.SUPER_ADMIN
        existing.is_active     = True
        await existing.save()
        print(f"\n✅ Admin UPDATE ho gaya: {new_email}")
    else:
        # Agar koi bhi admin nahi ya alag email ka tha
        new_admin = AdminUser(
            name=new_name,
            email=new_email,
            password_hash=pwd_context.hash(new_password),
            role=AdminRole.SUPER_ADMIN,
        )
        await new_admin.insert()
        print(f"\n✅ Naya Admin CREATE ho gaya: {new_email}")

    # Step 4: Final confirmation
    print("\n" + "=" * 50)
    print("  LOGIN CREDENTIALS (save kar lo!)")
    print("=" * 50)
    print(f"  Email    : {new_email}")
    print(f"  Password : {new_password}")
    print("=" * 50)
    print("\n🎉 Done! Ab in credentials se login karo.\n")


asyncio.run(main())
