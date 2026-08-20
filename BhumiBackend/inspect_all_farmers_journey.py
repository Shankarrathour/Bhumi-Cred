import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.models.farmer import Farmer
from app.models.land_parcel import LandParcel
from app.models.project_enrollment import ProjectEnrollment
from app.models.green_family import GreenFamilyCover
from app.models.tree_registration import TreeRegistration
from app.models.sustainability_project import SustainabilityProject
from app.homescreen.services import EcologicalService
from app.homescreen.repositories import MilestoneRepository
from app.repositories.farmer import FarmerRepository
from app.repositories.project_enrollment import ProjectEnrollmentRepository

async def test_svc():
    client = AsyncIOMotorClient("mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi")
    db = client.bhumi
    await init_beanie(database=db, document_models=[Farmer, LandParcel, ProjectEnrollment, GreenFamilyCover, TreeRegistration, SustainabilityProject])

    farmers = await Farmer.find(Farmer.is_deleted == False).to_list()
    
    svc = EcologicalService(
        milestone_repo=MilestoneRepository(),
        farmer_repo=FarmerRepository(),
        enrollment_repo=ProjectEnrollmentRepository()
    )

    for farmer in farmers:
        journey = await svc.get_journey_map(farmer)
        # Check if steps 3, 4, 5 are completed
        step3 = next(s for s in journey if s.id == "step_land")
        step4 = next(s for s in journey if s.id == "step_plantation")
        step5 = next(s for s in journey if s.id == "step_family")
        step6 = next(s for s in journey if s.id == "step_score")
        
        if step3.status == "completed" or step4.status == "completed" or step5.status == "completed":
            print(f"Farmer: {farmer.full_name or farmer.mobile} (KYC: {farmer.kyc_status})")
            print(f"  Land Approved: {step3.status}")
            print(f"  Plantation Added: {step4.status}")
            print(f"  Green Family: {step5.status}")
            print(f"  Score: {step6.status}")

if __name__ == "__main__":
    asyncio.run(test_svc())
