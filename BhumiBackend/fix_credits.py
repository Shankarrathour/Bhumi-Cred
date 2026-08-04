import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def run():
    client = AsyncIOMotorClient('mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi')
    db = client.bhumi
    
    enrollments = await db.project_enrollments.find({"current_stage": "completed"}).to_list(None)
    
    farmer_credits = {}
    farmer_wallet = {}
    
    for e in enrollments:
        fid = e["farmer_id"]
        impact = e.get("estimated_carbon_impact", 0)
        farmer_credits[fid] = farmer_credits.get(fid, 0) + impact
        farmer_wallet[fid] = farmer_wallet.get(fid, 0) + (impact * 400)
        
    for fid, credits in farmer_credits.items():
        wallet = farmer_wallet[fid]
        print(f"Updating {fid}: Credits={credits}, Wallet={wallet}")
        await db.farmers.update_one(
            {'_id': ObjectId(fid)},
            {'$set': {'carbon_credits_generated': credits, 'wallet_balance': wallet}}
        )
        
if __name__ == '__main__':
    asyncio.run(run())
