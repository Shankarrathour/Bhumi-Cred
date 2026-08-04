from fastapi import APIRouter, Depends, Query
from typing import List, Optional

from app.dependencies.auth import CurrentAdmin, require_roles
from app.dependencies.services import get_support_service
from app.models.admin_user import AdminRole
from app.schemas.common import SuccessResponse
from app.schemas.support import ReplyRequest, UpdateStatusRequest, TicketResponse
from app.services.support_service import SupportService

router = APIRouter(
    prefix="/admin/support",
    tags=["Admin Support"],
    dependencies=[Depends(require_roles(AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_MANAGER, AdminRole.OPERATIONS_ADMIN))],
)


@router.get("", response_model=SuccessResponse[List[TicketResponse]], summary="List all support tickets")
async def list_tickets(
    status: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=200),
    svc: SupportService = Depends(get_support_service),
) -> SuccessResponse[List[TicketResponse]]:
    data = await svc.get_all_tickets_admin(status, limit)
    return SuccessResponse(message="Support tickets retrieved successfully.", data=data)


@router.get("/{ticket_id}", response_model=SuccessResponse[TicketResponse], summary="Get a support ticket's details")
async def get_ticket(
    ticket_id: str,
    svc: SupportService = Depends(get_support_service),
) -> SuccessResponse[TicketResponse]:
    data = await svc.get_ticket_admin(ticket_id)
    return SuccessResponse(message="Support ticket retrieved successfully.", data=data)


@router.patch("/{ticket_id}/status", response_model=SuccessResponse[TicketResponse], summary="Change a support ticket's status")
async def update_status(
    ticket_id: str,
    payload: UpdateStatusRequest,
    svc: SupportService = Depends(get_support_service),
) -> SuccessResponse[TicketResponse]:
    data = await svc.update_status_admin(ticket_id, payload.status)
    return SuccessResponse(message="Support ticket status updated successfully.", data=data)


@router.post("/{ticket_id}/reply", response_model=SuccessResponse[TicketResponse], summary="Reply to a support ticket")
async def reply_to_ticket(
    ticket_id: str,
    payload: ReplyRequest,
    admin: CurrentAdmin,
    svc: SupportService = Depends(get_support_service),
) -> SuccessResponse[TicketResponse]:
    data = await svc.add_admin_reply(admin, ticket_id, payload.message)
    return SuccessResponse(message="Reply added successfully.", data=data)
