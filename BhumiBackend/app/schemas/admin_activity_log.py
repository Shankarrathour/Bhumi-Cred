from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SecurityAuditLogItem(BaseModel):
    id: str
    timestamp: datetime
    action: str
    module: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    actor_name: str
    actor_type: str
    actor_role: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    browser: Optional[str] = None
    device: Optional[str] = None
    old_value: Optional[dict] = None
    new_value: Optional[dict] = None
    remarks: Optional[str] = None
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
