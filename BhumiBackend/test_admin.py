import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.tree_registration import TreeRegistration
from app.models.farmer import Farmer
from app.repositories.tree_registration import TreeRegistrationRepository
from app.repositories.farmer import FarmerRepository
from app.services.tree_registration_service import TreeRegistrationService
from app.config.settings import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    await init_beanie(database=client[settings.DATABASE_NAME], document_models=[TreeRegistration, Farmer])
    
    repo = TreeRegistrationRepository()
    farmer_repo = FarmerRepository()
    svc = TreeRegistrationService(repo, farmer_repo)
    
    try:
        data, total = await svc.get_all_registrations(0, 10, None)
        print(f"Success! Total: {total}")
        for item in data:
            print(f" - {item.id} | {item.tree_details.tree_name} | {item.farmer_details.full_name}")
    except Exception as e:
        print("ERROR OCCURRED:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
