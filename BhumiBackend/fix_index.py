import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
import pymongo

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client.get_database("bhumi")
    collection = db.get_collection("vendors")
    
    # Drop the faulty sparse index
    try:
        await collection.drop_index("email_1")
        print("Dropped old email_1 index.")
    except Exception as e:
        print("Could not drop email_1 index:", e)
        
    # Create the correct partial index
    try:
        await collection.create_index(
            [("email", pymongo.ASCENDING)],
            unique=True,
            partialFilterExpression={"email": {"$type": "string"}}
        )
        print("Created new partial email_1 index.")
    except Exception as e:
        print("Could not create new email_1 index:", e)

asyncio.run(main())
