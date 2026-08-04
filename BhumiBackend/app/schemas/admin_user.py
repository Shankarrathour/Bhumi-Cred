from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.admin_user import AdminRole


class AdminUserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: AdminRole
    is_active: bool
    onboarded_date: datetime
    last_login: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
