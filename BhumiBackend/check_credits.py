import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient('mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi')
    db = client.bhumi
    farmers = await db.farmers.find({}).to_list(None)
    for f in farmers:
        print(f.get("mobile"), "Credits:", f.get("carbon_credits_generated"), "Wallet:", f.get("wallet_balance"))

if __name__ == '__main__':
    asyncio.run(run())
