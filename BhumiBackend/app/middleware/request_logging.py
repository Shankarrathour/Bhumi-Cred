import time
import uuid
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.core.context import request_id_var

logger = logging.getLogger("bhumi.requests")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Logs every HTTP request with method, path, status, duration, IP, and
    a unique request ID. The request ID is:
      - read from the incoming X-Request-ID header if provided,
      - otherwise generated as a UUID4.
    It is stored in a ContextVar so all log statements within the same request
    automatically include it, and returned to the client via X-Request-ID.
    """

    SKIP_PATHS = {"/health", "/docs", "/openapi.json", "/redoc"}

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method == "OPTIONS" or request.url.path in self.SKIP_PATHS:
            return await call_next(request)

        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())

        # Bind request_id to the context so all loggers in this request see it
        token = request_id_var.set(request_id)
        try:
            request.state.request_id = request_id
            start = time.perf_counter()

            client_ip = request.headers.get(
                "X-Forwarded-For",
                request.client.host if request.client else "unknown",
            )

            logger.info(
                "%s %s | ip=%s",
                request.method,
                request.url.path,
                client_ip,
            )

            response: Response = await call_next(request)

            duration_ms = (time.perf_counter() - start) * 1000
            response.headers["X-Request-ID"] = request_id

            logger.info(
                "%s %s -> %s | %.1fms",
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
            )

            await self._persist_gateway_log(
                request=request,
                status_code=response.status_code,
                duration_ms=duration_ms,
                client_ip=client_ip,
                request_id=request_id,
            )

            return response
        finally:
            request_id_var.reset(token)

    @staticmethod
    async def _persist_gateway_log(
        request: Request,
        status_code: int,
        duration_ms: float,
        client_ip: str,
        request_id: str,
    ) -> None:
        # Imported lazily — this middleware is constructed before Beanie/DB
        # connection is established during app startup.
        from app.repositories.gateway_request_log import GatewayRequestLogRepository

        await GatewayRequestLogRepository().log_request(
            method=request.method,
            path=request.url.path,
            status_code=status_code,
            response_time_ms=round(duration_ms, 1),
            ip_address=client_ip,
            error=f"HTTP {status_code}" if status_code >= 400 else None,
            request_id=request_id,
        )
