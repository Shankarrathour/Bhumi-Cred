from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class PasswordResetRequestSchema(BaseModel):
    email: EmailStr


class PasswordResetConfirmSchema(BaseModel):
    token: str = Field(..., description="Raw single-use reset token")
    new_password: str = Field(..., min_length=8, description="New password (min 8 characters)")


class UserSessionResponseSchema(BaseModel):
    id: str
    user_id: str
    session_token: str
    device_name: Optional[str] = "Unknown Device"
    device_type: str = "desktop"
    ip_address: str
    city: Optional[str] = None
    country: Optional[str] = None
    is_active: bool
    last_activity_at: datetime
    created_at: datetime
