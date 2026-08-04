from fastapi import Request


def get_client_info(request: Request) -> tuple[str, str]:
    """Return (user_agent, ip_address) from a FastAPI request."""
    ua = request.headers.get("User-Agent", "")
    ip = request.headers.get("X-Forwarded-For", "")
    if not ip and request.client:
        ip = request.client.host
    return ua, ip
