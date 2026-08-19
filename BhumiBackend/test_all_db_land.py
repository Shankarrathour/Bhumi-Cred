import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    collection = db["land_parcels"]
    
    print("Listing raw documents in land_parcels collection:")
    cursor = collection.find({})
    count = 0
    async for doc in cursor:
        count += 1
        farmer_id = doc.get("farmer_id")
        is_active = doc.get("is_active")
        print(f"Doc {count}: id={doc['_id']}, farmer_id={farmer_id} ({type(farmer_id)}), is_active={is_active}")
        
        # Check if farmer_id is missing or None
        if not farmer_id:
            print("  --> WARNING: farmer_id is missing, null, or empty!")
            
        # Check if corresponding farmer exists
        if farmer_id:
            farmer = await db["farmers"].find_one({"_id": farmer_id})
            if not farmer:
                # Try finding by string if it was stored as string
                from bson import ObjectId
                try:
                    farmer = await db["farmers"].find_one({"_id": ObjectId(str(farmer_id))})
                except Exception:
                    pass
            if not farmer:
                print(f"  --> WARNING: No corresponding farmer found in 'farmers' collection for farmer_id: {farmer_id}!")

if __name__ == "__main__":
    asyncio.run(main())
