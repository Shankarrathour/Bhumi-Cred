"""
Payout service — dummy implementation.

This module is designed to be future-ready: swap the body of
process_bank_transfer() to integrate a real payout provider
(e.g. Razorpay Payout API, Cashfree Payouts, Decentro) without
changing any callers.
"""
from app.models.wallet import WalletBankAccount


async def process_bank_transfer(
    bank_account: WalletBankAccount,
    amount: float,
) -> dict:
    """
    Initiates a bank transfer payout.
    Returns a dict with 'success' and 'transaction_id'.
    """
    return {
        "success": True,
        "transaction_id": "DUMMY_TXN_001",
    }
