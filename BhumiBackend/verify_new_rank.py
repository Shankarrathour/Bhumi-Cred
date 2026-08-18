import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.models.farmer import Farmer
from app.models.land_parcel import LandParcel
from app.models.project_enrollment import ProjectEnrollment
from app.homescreen.services import EcologicalService
from app.homescreen.repositories import MilestoneRepository
from app.repositories.farmer import FarmerRepository
from app.repositories.project_enrollment import ProjectEnrollmentRepository

async def test_svc():
    client = AsyncIOMotorClient("mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi")
    db = client.bhumi
    await init_beanie(database=db, document_models=[Farmer, LandParcel, ProjectEnrollment])

    farmer = await Farmer.find_one(Farmer.mobile == "8319923449")
    
    svc = EcologicalService(
        milestone_repo=MilestoneRepository(),
        farmer_repo=FarmerRepository(),
        enrollment_repo=ProjectEnrollmentRepository()
    )

    overview = await svc.get_ecological_overview(farmer)
    print("DIRECT SERVICE OVERVIEW RESULT:")
    print("Eco Index:", overview.eco_index)
    print("CO2 Captures:", overview.co2_captures)
    print("District Green Rank:", overview.district_green_rank)
    print("Wallet Balance:", overview.wallet_balance)

if __name__ == "__main__":
    asyncio.run(test_svc())
