import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.farmer import Farmer
from app.models.project_enrollment import ProjectEnrollment

async def check_enrollments():
    client = AsyncIOMotorClient("mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi")
    db = client.bhumi
    await init_beanie(database=db, document_models=[Farmer, ProjectEnrollment])

    farmer = await Farmer.find_one(Farmer.mobile == "8319923449")
    if not farmer:
        print("Shankar Rathore not found")
        return

    enrollments = await ProjectEnrollment.find(ProjectEnrollment.farmer_id == str(farmer.id)).to_list()
    print(f"Total project enrollments found for Shankar in DB: {len(enrollments)}")
    for e in enrollments:
        print(f"ID: {e.id}")
        print(f"  project_id: {e.project_id}")
        print(f"  status: {e.status}")
        print(f"  is_active: {e.is_active}")
        print(f"  joined_at: {e.joined_at}")
        print(f"  created_at: {getattr(e, 'created_at', 'N/A')}")
        print(f"  updated_at: {e.updated_at}")

if __name__ == "__main__":
    asyncio.run(check_enrollments())
