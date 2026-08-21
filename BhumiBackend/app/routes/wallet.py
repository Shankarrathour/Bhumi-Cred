from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.dependencies.auth import CurrentFarmer, VerifiedFarmer
from app.models.farmer import Farmer
from app.schemas.common import SuccessResponse
from app.schemas.farmer_profile import FarmerProfileResponse
from app.schemas.wallet import (
    AddBankAccountRequest,
    UpdateBankAccountRequest,
    AddUpiRequest,
    BankAccountResponse,
    TransactionResponse,
    CreateTransactionRequest,
    WalletResponse,
    WithdrawRequest,
    WithdrawalRequestResponse,
)
import logging

from app.services.farmer_profile_service import FarmerProfileService
from app.services.wallet_service import WalletService
from app.services.notification_service import NotificationService
from app.dependencies.services import get_farmer_profile_service, get_wallet_service, get_notification_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/farmer/wallet", tags=["Farmer Wallet"])


# ── Wallet overview ─────────────────────────────────────────────────────────

@router.get("", response_model=SuccessResponse[WalletResponse], summary="Get wallet overview")
async def get_wallet(
    current_farmer: CurrentFarmer,
    svc: WalletService = Depends(get_wallet_service),
) -> SuccessResponse[WalletResponse]:
    data = await svc.get_wallet(str(current_farmer.id))
    return SuccessResponse(message="Wallet fetched successfully.", data=data)


@router.post("/upi", response_model=SuccessResponse[WalletResponse], summary="Save UPI ID to wallet")
async def save_upi_id(
    payload: AddUpiRequest,
    current_farmer: CurrentFarmer,
    svc: WalletService = Depends(get_wallet_service),
) -> SuccessResponse[WalletResponse]:
    data = await svc.set_upi_id(str(current_farmer.id), payload.upi_id)
    return SuccessResponse(message="UPI ID saved successfully.", data=data)


@router.delete("/upi", response_model=SuccessResponse[WalletResponse], summary="Remove UPI ID from wallet")
async def remove_upi_id(
    current_farmer: CurrentFarmer,
    svc: WalletService = Depends(get_wallet_service),
) -> SuccessResponse[WalletResponse]:
    data = await svc.delete_upi_id(str(current_farmer.id))
    return SuccessResponse(message="UPI ID removed successfully.", data=data)


