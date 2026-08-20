import asyncio
from datetime import datetime, timezone, timedelta
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.farmer import Farmer
from app.models.wallet import Wallet, WalletTransaction, TransactionType, TransactionStatus

async def seed_wallet_transactions():
    client = AsyncIOMotorClient("mongodb+srv://bhumi:bhumi1234@bhumi.mjsidus.mongodb.net/?appName=bhumi")
    db = client.bhumi
    await init_beanie(database=db, document_models=[Farmer, Wallet, WalletTransaction])

    farmer = await Farmer.find_one(Farmer.mobile == "8319923449")
    if not farmer:
        print("Shankar Rathore not found")
        return

    print(f"Found Farmer: {farmer.full_name} (ID: {farmer.id})")
    
    # 1. Get or create wallet
    wallet = await Wallet.find_one(Wallet.farmer_id == str(farmer.id))
    if not wallet:
        print("Creating new wallet...")
        wallet = Wallet(
            farmer_id=str(farmer.id),
            balance=0.0,
            total_earnings=0.0,
            total_withdrawn=0.0
        )
        await wallet.insert()
    
    # Reset wallet balances to match seeded transactions
    wallet.balance = 5000.0
    wallet.total_earnings = 7000.0
    wallet.total_withdrawn = 2000.0
    wallet.updated_at = datetime.now(timezone.utc)
    await wallet.save()
    print("Updated wallet balance and earnings.")

    # 2. Clear old transactions to avoid duplicates
    await WalletTransaction.find(WalletTransaction.farmer_id == str(farmer.id)).delete()
    print("Cleared existing transactions for Shankar.")

    # 3. Create transactions
    now = datetime.now(timezone.utc)
    
    # Transaction 1: Credit
    tx1 = WalletTransaction(
        farmer_id=str(farmer.id),
        wallet_id=str(wallet.id),
        amount=5200.0,
        type=TransactionType.CREDIT,
        status=TransactionStatus.COMPLETED,
        description="Sold 45 CO₂e Carbon Credits",
        created_at=now - timedelta(days=5),
        updated_at=now - timedelta(days=5)
    )
    await tx1.insert()

    # Transaction 2: Credit
    tx2 = WalletTransaction(
        farmer_id=str(farmer.id),
        wallet_id=str(wallet.id),
        amount=1800.0,
        type=TransactionType.CREDIT,
        status=TransactionStatus.COMPLETED,
        description="Eco-reward for Sustainable Tillage",
        created_at=now - timedelta(days=3),
        updated_at=now - timedelta(days=3)
    )
    await tx2.insert()

    # Transaction 3: Debit (Withdrawal)
    tx3 = WalletTransaction(
        farmer_id=str(farmer.id),
        wallet_id=str(wallet.id),
        amount=2000.0,
        type=TransactionType.DEBIT,
        status=TransactionStatus.COMPLETED,
        description="Withdrawal Payout (UPI Transfer)",
        created_at=now - timedelta(days=1),
        updated_at=now - timedelta(days=1)
    )
    await tx3.insert()

    print("Seeded 3 transactions successfully!")
    print(f"Final Wallet Balance: {wallet.balance}")

if __name__ == "__main__":
    asyncio.run(seed_wallet_transactions())
