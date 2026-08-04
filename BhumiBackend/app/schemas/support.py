from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.support_ticket import TicketStatus, TicketPriority


class CreateTicketRequest(BaseModel):
    subject: str = Field(..., min_length=3, max_length=150)
    category: Optional[str] = Field(None, max_length=50)
    description: str = Field(..., min_length=3, max_length=2000)
    priority: Optional[TicketPriority] = None


class ReplyRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class UpdateStatusRequest(BaseModel):
    status: TicketStatus


class TicketMessageResponse(BaseModel):
    sender: str
    sender_name: str
    message: str
    timestamp: datetime


class TicketResponse(BaseModel):
    id: str
    vendor_id: str
    vendor_name: str
    subject: str
    category: Optional[str] = None
    description: str
    status: TicketStatus
    priority: TicketPriority
    created_at: datetime
    updated_at: datetime
    messages: List[TicketMessageResponse]
