import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.models.farmer import Farmer
from app.models.land_parcel import LandParcel
from app.models.project_enrollment import ProjectEnrollment
from app.models.green_family import GreenFamilyCover
from app.homescreen.services import EcologicalService
from app.homescreen.repositories import MilestoneRepository
from app.repositories.farmer import FarmerRepository
from app.repositories.project_enrollment import ProjectEnrollmentRepository

async def test_svc():
    client = AsyncIOMotorClient("mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi")
    db = client.bhumi
    await init_beanie(database=db, document_models=[Farmer, LandParcel, ProjectEnrollment, GreenFamilyCover])

    farmer = await Farmer.find_one(Farmer.mobile == "8319923449")
    print(f"Farmer: {farmer.full_name}, KYC Status: {farmer.kyc_status}")
    
    svc = EcologicalService(
        milestone_repo=MilestoneRepository(),
        farmer_repo=FarmerRepository(),
        enrollment_repo=ProjectEnrollmentRepository()
    )

    journey = await svc.get_journey_map(farmer)
    print("\nJOURNEY MAP FOR SHANKAR:")
    for step in journey:
        print(f"Step {step.step_number}: {step.name} ({step.id}) -> Status: {step.status}, Desc: {step.description}")

if __name__ == "__main__":
    asyncio.run(test_svc())
