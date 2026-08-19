import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config.settings import settings
from app.models.farmer import Farmer
from app.models.land_parcel import LandParcel
from app.schemas.land import AdminLandVerificationItem

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    await init_beanie(database=db, document_models=[Farmer, LandParcel])
    
    parcels = await LandParcel.find_all().to_list()
    print(f"Total parcels: {len(parcels)}")
    for p in parcels:
        print(f"Parcel ID: {p.id}, Farmer ID: {p.farmer_id}, Type of farmer_id: {type(p.farmer_id)}")
        
        # Test converting to schema
        try:
            item = AdminLandVerificationItem(
                id=str(p.id),
                farmer_id=str(p.farmer_id),
                farmer_public_id="FAR-001",
                farmer_name="Test",
                farmer_mobile="9999999999",
                survey_number=p.survey_number,
                area_acres=p.area_acres,
                ownership_type=p.ownership_type,
                is_irrigated=p.is_irrigated,
                belongs_to_another_person=p.belongs_to_another_person,
                fathers_name=p.fathers_name,
                country=p.country,
                state=p.state,
                district=p.district,
                city=p.city,
                gram_panchayat=p.gram_panchayat,
                vikash_khand=p.vikash_khand,
                tehsil=p.tehsil,
                village=p.village,
                full_address=p.full_address,
                landmark=p.landmark,
                coordinates=p.coordinates,
                boundary_polygon=p.boundary_polygon,
                crop_type=p.crop_type,
                soil_type=p.soil_type,
                soil_organic_carbon=p.soil_organic_carbon,
                tree_stock_count=p.tree_stock_count,
                plantation_area_acres=p.plantation_area_acres,
                agroforestry_species=p.agroforestry_species,
                land_document_url=p.land_document_url,
                land_photo_urls=p.land_photo_urls,
                verification_status=p.verification_status,
                verification_remarks=p.verification_remarks,
                verified_at=p.verified_at,
                created_at=p.created_at,
                updated_at=p.updated_at,
                history=[]
            )
            print("Successfully validated schema for parcel:", p.id)
        except Exception as e:
            print("Schema validation failed for parcel:", p.id)
            print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
