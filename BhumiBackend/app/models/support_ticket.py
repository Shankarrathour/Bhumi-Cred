from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum
from beanie import Document
from pydantic import BaseModel, Field
from pymongo import IndexModel, ASCENDING


class TicketStatus(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"


class TicketPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class TicketSender(str, Enum):
    VENDOR = "vendor"
    ADMIN = "admin"


class TicketMessage(BaseModel):
    """Embedded chat-history entry. Replies must never be lost — always appended, never overwritten."""
    sender: TicketSender
    sender_name: str
    message: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SupportTicket(Document):
    vendor_id: str
    vendor_name: str
    subject: str
    category: Optional[str] = None
    description: str
    status: TicketStatus = TicketStatus.OPEN
    priority: TicketPriority = TicketPriority.MEDIUM
    messages: List[TicketMessage] = []

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "support_tickets"
        indexes = [
            IndexModel([("vendor_id", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("created_at", ASCENDING)]),
        ]
