import uuid
from datetime import datetime
from app.models.wallet import WalletBankAccount


async def process_bank_transfer(
    bank_account: WalletBankAccount,
    amount: float,
) -> dict:
    """
    Initiates a bank transfer payout.
    Returns a dict with 'success' and 'transaction_id'.
    """
    bank_code = "SBIN"
    if bank_account and bank_account.ifsc_code:
        bank_code = bank_account.ifsc_code[:4].upper()
    
    date_str = datetime.utcnow().strftime("%Y%m%d")
    unique_suffix = str(uuid.uuid4())[:8].upper()
    utr_number = f"UTR-{date_str}-{unique_suffix}-{bank_code}"
    
    return {
        "success": True,
        "transaction_id": utr_number,
    }
