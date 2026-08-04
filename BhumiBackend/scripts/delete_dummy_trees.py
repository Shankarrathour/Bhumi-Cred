import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

async def delete_dummy_data():
    mongo_url = os.getenv("MONGODB_URI")
    if not mongo_url:
        print("No MONGODB_URI found in .env")
        return
        
    client = AsyncIOMotorClient(mongo_url)
    db = client.get_database("test") # fallback
    if "bhumicred" in mongo_url:
        db = client.get_database("bhumicred")
    elif "bhumi" in mongo_url:
        db = client.get_database("bhumi")
    else:
        db = client.get_default_database()

    result = await db.TreeRegistration.delete_many({
        "tree_name": "UNKNOWN TREE"
    })
    
    print(f"Deleted {result.deleted_count} dummy tree registrations.")
    
asyncio.run(delete_dummy_data())
