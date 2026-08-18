import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def update_p2():
    client = AsyncIOMotorClient('mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi')
    db = client.bhumi
    res = await db.land_parcels.update_one(
        {"_id": "6a82e021c8e0648ea797de32"},
        {"$set": {
            "tree_stock_count": 1250,
            "plantation_area_acres": 85.0
        }}
    )
    if res.modified_count == 0:
        res = await db.land_parcels.update_many(
            {"farmer_id": "6a82df19c8e0648ea797de27", "area_acres": 100.0},
            {"$set": {
                "tree_stock_count": 1250,
                "plantation_area_acres": 85.0
            }}
        )
    print("Updated Parcel #2 count:", res.modified_count)

if __name__ == '__main__':
    asyncio.run(update_p2())
