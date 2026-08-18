import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def inspect_shankar():
    client = AsyncIOMotorClient('mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi')
    db = client.bhumi
    parcels = await db.land_parcels.find({"survey_number": "BCR-20260817-93269"}).to_list(None)
    if not parcels:
        parcels = await db.land_parcels.find({"area_acres": 4.1}).to_list(None)
    for p in parcels:
        print("DOCUMENT:")
        for k, v in p.items():
            print(f"  {k}: {v}")

if __name__ == '__main__':
    asyncio.run(inspect_shankar())
