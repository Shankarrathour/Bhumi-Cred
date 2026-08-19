"""
Vendor/Farmer Support Ticket Routes
──────────────────────────────────────────────────────────────────────────────
API endpoints for BhumiAPP farmers to raise support tickets and communicate
with Bhumi support staff. Tickets are scoped to the authenticated farmer.

Routes:
  POST   /vendor/support              — Create a new ticket
  GET    /vendor/support              — List all tickets for the farmer
  GET    /vendor/support/{ticket_id}  — Get a single ticket (with messages)
  POST   /vendor/support/{ticket_id}/reply — Append a message to a ticket
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.dependencies.auth import CurrentFarmer
from app.models.support_ticket import SupportTicket, TicketStatus, TicketPriority, TicketMessageEmbedded

router = APIRouter(prefix="/vendor/support", tags=["Support Tickets"])


# ── Request / Response Schemas ─────────────────────────────────────────────────

class CreateTicketRequest(BaseModel):
    subject: str = Field(..., min_length=3, max_length=150)
    category: Optional[str] = Field(None, max_length=50)
    description: str = Field(..., min_length=3, max_length=2000)
    priority: Optional[TicketPriority] = None


class ReplyRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


def _ticket_to_response(ticket: SupportTicket) -> dict:
    """Serialize a SupportTicket document to the dict the frontend expects."""
    return {
        "id": str(ticket.id),
        "vendor_id": ticket.vendor_id,
        "vendor_name": ticket.vendor_name,
        "subject": ticket.subject,
        "category": ticket.category,
        "description": ticket.description,
        "status": ticket.status.value,
        "priority": ticket.priority.value,
        "created_at": ticket.created_at.isoformat(),
        "updated_at": ticket.updated_at.isoformat(),
        "messages": [
            {
                "sender": m.sender,
                "sender_name": m.sender_name,
                "message": m.message,
                "timestamp": m.timestamp.isoformat(),
            }
            for m in ticket.messages
        ],
    }


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_ticket(
    payload: CreateTicketRequest,
    farmer: CurrentFarmer,
) -> dict:
    """
    Create a new support ticket for the authenticated farmer.
    The first message body is taken from the `description` field.
    """
    farmer_name = getattr(farmer, "full_name", None) or str(farmer.id)
    ticket = SupportTicket(
        vendor_id=str(farmer.id),
        vendor_name=farmer_name,
        subject=payload.subject,
        category=payload.category,
        description=payload.description,
        priority=payload.priority or TicketPriority.MEDIUM,
        messages=[
            TicketMessageEmbedded(
                sender="vendor",
                sender_name=farmer_name,
                message=payload.description,
            )
        ],
    )
    await ticket.insert()
    return {"success": True, "data": _ticket_to_response(ticket)}


@router.get("")
async def list_tickets(farmer: CurrentFarmer) -> dict:
    """
    Return all support tickets raised by the authenticated farmer,
    newest first.
    """
    tickets = await SupportTicket.find(
        SupportTicket.vendor_id == str(farmer.id)
    ).sort("-created_at").to_list()

    return {
        "success": True,
        "data": [_ticket_to_response(t) for t in tickets],
    }


@router.get("/{ticket_id}")
async def get_ticket(ticket_id: str, farmer: CurrentFarmer) -> dict:
    """Return a single support ticket with its full message thread."""
    ticket = await SupportTicket.get(ticket_id)
    if not ticket or ticket.vendor_id != str(farmer.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found.",
        )
    return {"success": True, "data": _ticket_to_response(ticket)}


@router.post("/{ticket_id}/reply")
async def reply_to_ticket(
    ticket_id: str,
    payload: ReplyRequest,
    farmer: CurrentFarmer,
) -> dict:
    """
    Append a farmer reply to an existing ticket.
    Tickets that are Resolved cannot receive new replies.
    """
    ticket = await SupportTicket.get(ticket_id)
    if not ticket or ticket.vendor_id != str(farmer.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found.",
        )
    if ticket.status == TicketStatus.RESOLVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reply to a resolved ticket.",
        )

    farmer_name = getattr(farmer, "full_name", None) or str(farmer.id)
    ticket.messages.append(
        TicketMessageEmbedded(
            sender="vendor",
            sender_name=farmer_name,
            message=payload.message,
        )
    )
    # Re-open if previously In Progress
    if ticket.status == TicketStatus.IN_PROGRESS:
        ticket.status = TicketStatus.OPEN

    ticket.updated_at = datetime.utcnow()
    await ticket.save()
    return {"success": True, "data": _ticket_to_response(ticket)}
