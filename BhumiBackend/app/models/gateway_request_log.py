from datetime import datetime, timezone
from typing import Optional

from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING

# Gateway request logs are written once per HTTP request — a TTL index keeps
# the collection bounded instead of growing forever.
_GATEWAY_LOG_TTL_SECONDS = 7 * 24 * 60 * 60  # 7 days


class GatewayRequestLog(Document):
    method: str
    path: str
    status_code: int
    response_time_ms: float
    ip_address: Optional[str] = None
    error: Optional[str] = None
    request_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "gateway_request_logs"
        indexes = [
            IndexModel([("timestamp", ASCENDING)], expireAfterSeconds=_GATEWAY_LOG_TTL_SECONDS),
        ]