@router.get(
    "/transactions",
    response_model=SuccessResponse[list[TransactionResponse]],
    summary="Get wallet transaction history",
)
async def get_transactions(
    current_farmer: CurrentFarmer,
    svc: WalletService = Depends(get_wallet_service),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> SuccessResponse[list[TransactionResponse]]:
    items, _total = await svc.get_transactions(str(current_farmer.id), page=page, limit=limit)
    return SuccessResponse(message="Transactions fetched successfully.", data=items)


@router.post(
    "/transaction",
    response_model=SuccessResponse[TransactionResponse],
    summary="Record a payment or wallet transaction",
)
async def record_transaction(
    payload: CreateTransactionRequest,
    current_farmer: CurrentFarmer,
    svc: WalletService = Depends(get_wallet_service),
    notification_svc: NotificationService = Depends(get_notification_service),
) -> SuccessResponse[TransactionResponse]:
    tx = await svc.record_transaction(
        farmer_id=str(current_farmer.id),
        amount=payload.amount,
        description=payload.description,
        type_=payload.type or "debit",
        category=payload.category or "Tree Insurance & Land Fee",
        payment_method=payload.payment_method or "UPI",
        reference_id=payload.reference_id,
        status_=payload.status or "completed",
        bank_name=payload.bank_name,
        upi_id=payload.upi_id,
        utr=payload.utr,
    )
    try:
        await notification_svc.create_admin_notification(
            "Farmer Payment Received",
            f"Farmer {current_farmer.mobile or current_farmer.farmer_id} completed payment of ₹{payload.amount} ({payload.description}).",
            type="payment",
            actor_type="farmer",
        )
    except Exception:
        pass
    return SuccessResponse(message="Transaction recorded successfully.", data=tx)


# ── Bank accounts (up to 3) ──────────────────────────────────────────────────

@router.get(
    "/bank-account",
    response_model=SuccessResponse[BankAccountResponse],
    summary="Get primary bank account (legacy single-account accessor)",
)
async def get_bank_account(
    current_farmer: CurrentFarmer,
    svc: WalletService = Depends(get_wallet_service),
) -> SuccessResponse[BankAccountResponse]:
    data = await svc.get_bank_account(str(current_farmer.id))
    return SuccessResponse(message="Bank account fetched successfully.", data=data)


@router.get(
    "/bank-accounts",
    response_model=SuccessResponse[list[BankAccountResponse]],
    summary="List all saved bank accounts (max 3)",
)
async def list_bank_accounts(
    current_farmer: CurrentFarmer,
    svc: WalletService = Depends(get_wallet_service),
) -> SuccessResponse[list[BankAccountResponse]]:
    data = await svc.list_bank_accounts(str(current_farmer.id))
    return SuccessResponse(message="Bank accounts fetched successfully.", data=data)


@router.post(
    "/bank-account",
    response_model=SuccessResponse[BankAccountResponse],
    summary="Add a bank account (max 3 per farmer)",
)
async def add_bank_account(
    payload: AddBankAccountRequest,
    current_farmer: CurrentFarmer,
    svc: WalletService = Depends(get_wallet_service),
) -> SuccessResponse[BankAccountResponse]:
    data = await svc.add_bank_account(str(current_farmer.id), payload)
    return SuccessResponse(message="Bank account added successfully.", data=data)


@router.put(
    "/bank-account/{account_id}",
    response_model=SuccessResponse[BankAccountResponse],
    summary="Edit a bank account",
)
async def update_bank_account(
    account_id: str,
    payload: UpdateBankAccountRequest,
    current_farmer: CurrentFarmer,
    svc: WalletService = Depends(get_wallet_service),
) -> SuccessResponse[BankAccountResponse]:
    data = await svc.update_bank_account(str(current_farmer.id), account_id, payload)
    return SuccessResponse(message="Bank account updated successfully.", data=data)


@router.delete(
    "/bank-account/{account_id}",
    response_model=SuccessResponse[None],
    summary="Delete a bank account (auto-promotes another to Primary if needed)",
)
async def delete_bank_account(
    account_id: str,
    current_farmer: CurrentFarmer,
    svc: WalletService = Depends(get_wallet_service),
) -> SuccessResponse[None]:
    await svc.delete_bank_account(str(current_farmer.id), account_id)
    return SuccessResponse(message="Bank account deleted successfully.", data=None)


@router.put(
    "/bank-account/{account_id}/primary",
    response_model=SuccessResponse[BankAccountResponse],
    summary="Set a bank account as Primary",
)
async def set_primary_bank_account(
    account_id: str,
    current_farmer: CurrentFarmer,
    svc: WalletService = Depends(get_wallet_service),
) -> SuccessResponse[BankAccountResponse]:
    data = await svc.set_primary_bank_account(str(current_farmer.id), account_id)
    return SuccessResponse(message="Primary bank account updated successfully.", data=data)


# ── Withdrawal ────────────────────────────────────────────────────────────────

@router.post(
    "/withdraw",
    response_model=SuccessResponse[WithdrawalRequestResponse],
    summary="Request a payout withdrawal (bank or UPI)",
)
async def request_withdrawal(
    payload: WithdrawRequest,
    current_farmer: VerifiedFarmer,
    svc: WalletService = Depends(get_wallet_service),
) -> SuccessResponse[WithdrawalRequestResponse]:
    data = await svc.request_withdrawal(str(current_farmer.id), payload)
    return SuccessResponse(message="Withdrawal request submitted successfully.", data=data)

class SellCreditsRequest(BaseModel):
    credits_to_sell: float

from app.models.sale import CarbonCreditSale

class SellCreditsResponse(BaseModel):
    sold_credits: float
    gross_amount: float
    platform_fee: float
    gst_amount: float
    net_amount_earned: float
    status: str
    remaining_credits: float

@router.post(
    "/sell-credits",
    response_model=SuccessResponse[SellCreditsResponse],
    summary="Request to sell carbon credits",
)
async def sell_carbon_credits(
    payload: SellCreditsRequest,
    current_farmer: CurrentFarmer,
    svc: FarmerProfileService = Depends(get_farmer_profile_service),
    notification_svc: NotificationService = Depends(get_notification_service),
) -> SuccessResponse[SellCreditsResponse]:
    # We fetch the full farmer to update them
    farmer = await Farmer.get(current_farmer.id)
    if not farmer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farmer not found")

    credits_to_sell = payload.credits_to_sell
    
    if credits_to_sell <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount to sell must be greater than 0.")
        
    if farmer.carbon_credits_generated < credits_to_sell:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient carbon credits.")

    # Current rate: 1 CO2e = ₹400
    rate_per_credit = 400.0
    gross_amount = credits_to_sell * rate_per_credit
    
    platform_fee = 0.0
    gst_amount = 0.0
    
    if gross_amount > 5000:
        platform_fee = gross_amount * 0.07
        gst_amount = gross_amount * 0.18
        
    net_amount = gross_amount - platform_fee - gst_amount
    
    # Deduct credits, but DON'T add to wallet_balance yet
    farmer.carbon_credits_generated -= credits_to_sell
    await farmer.save()
    
    # Create PENDING sale request
    sale = CarbonCreditSale(
        farmer_id=farmer.id,
        credits_to_sell=credits_to_sell,
        gross_amount=gross_amount,
        platform_fee=platform_fee,
        gst_amount=gst_amount,
        net_amount=net_amount
    )
    await sale.save()

    # Create pending WalletTransaction for history
    from datetime import datetime, timezone
    from app.models.wallet import Wallet, WalletTransaction, TransactionType, TransactionStatus
    wallet = await Wallet.find_one(Wallet.farmer_id == str(farmer.id))
    wallet_id = str(wallet.id) if wallet else str(farmer.id)
    now = datetime.now(timezone.utc)
    tx = WalletTransaction(
        farmer_id=str(farmer.id),
        wallet_id=wallet_id,
        amount=net_amount,
        type=TransactionType.CREDIT,
        status=TransactionStatus.PENDING,
        description=f"Sold {credits_to_sell} CO₂e Carbon Credits",
        reference_id=str(sale.id),
        created_at=now,
        updated_at=now,
    )
    await tx.save()

    try:
        await notification_svc.create_admin_notification(
            "Credit Sale",
            f"Farmer {farmer.farmer_id} submitted Carbon Credit Sale request.",
            type="credit_sale",
            actor_type="farmer",
        )
    except Exception:
        logger.exception(f"Failed to create admin notification for credit sale request {sale.id}")

    data = SellCreditsResponse(
        sold_credits=credits_to_sell,
        gross_amount=gross_amount,
        platform_fee=platform_fee,
        gst_amount=gst_amount,
        net_amount_earned=net_amount,
        status="PENDING",
        remaining_credits=farmer.carbon_credits_generated
    )
    
    return SuccessResponse(message="Request to sell carbon credits submitted to admin.", data=data)
