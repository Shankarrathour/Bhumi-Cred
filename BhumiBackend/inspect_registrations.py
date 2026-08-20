import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.farmer import Farmer
from app.repositories.registration import BhumiCredRegistrationRepository
from app.models.registration import BhumiCredRegistration

async def check_regs():
    client = AsyncIOMotorClient("mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi")
    db = client.bhumi
    # Note: We need to register the Beanie documents
    await init_beanie(database=db, document_models=[BhumiCredRegistration, Farmer])

    farmer = await Farmer.find_one(Farmer.mobile == "8319923449")
    if not farmer:
        print("Shankar Rathore not found")
        return

    regs = await BhumiCredRegistration.find(BhumiCredRegistration.farmer_id == str(farmer.id)).to_list()
    print(f"Total registrations for Shankar: {len(regs)}")
    for r in regs:
        print(f"ID: {r.id}")
        print(f"  status: {r.status}")
        print(f"  current_step: {r.current_step}")
        print(f"  total_area: {r.total_area}")
        print(f"  calculated_area (acre): {r.calculated_area.acre if r.calculated_area else 'None'}")
        print(f"  created_at: {r.created_at}")

if __name__ == "__main__":
    asyncio.run(check_regs())
