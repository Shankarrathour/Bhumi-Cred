import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["bhumi"]
    count = await db.products.count_documents({})
    print(f"Products count: {count}")
    products = await db.products.find().to_list(10)
    print([p.get("name") for p in products])

asyncio.run(main())
