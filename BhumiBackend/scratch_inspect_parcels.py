import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def inspect():
    client = AsyncIOMotorClient('mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi')
    db = client.bhumi
    parcels = await db.land_parcels.find({}).to_list(None)
    for p in parcels:
        print("ID:", p.get("_id"), "| Survey:", p.get("survey_number"), "| Acres:", p.get("area_acres"), "| Crop:", p.get("crop_type"), "| Soil:", p.get("soil_type"), "| Trees:", p.get("tree_stock_count"), "| Status:", p.get("verification_status"))

if __name__ == '__main__':
    asyncio.run(inspect())
