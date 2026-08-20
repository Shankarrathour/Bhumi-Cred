import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.farmer import Farmer
from app.models.wallet import Wallet, WalletTransaction

async def check_wallet():
    client = AsyncIOMotorClient("mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi")
    db = client.bhumi
    await init_beanie(database=db, document_models=[Farmer, Wallet, WalletTransaction])

    farmer = await Farmer.find_one(Farmer.mobile == "8319923449")
    if not farmer:
        print("Shankar Rathore not found")
        return

    print(f"Farmer ID: {farmer.id}")
    wallet = await Wallet.find_one(Wallet.farmer_id == str(farmer.id))
    if not wallet:
        print("Wallet not found for Shankar")
    else:
        print(f"Wallet Balance: {wallet.balance}")
        print(f"Total Earnings: {wallet.total_earnings}")
        print(f"Total Withdrawn: {wallet.total_withdrawn}")

    txs = await WalletTransaction.find(WalletTransaction.farmer_id == str(farmer.id)).to_list()
    print(f"\nTotal transactions found for Shankar in DB: {len(txs)}")
    for t in txs:
        print(f"Txn ID: {t.id}")
        print(f"  Amount: {t.amount}")
        print(f"  Type: {t.type}")
        print(f"  Status: {t.status}")
        print(f"  Description: {t.description}")
        print(f"  Created At: {t.created_at}")

if __name__ == "__main__":
    asyncio.run(check_wallet())
