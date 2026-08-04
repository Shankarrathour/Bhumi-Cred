import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client.get_database("bhumi")
    names = await db.list_collection_names()
    print("COLLECTIONS:", names)
    for name in names:
        count = await db[name].count_documents({})
        if count > 0:
            doc = await db[name].find_one()
            print(f"Collection {name} has {count} docs. Example:", doc)

asyncio.run(main())
