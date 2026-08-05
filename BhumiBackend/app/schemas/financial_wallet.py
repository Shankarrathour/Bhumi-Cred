from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from beanie import PydanticObjectId
from app.models.financial_wallet import AccountType, TransactionType, TransactionCategory, PayoutStatus, SettlementStatus, BankAccount


class WalletCreateSchema(BaseModel):
    user_id: PydanticObjectId
    account_type: AccountType = AccountType.FARMER
    currency: str = "INR"
    bank_account: Optional[BankAccount] = None


class WalletTopupSchema(BaseModel):
    amount: float = Field(..., gt=0)
    gateway_tx_id: str = Field(..., min_length=3)
    category: TransactionCategory = TransactionCategory.TOPUP
    description: str = "Wallet credit top-up"


class WalletWithdrawalSchema(BaseModel):
    amount: float = Field(..., gt=0)
    payout_method: str = "UPI"
    bank_account: BankAccount


class WalletResponseSchema(BaseModel):
    id: str
    wallet_id: str
    user_id: PydanticObjectId
    account_type: AccountType
    currency: str
    balance: float
    pending_credits: float
    total_withdrawn: float
    is_locked: bool
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WalletTransactionResponseSchema(BaseModel):
    id: str
    transaction_id: str
    wallet_id: PydanticObjectId
    user_id: PydanticObjectId
    type: TransactionType
    amount: float
    currency: str
    category: TransactionCategory
    reference_id: Optional[str] = None
    description: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
