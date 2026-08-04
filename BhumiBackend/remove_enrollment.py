import asyncio
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    uri = "mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi"
    client = AsyncIOMotorClient(uri)
    db = client.bhumi
    
    farmer_id_str = "6A4F68D008DB71582F258593"
    try:
        farmer_id_obj = ObjectId(farmer_id_str)
    except Exception as e:
        print(f"Invalid ObjectId: {e}")
        farmer_id_obj = farmer_id_str # fallback if it's stored as string

    project_id = "DAFGBHJF"
    
    # 1. Check if farmer exists
    farmer = await db.farmers.find_one({"_id": farmer_id_obj})
    if farmer:
        print(f"Farmer exists! Acreage: {farmer.get('total_acreage')}")
    else:
        print("Farmer not found by ObjectId.")
        farmer_str = await db.farmers.find_one({"_id": farmer_id_str})
        if farmer_str:
            print("Farmer found by string _id")
        else:
            print("Farmer truly not found.")
            
    # 2. Delete enrollment
    # The enrollment model uses `farmer_id: str` so it's stored as string.
    res = await db.project_enrollments.delete_many({
        "farmer_id": farmer_id_str,
        "project_id": project_id
    })
    print(f"Deleted {res.deleted_count} enrollments.")
    
    # 3. Find another farmer not in project
    enrolled_ids = await db.project_enrollments.distinct("farmer_id", {"project_id": project_id})
    # Convert those strings to ObjectIds to query farmers
    enrolled_obj_ids = [ObjectId(id_str) for id_str in enrolled_ids if len(id_str) == 24]
    
    available_farmer = await db.farmers.find_one({
        "_id": {"$nin": enrolled_obj_ids},
        "total_acreage": {"$gte": 4.5}
    })
    
    if available_farmer:
        print(f"Another valid farmer ID you can use: {str(available_farmer['_id'])}")
    else:
        print("No other valid farmer found with >= 4.5 acres.")

    client.close()

if __name__ == "__main__":
    asyncio.run(main())
