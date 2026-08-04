import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pprint import pprint

async def run():
    client = AsyncIOMotorClient('mongodb://127.0.0.1:27017')
    db = client.bhumi
    enrollments = await db.ProjectEnrollment.find({}).to_list(None)
    for e in enrollments:
        print(e.get("farmer_id"), e.get("project_id"), e.get("current_stage"), e.get("progress_percent"), e.get("registered_trees"))

if __name__ == '__main__':
    asyncio.run(run())
