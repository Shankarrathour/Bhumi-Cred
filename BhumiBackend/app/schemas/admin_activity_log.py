from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SecurityAuditLogItem(BaseModel):
    id: str
    timestamp: datetime
    action: str
    actor_name: str
    actor_type: str
    actor_role: Optional[str] = None
    ip_address: Optional[str] = None
    success: bool

    model_config = {"from_attributes": True}


class GatewayRequestLogItem(BaseModel):
    id: str
    timestamp: datetime
    method: str
    path: str
    status_code: int
    response_time_ms: float
    error: Optional[str] = None

    model_config = {"from_attributes": True}
