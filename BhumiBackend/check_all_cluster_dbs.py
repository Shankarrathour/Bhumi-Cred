import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    dbs = await client.list_database_names()
    print("Databases in cluster:", dbs)
    
    for db_name in dbs:
        if db_name in ["admin", "local", "config"]:
            continue
        db = client[db_name]
        collections = await db.list_collection_names()
        if "land_parcels" in collections:
            print(f"\n--- Checking DB: {db_name} ---")
            coll = db["land_parcels"]
            cursor = coll.find({})
            async for doc in cursor:
                farmer_id = doc.get("farmer_id")
                is_active = doc.get("is_active")
                if farmer_id is None:
                    print(f"FOUND NULL/MISSING farmer_id in DB '{db_name}': doc_id={doc['_id']}, is_active={is_active}")
                elif not isinstance(farmer_id, (str, bytes)) and not hasattr(farmer_id, "binary"):
                    # Check if it's some other weird type
                    print(f"FOUND WEIRD farmer_id TYPE in DB '{db_name}': doc_id={doc['_id']}, type={type(farmer_id)}, value={farmer_id}")
                else:
                    # Let's print normal ones too
                    print(f"Normal doc: doc_id={doc['_id']}, farmer_id={farmer_id} ({type(farmer_id)})")

if __name__ == "__main__":
    asyncio.run(main())
