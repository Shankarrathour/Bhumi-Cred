from fastapi import APIRouter, Depends, Query
from typing import List

from app.dependencies.auth import CurrentVendor
from app.dependencies.services import get_support_service
from app.schemas.common import SuccessResponse
from app.schemas.support import CreateTicketRequest, ReplyRequest, TicketResponse
from app.services.support_service import SupportService

router = APIRouter(prefix="/vendor/support", tags=["Vendor Support"])


@router.post("", response_model=SuccessResponse[TicketResponse], status_code=201, summary="Create a support ticket")
async def create_ticket(
    payload: CreateTicketRequest,
    vendor: CurrentVendor,
    svc: SupportService = Depends(get_support_service),
) -> SuccessResponse[TicketResponse]:
    data = await svc.create_ticket(vendor, payload)
    return SuccessResponse(message="Support ticket created successfully.", data=data)


@router.get("", response_model=SuccessResponse[List[TicketResponse]], summary="List the vendor's own support tickets")
async def list_tickets(
    vendor: CurrentVendor,
    limit: int = Query(50, ge=1, le=100),
    svc: SupportService = Depends(get_support_service),
) -> SuccessResponse[List[TicketResponse]]:
    data = await svc.get_vendor_tickets(str(vendor.id), limit)
    return SuccessResponse(message="Support tickets retrieved successfully.", data=data)


@router.get("/{ticket_id}", response_model=SuccessResponse[TicketResponse], summary="Get a support ticket's details")
async def get_ticket(
    ticket_id: str,
    vendor: CurrentVendor,
    svc: SupportService = Depends(get_support_service),
) -> SuccessResponse[TicketResponse]:
    data = await svc.get_vendor_ticket(str(vendor.id), ticket_id)
    return SuccessResponse(message="Support ticket retrieved successfully.", data=data)


@router.post("/{ticket_id}/reply", response_model=SuccessResponse[TicketResponse], summary="Reply to a support ticket")
async def reply_to_ticket(
    ticket_id: str,
    payload: ReplyRequest,
    vendor: CurrentVendor,
    svc: SupportService = Depends(get_support_service),
) -> SuccessResponse[TicketResponse]:
    data = await svc.add_vendor_reply(vendor, ticket_id, payload.message)
    return SuccessResponse(message="Reply added successfully.", data=data)
