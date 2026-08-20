import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.farmer import Farmer
from app.models.wallet import Wallet, WalletTransaction

async def cleanup_wallet():
    client = AsyncIOMotorClient("mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi")
    db = client.bhumi
    await init_beanie(database=db, document_models=[Farmer, Wallet, WalletTransaction])

    farmer = await Farmer.find_one(Farmer.mobile == "8319923449")
    if not farmer:
        print("Shankar Rathore not found")
        return

    print(f"Found Farmer: {farmer.full_name} (ID: {farmer.id})")
    
    # 1. Reset Wallet
    wallet = await Wallet.find_one(Wallet.farmer_id == str(farmer.id))
    if wallet:
        wallet.balance = 0.0
        wallet.total_earnings = 0.0
        wallet.total_withdrawn = 0.0
        await wallet.save()
        print("Reset wallet balance, earnings, and withdrawals to 0.0.")

    # 2. Clear all mock transactions
    deleted = await WalletTransaction.find(WalletTransaction.farmer_id == str(farmer.id)).delete()
    print(f"Deleted transaction records from database.")

if __name__ == "__main__":
    asyncio.run(cleanup_wallet())
