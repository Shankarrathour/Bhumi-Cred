import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.farmer import Farmer
from app.models.farmer_activity import FarmerActivityLog

async def check_logs():
    client = AsyncIOMotorClient("mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi")
    db = client.bhumi
    await init_beanie(database=db, document_models=[Farmer, FarmerActivityLog])

    farmer = await Farmer.find_one(Farmer.mobile == "8319923449")
    if not farmer:
        print("Shankar Rathore not found")
        return

    logs = await FarmerActivityLog.find(FarmerActivityLog.farmer_id == str(farmer.id)).to_list()
    print(f"Total activity logs found in FarmerActivityLog: {len(logs)}")
    for l in logs:
        print(f"ID: {l.id}")
        print(f"  activity_type: {l.activity_type}")
        print(f"  title: {l.title}")
        print(f"  description: {l.description}")
        print(f"  timestamp: {l.timestamp}")

if __name__ == "__main__":
    asyncio.run(check_logs())
