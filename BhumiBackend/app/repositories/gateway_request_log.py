import logging
from typing import Optional

from app.models.gateway_request_log import GatewayRequestLog
from app.repositories.base import BaseRepository

logger = logging.getLogger(__name__)


class GatewayRequestLogRepository(BaseRepository[GatewayRequestLog]):
    def __init__(self):
        super().__init__(GatewayRequestLog)

    async def log_request(
        self,
        method: str,
        path: str,
        status_code: int,
        response_time_ms: float,
        ip_address: Optional[str] = None,
        error: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> None:
        """Best-effort write — never raises, so a logging failure can't break the actual HTTP response."""
        try:
            await self.create(
                GatewayRequestLog(
                    method=method,
                    path=path,
                    status_code=status_code,
                    response_time_ms=response_time_ms,
                    ip_address=ip_address,
                    error=error,
                    request_id=request_id,
                )
            )
        except Exception:
            logger.debug("Failed to persist gateway request log", exc_info=True)

    async def list_recent(self, skip: int = 0, limit: int = 50) -> list[GatewayRequestLog]:
        return await GatewayRequestLog.find().sort("-timestamp").skip(skip).limit(limit).to_list()
