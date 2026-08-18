import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def inspect_p2():
    client = AsyncIOMotorClient('mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi')
    db = client.bhumi
    parcels = await db.land_parcels.find({"area_acres": 100.0}).to_list(None)
    for p in parcels:
        print("PARCEL 2 DOCUMENT:")
        for k, v in p.items():
            print(f"  {k}: {v}")

if __name__ == '__main__':
    asyncio.run(inspect_p2())
