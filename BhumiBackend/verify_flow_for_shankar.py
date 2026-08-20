import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.models.farmer import Farmer, KYCStatus
from app.models.land_parcel import LandParcel, LandVerificationStatus
from app.models.project_enrollment import ProjectEnrollment
from app.models.sustainability_project import SustainabilityProject
from app.models.green_family import GreenFamilyCover
from app.models.tree_registration import TreeRegistration
from app.models.notification import Notification
from app.services.admin_farmer_service import AdminFarmerService
from app.homescreen.services import EcologicalService
from app.homescreen.repositories import MilestoneRepository
from app.repositories.farmer import FarmerRepository
from app.repositories.family_member import FamilyMemberRepository
from app.repositories.land_parcel import LandParcelRepository
from app.repositories.audit_log import AuditLogRepository
from app.repositories.project_enrollment import ProjectEnrollmentRepository
from app.services.notification_service import NotificationService
from app.repositories.notification import NotificationRepository
from app.schemas.land import AdminLandVerificationRequest

async def verify_flow():
    client = AsyncIOMotorClient("mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi")
    db = client.bhumi
    await init_beanie(database=db, document_models=[Farmer, LandParcel, ProjectEnrollment, SustainabilityProject, GreenFamilyCover, TreeRegistration, Notification])

    # 1. Fetch Shankar Rathore
    farmer = await Farmer.find_one(Farmer.mobile == "8319923449")
    if not farmer:
        print("Shankar Rathore not found")
        return
    print(f"Initial: Farmer={farmer.full_name}, KYC={farmer.kyc_status}, Total Acreage={farmer.total_acreage}")

    # Reset KYC to pending so we can test dynamic updates
    farmer.kyc_status = KYCStatus.PENDING
    await farmer.save()

    # 2. Find land parcel with area_acres 4.1 and assign it to Shankar
    parcel = await LandParcel.find_one(LandParcel.farmer_id == str(farmer.id))
    if not parcel:
        parcel = await LandParcel.find_one(LandParcel.area_acres == 4.1)
        if parcel:
            parcel.farmer_id = str(farmer.id)
            await parcel.save()
            print(f"Associated existing 4.1 acre land parcel with Shankar Rathore (ID={farmer.id})")
        else:
            print("No land parcel found in DB. Creating one...")
            parcel = LandParcel(
                farmer_id=str(farmer.id),
                survey_number="BCR-20260817-93269",
                area_acres=4.1,
                ownership_type="own",
                state="Madhya Pradesh",
                district="Bhopal",
                village="Kothri",
                crop_type="Wheat, Soybean",
                soil_type="Black Soil",
                verification_status=LandVerificationStatus.PENDING,
            )
            await parcel.insert()

    parcel.verification_status = LandVerificationStatus.PENDING
    parcel.verified_at = None
    await parcel.save()
    print(f"Reset: Land Parcel ID={parcel.id}, Verification Status={parcel.verification_status}")

    # 3. Delete existing project enrollment for Shankar to verify auto-enrollment
    enrollments = await ProjectEnrollment.find(ProjectEnrollment.farmer_id == str(farmer.id)).to_list()
    for e in enrollments:
        await e.delete()
    print("Deleted old project enrollments.")

    # 4. Instantiate AdminFarmerService
    admin_svc = AdminFarmerService(
        farmer_repo=FarmerRepository(),
        family_repo=FamilyMemberRepository(),
        land_repo=LandParcelRepository(),
        audit_repo=AuditLogRepository(),
        notification_service=NotificationService(repo=NotificationRepository()),
    )

    # 5. Approve land parcel from admin side (sends 'approved')
    req = AdminLandVerificationRequest(status="approved", remarks="Verified through simulation script")
    result = await admin_svc.verify_land_parcel(str(parcel.id), req)
    print(f"Admin approved land parcel. New Status={result.verification_status}")

    # 6. Fetch updated land parcel and farmer
    updated_parcel = await LandParcel.get(parcel.id)
    updated_farmer = await Farmer.get(farmer.id)
    print(f"Post-approval: Land Parcel Status={updated_parcel.verification_status}, Verified At={updated_parcel.verified_at}")
    print(f"Post-approval: Farmer Total Acreage={updated_farmer.total_acreage}")

    # 7. Check if ProjectEnrollment was created
    new_enrollment = await ProjectEnrollment.find_one(ProjectEnrollment.farmer_id == str(farmer.id))
    if new_enrollment:
        print(f"Success: ProjectEnrollment auto-created! Project ID={new_enrollment.project_id}, Status={new_enrollment.status}")
    else:
        print("Failure: ProjectEnrollment was NOT created.")

    # 8. Check Journey Map steps
    eco_svc = EcologicalService(
        milestone_repo=MilestoneRepository(),
        farmer_repo=FarmerRepository(),
        enrollment_repo=ProjectEnrollmentRepository()
    )
    journey = await eco_svc.get_journey_map(updated_farmer)
    print("\nDYNAMIC JOURNEY MAP FOR SHANKAR:")
    for step in journey:
        print(f"Step {step.step_number}: {step.name} -> Status: {step.status}, Desc: {step.description}")

if __name__ == "__main__":
    asyncio.run(verify_flow())
