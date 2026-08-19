import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.config.settings import settings
from app.models.tree_plan import TreePlan

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    await init_beanie(database=db, document_models=[TreePlan])
    plans = await TreePlan.find_all().to_list()
    print("ALL PLANS IN DB:")
    for p in plans:
        print(f"ID: {p.id} | Type: {p.plan_type} | Name: {p.plan_name} | Price: {p.price} | Cover: {p.cover}")

if __name__ == "__main__":
    asyncio.run(main())
