import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.farmer import Farmer
from app.models.project_enrollment import ProjectEnrollment
from app.config.settings import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    await init_beanie(database=client[settings.DATABASE_NAME], document_models=[Farmer, ProjectEnrollment])
    
    # Get all project enrollments
    enrollments = await ProjectEnrollment.find_all().to_list()
    for enrollment in enrollments:
        farmer = await Farmer.get(enrollment.farmer_id)
        if farmer and enrollment.registered_trees != farmer.total_trees:
            print(f"Updating enrollment for {farmer.full_name}: {enrollment.registered_trees} -> {farmer.total_trees}")
            enrollment.registered_trees = farmer.total_trees
            await enrollment.save()
            
    print("Done updating enrollment totals.")

if __name__ == "__main__":
    asyncio.run(main())
