import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client.get_database("bhumi")
    vendors = await db["Vendor"].find().to_list(1)
    print("VENDOR DB DOC:", vendors)

asyncio.run(main())
