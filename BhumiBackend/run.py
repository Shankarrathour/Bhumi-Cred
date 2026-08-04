"""
Development entry point — ALWAYS use this file to start the server.

    python run.py

DO NOT use bare `uvicorn app.main:app --reload`.
That command defaults to host=127.0.0.1, which is unreachable from
physical devices or Android emulators on the same LAN.
This file binds to host=0.0.0.0 so every interface (including your
machine's LAN IP) accepts connections.
"""
import uvicorn
from app.config.settings import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.is_development,
        log_level=settings.LOG_LEVEL.lower(),
    )
