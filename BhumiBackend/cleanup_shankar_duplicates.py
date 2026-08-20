import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from app.models.farmer import Farmer
from app.models.land_parcel import LandParcel

async def cleanup():
    client = AsyncIOMotorClient("mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi")
    db = client.bhumi
    await init_beanie(database=db, document_models=[Farmer, LandParcel])

    # Delete the duplicate land parcel with ID 6a86c00cacf0ed2270c5152b
    parcel = await LandParcel.get(ObjectId("6a86c00cacf0ed2270c5152b"))
    if parcel:
        await parcel.delete()
        print("Successfully deleted duplicate land parcel (50 Acres, ID=6a86c00cacf0ed2270c5152b)")
    else:
        print("Land parcel not found or already deleted")

if __name__ == "__main__":
    asyncio.run(cleanup())
