import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient('mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi')
    db = client.bhumi
    
    result = await db.farmers.update_many(
        {},
        {'$set': {'wallet_balance': 0.0}}
    )
    print(f"Updated {result.modified_count} farmers, resetting wallet_balance to 0.0")

if __name__ == '__main__':
    asyncio.run(run())
