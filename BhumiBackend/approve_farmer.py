import asyncio
import os
import sys

# Ensure backend root is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.config.settings import settings
from app.models.farmer import Farmer, KYCStatus

async def main():
    print("=== Bhumi Farmer Auto-Approval Script ===")
    print("Connecting to MongoDB...")
    
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    
    try:
        await init_beanie(
            database=db,
            document_models=[Farmer]
        )
        print("[SUCCESS] Beanie initialized for farmers collection.")
        
        # Fetch all farmers
        farmers = await Farmer.find_all().to_list()
        print(f"Found {len(farmers)} farmer accounts in the database.")
        
        for f in farmers:
            if f.kyc_status != KYCStatus.APPROVED:
                f.kyc_status = KYCStatus.APPROVED
                await f.save()
                print(f"Approved KYC for Farmer: {f.full_name or 'Unnamed'} (Mobile: {f.mobile})")
            else:
                print(f"Farmer {f.full_name or 'Unnamed'} (Mobile: {f.mobile}) is already APPROVED.")
                
        print("\n[COMPLETE] All farmers have been verified and approved!")
    except Exception as e:
        print(f"[ERROR] Failed to run approval script: {e}")

if __name__ == "__main__":
    asyncio.run(main())
