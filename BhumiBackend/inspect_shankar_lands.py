import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.farmer import Farmer
from app.models.land_parcel import LandParcel

async def check_lands():
    client = AsyncIOMotorClient("mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi")
    db = client.bhumi
    await init_beanie(database=db, document_models=[Farmer, LandParcel])

    farmer = await Farmer.find_one(Farmer.mobile == "8319923449")
    if not farmer:
        print("Shankar Rathore not found")
        return

    parcels = await LandParcel.find(LandParcel.farmer_id == str(farmer.id)).to_list()
    print(f"Total land parcels found for Shankar in DB: {len(parcels)}")
    for p in parcels:
        print(f"ID: {p.id}")
        print(f"  Name: {p.name}")
        print(f"  survey_number: {p.survey_number}")
        print(f"  area_acres: {p.area_acres}")
        print(f"  village: {p.village}")
        print(f"  verification_status: {p.verification_status}")
        print(f"  is_active: {p.is_active}")
        print(f"  is_deleted: {p.is_deleted}")
        print(f"  created_at: {p.created_at}")

if __name__ == "__main__":
    asyncio.run(check_lands())
