import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
async def run():
    client = AsyncIOMotorClient('mongodb://127.0.0.1:27017')
    db = client.bhumicred
    res = await db.ProjectEnrollment.update_many(
        {}, 
        {'$set': {'current_stage': 'carbon_estimation', 'progress_percent': 85}}
    )
    print(f"{res.modified_count} enrollments reset")
if __name__ == '__main__':
    asyncio.run(run())
