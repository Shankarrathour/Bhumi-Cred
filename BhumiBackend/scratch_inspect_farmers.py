import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def inspect_farmers():
    client = AsyncIOMotorClient('mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi')
    db = client.bhumi
    farmers = await db.farmers.find({}).to_list(None)
    for f in farmers:
        print("Name:", f.get("full_name"), "| Mobile:", f.get("mobile"), "| KYC Status:", f.get("kyc_status"), "| Role:", f.get("role"))

if __name__ == '__main__':
    asyncio.run(inspect_farmers())
