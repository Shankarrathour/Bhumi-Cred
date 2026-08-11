import asyncio
import os
import sys

# Ensure backend root is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config.settings import settings
from app.models.farmer import Farmer

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    await init_beanie(database=db, document_models=[Farmer])
    
    f = await Farmer.find_one(Farmer.mobile == "8319923449")
    if f:
        print(f"Farmer: ID={f.id}, Mobile={f.mobile}, FullName={f.full_name}")
        print(f"Identity Type: {f.identity_type}")
        print(f"Identity Number: {f.identity_number}")
        print(f"id_proof_url: {f.id_proof_url}")
        
        id_details = f.identity_details
        if id_details:
            print("Identity Details Sub-document:")
            print(f"  aadhaar_number: {id_details.aadhaar_number}")
            print(f"  pan_number: {id_details.pan_number}")
            print(f"  aadhaar_url: {id_details.aadhaar_url}")
            print(f"  aadhaar_front_url: {id_details.aadhaar_front_url}")
            print(f"  aadhaar_back_url: {id_details.aadhaar_back_url}")
            print(f"  pan_url: {id_details.pan_url}")
            print(f"  pan_card_url: {id_details.pan_card_url}")
            print(f"  aadhaar_asset: {id_details.aadhaar_asset}")
            print(f"  pan_asset: {id_details.pan_asset}")
        else:
            print("identity_details is None")
    else:
        print("Farmer not found.")

if __name__ == "__main__":
    asyncio.run(main())
