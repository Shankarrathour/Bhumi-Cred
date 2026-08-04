import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient('mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi')
    db = client.bhumi
    enrollments = await db.project_enrollments.find({}).to_list(None)
    for e in enrollments:
        print(f"Farmer: {e.get('farmer_id')}, Proj: {e.get('project_id')}, Stage: {e.get('current_stage')}, Impact: {e.get('estimated_carbon_impact')}")

if __name__ == '__main__':
    asyncio.run(run())
