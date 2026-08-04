from .auth import router as auth_router
from .admin_auth import router as admin_auth_router

__all__ = ["auth_router", "admin_auth_router"]
