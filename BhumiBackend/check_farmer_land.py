import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.farmer import Farmer
from app.models.land_parcel import LandParcel
from app.config.settings import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    await init_beanie(database=client[settings.DATABASE_NAME], document_models=[Farmer, LandParcel])
    
    farmer = await Farmer.find_one({"mobile": "9343259782"})
    if not farmer:
        print("Farmer not found")
        return
        
    print(f"Farmer ID: {farmer.id}")
    print(f"Farmer total_acreage: {farmer.total_acreage}")
    
    parcels = await LandParcel.find({"farmer_id": str(farmer.id)}).to_list()
    print(f"Number of land parcels: {len(parcels)}")
    total = sum(p.area_acres for p in parcels)
    print(f"Sum of land parcels: {total}")

if __name__ == "__main__":
    asyncio.run(main())
