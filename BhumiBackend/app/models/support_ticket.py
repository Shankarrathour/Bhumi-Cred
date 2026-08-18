"""
Support Ticket Model
──────────────────────────────────────────────────────────────────────────────
Tracks vendor/farmer support tickets submitted via the BhumiAPP.
Each ticket has an embedded list of messages (thread-style).
"""
from enum import Enum
from typing import List, Optional
from datetime import datetime
from beanie import Document, Indexed
from pydantic import Field


class TicketStatus(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"


class TicketPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class TicketMessage:
    """Embedded sub-document — not a Beanie document itself."""
    sender: str          # "vendor" | "farmer" | "admin"
    sender_name: str
    message: str
    timestamp: datetime

    def __init__(self, sender: str, sender_name: str, message: str, timestamp: datetime | None = None):
        self.sender = sender
        self.sender_name = sender_name
        self.message = message
        self.timestamp = timestamp or datetime.utcnow()

    def dict(self):
        return {
            "sender": self.sender,
            "sender_name": self.sender_name,
            "message": self.message,
            "timestamp": self.timestamp,
        }


from pydantic import BaseModel


class TicketMessageEmbedded(BaseModel):
    sender: str
    sender_name: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SupportTicket(Document):
    """Support ticket raised by a farmer or vendor through the app."""

    # Who raised the ticket
    vendor_id: Indexed(str)          # farmer_id or vendor_id
    vendor_name: str                  # display name

    # Ticket content
    subject: str
    category: Optional[str] = None
    description: str

    # Status
    status: TicketStatus = TicketStatus.OPEN
    priority: TicketPriority = TicketPriority.MEDIUM

    # Thread of messages
    messages: List[TicketMessageEmbedded] = Field(default_factory=list)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "support_tickets"
        use_state_management = True
