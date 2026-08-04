from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

import logging

from app.dependencies.auth import CurrentAdmin
from app.dependencies.services import get_wallet_service, get_notification_service
from app.models.farmer import Farmer
from app.models.sale import CarbonCreditSale, SaleStatus
from app.schemas.common import SuccessResponse
from app.services.wallet_service import WalletService
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/sales", tags=["Admin Carbon Sales"])

class SaleResponse(BaseModel):
    id: str
    farmer_id: str
    farmer_name: str
    credits_to_sell: float
    gross_amount: float
    platform_fee: float
    gst_amount: float
    net_amount: float
    status: str
    created_at: datetime
    resolved_at: datetime | None

class ReviewSaleRequest(BaseModel):
    action: str  # "APPROVE" or "REJECT"
    remarks: str | None = None
    gross_amount: float | None = None

@router.get(
    "",
    response_model=SuccessResponse[List[SaleResponse]],
    summary="List all carbon credit sale requests",
)
async def list_sales(
    current_admin: CurrentAdmin,
    status_filter: str | None = None,
) -> SuccessResponse[List[SaleResponse]]:
    query = {}
    if status_filter:
        query["status"] = status_filter
        
    sales = await CarbonCreditSale.find(query).sort("-created_at").to_list()
    
    response_data = []
    for sale in sales:
        farmer = await Farmer.get(sale.farmer_id)
        farmer_name = farmer.full_name if farmer else "Unknown"
        response_data.append(
            SaleResponse(
                id=str(sale.id),
                farmer_id=str(sale.farmer_id),
                farmer_name=farmer_name,
                credits_to_sell=sale.credits_to_sell,
                gross_amount=sale.gross_amount,
                platform_fee=sale.platform_fee,
                gst_amount=sale.gst_amount,
                net_amount=sale.net_amount,
                status=sale.status,
                created_at=sale.created_at,
                resolved_at=sale.resolved_at
            )
        )
        
    return SuccessResponse(message="Sales fetched successfully", data=response_data)

@router.post(
    "/{sale_id}/review",
    response_model=SuccessResponse[SaleResponse],
    summary="Review a carbon credit sale request",
)
async def review_sale(
    sale_id: str,
    payload: ReviewSaleRequest,
    current_admin: CurrentAdmin,
    wallet_svc: WalletService = Depends(get_wallet_service),
    notification_svc: NotificationService = Depends(get_notification_service),
) -> SuccessResponse[SaleResponse]:
    sale = await CarbonCreditSale.get(sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale request not found")
        
    if sale.status != SaleStatus.PENDING:
        raise HTTPException(status_code=400, detail="Sale is not pending")
        
    farmer = await Farmer.get(sale.farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
        
    if payload.action.upper() == "APPROVE":
        if payload.gross_amount is None or payload.gross_amount <= 0:
            raise HTTPException(status_code=400, detail="gross_amount is required and must be > 0 to approve.")
            
        sale.gross_amount = payload.gross_amount
        sale.platform_fee = 0.0
        sale.gst_amount = 0.0
        
        if sale.gross_amount > 5000:
            sale.platform_fee = sale.gross_amount * 0.07
            sale.gst_amount = sale.gross_amount * 0.18
            
        sale.net_amount = sale.gross_amount - sale.platform_fee - sale.gst_amount
        
        sale.status = SaleStatus.APPROVED
        await wallet_svc.credit_wallet(
            farmer_id=str(sale.farmer_id),
            amount=sale.net_amount,
            description=f"Carbon credit sale approved — {sale.credits_to_sell:.1f} CO2e",
            reference_id=str(sale.id),
        )
    elif payload.action.upper() == "REJECT":
        sale.status = SaleStatus.REJECTED
        # Refund credits
        farmer.carbon_credits_generated += sale.credits_to_sell
        await farmer.save()
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use APPROVE or REJECT.")
        
    sale.remarks = payload.remarks
    sale.resolved_at = datetime.now(timezone.utc)
    await sale.save()

    try:
        if sale.status == SaleStatus.APPROVED:
            await notification_svc.create_notification(
                str(sale.farmer_id),
                "Credit Sale Approved",
                "Your Carbon Credit sale request has been approved.",
                type="sale",
            )
        elif sale.status == SaleStatus.REJECTED:
            await notification_svc.create_notification(
                str(sale.farmer_id),
                "Credit Sale Rejected",
                "Your Carbon Credit sale request has been rejected.",
                type="sale",
            )
    except Exception:
        logger.exception(f"Failed to create credit-sale notification for sale {sale.id}")

    response_data = SaleResponse(
        id=str(sale.id),
        farmer_id=str(sale.farmer_id),
        farmer_name=farmer.full_name,
        credits_to_sell=sale.credits_to_sell,
        gross_amount=sale.gross_amount,
        platform_fee=sale.platform_fee,
        gst_amount=sale.gst_amount,
        net_amount=sale.net_amount,
        status=sale.status,
        created_at=sale.created_at,
        resolved_at=sale.resolved_at
    )
    
    return SuccessResponse(message=f"Sale request {sale.status.lower()} successfully", data=response_data)
