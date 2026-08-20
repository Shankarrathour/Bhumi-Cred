import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.models.farmer import Farmer
from app.models.land_parcel import LandParcel
from app.models.project_enrollment import ProjectEnrollment
from app.models.sustainability_project import SustainabilityProject
from app.models.green_family import GreenFamilyCover
from app.models.tree_registration import TreeRegistration
from app.models.farmer_activity import FarmerActivityLog
from app.routes.admin_farmers import get_farmer_activity
from app.models.admin_user import AdminUser
from app.models.order import Order
from app.models.wallet import WithdrawalRequest

async def test_timeline():
    client = AsyncIOMotorClient("mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi")
    db = client.bhumi
    await init_beanie(database=db, document_models=[Farmer, LandParcel, ProjectEnrollment, SustainabilityProject, GreenFamilyCover, TreeRegistration, FarmerActivityLog, AdminUser, Order, WithdrawalRequest])

    farmer = await Farmer.find_one(Farmer.mobile == "8319923449")
    if not farmer:
        print("Shankar Rathore not found")
        return

    admin = await AdminUser.find_one()

    # Simulate get_farmer_activity
    res = await get_farmer_activity(str(farmer.id), current_admin=admin)
    print("DEDUPLICATED TIMELINE ITEMS FOR SHANKAR:")
    for idx, item in enumerate(res.data):
        print(f"Item {idx + 1}:")
        safe_title = item.title.encode("ascii", "ignore").decode()
        safe_desc = (item.description or "").encode("ascii", "ignore").decode()
        print(f"  Title: {safe_title}")
        print(f"  Description: {safe_desc}")
        print(f"  Type: {item.activity_type}")
        print(f"  Time: {item.timestamp}")

if __name__ == "__main__":
    asyncio.run(test_timeline())
