import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config.settings import settings
from app.models.farmer import Farmer
from app.models.land_parcel import LandParcel
from app.models.admin_user import AdminUser
from app.models.project_enrollment import ProjectEnrollment
from app.repositories.farmer import FarmerRepository
from app.repositories.land_parcel import LandParcelRepository
from app.repositories.audit_log import AuditLogRepository
from app.services.admin_farmer_service import AdminFarmerService
from app.services.notification_service import NotificationService
from app.schemas.common import SuccessResponse
from app.schemas.land import AdminLandVerificationItem

class MockNotificationService:
    pass

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    await init_beanie(database=db, document_models=[Farmer, LandParcel, AdminUser, ProjectEnrollment])
    
    farmer_repo = FarmerRepository()
    land_repo = LandParcelRepository()
    audit_repo = AuditLogRepository()
    notif_svc = MockNotificationService()
    
    svc = AdminFarmerService(
        farmer_repo=farmer_repo,
        family_repo=None,
        land_repo=land_repo,
        audit_repo=audit_repo,
        notification_service=notif_svc
    )
    
    try:
        data = await svc.list_land_verification_queue()
        print("Retrieved data queue successfully. Length:", len(data))
        
        # Now try to serialize using SuccessResponse[list[AdminLandVerificationItem]]
        wrapper = SuccessResponse[list[AdminLandVerificationItem]](
            message="Retrieved successfully",
            data=data
        )
        print("Serialized to wrapper successfully!")
        
        # Try JSON dump / validation
        dumped = wrapper.model_dump_json()
        print("model_dump_json() succeeded!")
    except Exception as e:
        print("EXCEPTION OCCURRED DURING SERIALIZATION:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
