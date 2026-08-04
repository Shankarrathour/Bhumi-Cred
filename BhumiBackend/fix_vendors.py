import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client.get_database("bhumi")
    collection = db.get_collection("vendors")
    
    # Direct motor update avoids Pydantic re-adding `email: null`
    result = await collection.update_many(
        {"status": "Active"},
        {"$set": {"is_verified": True}}
    )
    print(f"Updated {result.modified_count} vendors directly via Motor.")

asyncio.run(main())
