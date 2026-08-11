import asyncio
import os
import sys
import json
from bson import json_util

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config.settings import settings
from app.models.farmer import Farmer

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    await init_beanie(database=db, document_models=[Farmer])
    
    # We find Shankar Rathore
    f = await Farmer.find_one(Farmer.mobile == "8319923449")
    if f:
        print("Shankar Rathore document:")
        print(json.dumps(json.loads(json_util.dumps(f.model_dump())), indent=2))
    else:
        print("Shankar Rathore not found.")

if __name__ == "__main__":
    asyncio.run(main())
