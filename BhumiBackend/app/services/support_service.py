import logging
from typing import List, Optional
from datetime import datetime, timezone

from app.models.support_ticket import SupportTicket, TicketMessage, TicketStatus, TicketPriority, TicketSender
from app.models.vendor import Vendor
from app.models.admin_user import AdminUser
from app.repositories.support_ticket import SupportTicketRepository
from app.schemas.support import CreateTicketRequest, TicketResponse, TicketMessageResponse
from app.services.notification_service import NotificationService
from app.core.exceptions import NotFoundException

logger = logging.getLogger(__name__)


def _vendor_display_name(vendor: Vendor) -> str:
    return vendor.business_name or vendor.name or vendor.phone


class SupportService:
    def __init__(self, repo: SupportTicketRepository, notification_service: NotificationService):
        self.repo = repo
        self.notification_service = notification_service

    def _to_response(self, ticket: SupportTicket) -> TicketResponse:
        return TicketResponse(
            id=str(ticket.id),
            vendor_id=ticket.vendor_id,
            vendor_name=ticket.vendor_name,
            subject=ticket.subject,
            category=ticket.category,
            description=ticket.description,
            status=ticket.status,
            priority=ticket.priority,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
            messages=[
                TicketMessageResponse(
                    sender=m.sender.value,
                    sender_name=m.sender_name,
                    message=m.message,
                    timestamp=m.timestamp,
                )
                for m in ticket.messages
            ],
        )

    # ── Vendor-facing ────────────────────────────────────────────────────────

    async def create_ticket(self, vendor: Vendor, data: CreateTicketRequest) -> TicketResponse:
        vendor_name = _vendor_display_name(vendor)
        now = datetime.now(timezone.utc)
        ticket = SupportTicket(
            vendor_id=str(vendor.id),
            vendor_name=vendor_name,
            subject=data.subject,
            category=data.category,
            description=data.description,
            priority=data.priority or TicketPriority.MEDIUM,
            messages=[
                TicketMessage(
                    sender=TicketSender.VENDOR,
                    sender_name=vendor_name,
                    message=data.description,
                    timestamp=now,
                )
            ],
            created_at=now,
            updated_at=now,
        )
        created = await self.repo.create(ticket)

        try:
            await self.notification_service.create_admin_notification(
                "Support Ticket",
                f"Vendor {vendor.vendor_id} raised a new Help & Support ticket.",
                type="support",
                actor_type="vendor",
            )
        except Exception:
            logger.exception(f"Failed to create admin notification for support ticket {created.id}")

        return self._to_response(created)

    async def get_vendor_tickets(self, vendor_id: str, limit: int = 50) -> List[TicketResponse]:
        tickets = await self.repo.get_by_vendor(vendor_id, limit)
        return [self._to_response(t) for t in tickets]

    async def get_vendor_ticket(self, vendor_id: str, ticket_id: str) -> TicketResponse:
        ticket = await self.repo.get_by_id_and_vendor(ticket_id, vendor_id)
        if not ticket:
            raise NotFoundException("Support ticket not found.", "SUPPORT_TICKET_NOT_FOUND")
        return self._to_response(ticket)

    async def add_vendor_reply(self, vendor: Vendor, ticket_id: str, message: str) -> TicketResponse:
        ticket = await self.repo.get_by_id_and_vendor(ticket_id, str(vendor.id))
        if not ticket:
            raise NotFoundException("Support ticket not found.", "SUPPORT_TICKET_NOT_FOUND")
        ticket.messages.append(
            TicketMessage(sender=TicketSender.VENDOR, sender_name=_vendor_display_name(vendor), message=message)
        )
        ticket.updated_at = datetime.now(timezone.utc)
        await self.repo.save(ticket)
        return self._to_response(ticket)

    # ── Admin-facing ─────────────────────────────────────────────────────────

    async def get_all_tickets_admin(self, status: Optional[str] = None, limit: int = 100) -> List[TicketResponse]:
        tickets = await self.repo.get_all_admin(status, limit)
        return [self._to_response(t) for t in tickets]

    async def get_ticket_admin(self, ticket_id: str) -> TicketResponse:
        ticket = await self.repo.get_by_id(ticket_id)
        if not ticket:
            raise NotFoundException("Support ticket not found.", "SUPPORT_TICKET_NOT_FOUND")
        return self._to_response(ticket)

    async def update_status_admin(self, ticket_id: str, status: TicketStatus) -> TicketResponse:
        ticket = await self.repo.get_by_id(ticket_id)
        if not ticket:
            raise NotFoundException("Support ticket not found.", "SUPPORT_TICKET_NOT_FOUND")

        ticket.status = status
        ticket.updated_at = datetime.now(timezone.utc)
        await self.repo.save(ticket)

        if status == TicketStatus.RESOLVED:
            title, message = "Support Ticket Resolved", "Your issue has been resolved."
        else:
            title, message = "Support Ticket Updated", f"Your ticket is now {status.value}."
        await self.notification_service.create_vendor_notification(ticket.vendor_id, title, message, type="support")

        return self._to_response(ticket)

    async def add_admin_reply(self, admin: AdminUser, ticket_id: str, message: str) -> TicketResponse:
        ticket = await self.repo.get_by_id(ticket_id)
        if not ticket:
            raise NotFoundException("Support ticket not found.", "SUPPORT_TICKET_NOT_FOUND")

        ticket.messages.append(
            TicketMessage(sender=TicketSender.ADMIN, sender_name=admin.name, message=message)
        )
        # Mirrors the existing Admin Support page's mock behavior: replying moves the case to In Progress.
        ticket.status = TicketStatus.IN_PROGRESS
        ticket.updated_at = datetime.now(timezone.utc)
        await self.repo.save(ticket)

        await self.notification_service.create_vendor_notification(
            ticket.vendor_id, "Support Team Replied", message, type="support"
        )

        return self._to_response(ticket)
