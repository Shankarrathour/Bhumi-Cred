import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.tree_registration import TreeRegistration
from app.models.farmer import Farmer
from app.config.settings import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    await init_beanie(database=client[settings.DATABASE_NAME], document_models=[TreeRegistration, Farmer])
    
    # Get all farmers
    farmers = await Farmer.find_all().to_list()
    for farmer in farmers:
        # Sum trees from tree_registrations for this farmer
        pipeline = [
            {"$match": {"farmer_id": str(farmer.id)}},
            {"$group": {"_id": None, "total": {"$sum": "$tree_count"}}}
        ]
        result = await TreeRegistration.aggregate(pipeline).to_list(1)
        total_registered = result[0]["total"] if result else 0
        
        if farmer.total_trees != total_registered:
            print(f"Updating farmer {farmer.full_name}: {farmer.total_trees} -> {total_registered}")
            farmer.total_trees = total_registered
            await farmer.save()
            
    print("Done updating farmer totals.")

if __name__ == "__main__":
    asyncio.run(main())
