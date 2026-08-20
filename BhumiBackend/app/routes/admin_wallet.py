from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.dependencies.auth import CurrentAdmin, require_roles
from app.dependencies.services import get_admin_wallet_service
from app.models.admin_user import AdminRole
from app.models.wallet import WithdrawalStatus
from app.schemas.common import PaginatedResponse, SuccessResponse
from app.schemas.wallet import (
    AdminWalletFarmerResponse,
    AdminWithdrawalResponse,
    ApproveWithdrawalRequest,
    RejectWithdrawalRequest,
)
from app.services.admin_wallet_service import AdminWalletService

router = APIRouter(prefix="/admin", tags=["Admin – Wallet & Withdrawals"])

_FINANCE_ROLES = (
    AdminRole.SUPER_ADMIN,
    AdminRole.OPERATIONS_ADMIN,
    AdminRole.FINANCE_MANAGER,
)


@router.get(
    "/wallet/summary",
    response_model=SuccessResponse[dict],
    summary="Get financial wallet summary and KPI stats",
    description="Live aggregates of Platform Revenue, Farmer Wallets, Govt Wallets, Partner Wallets, and Withdrawals.",
    dependencies=[Depends(require_roles(*_FINANCE_ROLES))],
)
async def get_wallet_summary(
    current_admin: CurrentAdmin,
    svc: AdminWalletService = Depends(get_admin_wallet_service),
) -> SuccessResponse[dict]:
    data = await svc.get_wallet_summary()
    return SuccessResponse(message="Wallet summary fetched successfully.", data=data)


@router.get(
    "/wallet",
    response_model=PaginatedResponse[AdminWalletFarmerResponse],
    summary="List farmer wallets",
    description=(
        "Paginated view of all farmers with their carbon credits, estimated INR value, "
        "wallet balance, and settled amount. Accessible to Finance roles."
    ),
    dependencies=[Depends(require_roles(*_FINANCE_ROLES))],
)
async def list_farmer_wallets(
    current_admin: CurrentAdmin,
    svc: AdminWalletService = Depends(get_admin_wallet_service),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> PaginatedResponse[AdminWalletFarmerResponse]:
    return await svc.list_farmer_wallets(page=page, limit=limit)


@router.get(
    "/withdrawals",
    response_model=PaginatedResponse[AdminWithdrawalResponse],
    summary="List withdrawal requests",
    description=(
        "Paginated list of all withdrawal requests. "
        "Optionally filter by status (pending, approved, rejected). "
        "Accessible to Finance roles."
    ),
    dependencies=[Depends(require_roles(*_FINANCE_ROLES))],
)
async def list_withdrawals(
    current_admin: CurrentAdmin,
    svc: AdminWalletService = Depends(get_admin_wallet_service),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[WithdrawalStatus] = Query(None, description="Filter by status"),
) -> PaginatedResponse[AdminWithdrawalResponse]:
    return await svc.list_withdrawals(page=page, limit=limit, status=status)


@router.put(
    "/withdrawals/{withdrawal_id}/approve",
    response_model=SuccessResponse[AdminWithdrawalResponse],
    summary="Approve withdrawal request",
    description=(
        "Approves a pending withdrawal. "
        "Balance is deducted from the farmer's wallet and payout is initiated. "
        "Restricted to Finance roles."
    ),
    dependencies=[Depends(require_roles(*_FINANCE_ROLES))],
)
async def approve_withdrawal(
    withdrawal_id: str,
    payload: ApproveWithdrawalRequest,
    current_admin: CurrentAdmin,
    svc: AdminWalletService = Depends(get_admin_wallet_service),
) -> SuccessResponse[AdminWithdrawalResponse]:
    data = await svc.approve_withdrawal(
        withdrawal_id=withdrawal_id,
        admin_id=str(current_admin.id),
        data=payload,
    )
    return SuccessResponse(message="Withdrawal approved successfully.", data=data)


@router.put(
    "/withdrawals/{withdrawal_id}/reject",
    response_model=SuccessResponse[AdminWithdrawalResponse],
    summary="Reject withdrawal request",
    description=(
        "Rejects a pending withdrawal. Balance is unchanged. "
        "Requires a rejection reason. Restricted to Finance roles."
    ),
    dependencies=[Depends(require_roles(*_FINANCE_ROLES))],
)
async def reject_withdrawal(
    withdrawal_id: str,
    payload: RejectWithdrawalRequest,
    current_admin: CurrentAdmin,
    svc: AdminWalletService = Depends(get_admin_wallet_service),
) -> SuccessResponse[AdminWithdrawalResponse]:
    data = await svc.reject_withdrawal(
        withdrawal_id=withdrawal_id,
        admin_id=str(current_admin.id),
        data=payload,
    )
    return SuccessResponse(message="Withdrawal rejected.", data=data)
