import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.project_enrollment import ProjectEnrollment
from app.models.farmer import Farmer
from app.config.settings import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    await init_beanie(database=client[settings.DATABASE_NAME], document_models=[ProjectEnrollment, Farmer])

    enrollments = await ProjectEnrollment.find(
        {"is_active": True, "sustainability_score": {"$gt": 0}}
    ).to_list()
    for e in enrollments[:5]:
        farmer = await Farmer.get(e.farmer_id)
        print(f"farmer_id={e.farmer_id} mobile={farmer.mobile if farmer else 'N/A'} "
              f"enrollment.sustainability_score={e.sustainability_score} "
              f"farmer.sustainability_score={farmer.sustainability_score if farmer else 'N/A'}")

if __name__ == "__main__":
    asyncio.run(main())
