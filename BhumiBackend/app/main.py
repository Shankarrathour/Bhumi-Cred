import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

import os
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError as PydanticValidationError
from pymongo.errors import DuplicateKeyError

from app.api.router import api_router
from app.config.settings import settings
from app.core.exceptions import AppException
from app.core.logging import setup_logging
from app.database.connection import connect_db, disconnect_db, ping_db, reconnect_db
from app.middleware.request_logging import RequestLoggingMiddleware

from beanie.odm.fields import PydanticObjectId
from bson import ObjectId
from fastapi.encoders import ENCODERS_BY_TYPE

# Global FastAPI encoders for Beanie & PyMongo ObjectIds
ENCODERS_BY_TYPE[PydanticObjectId] = str
ENCODERS_BY_TYPE[ObjectId] = str

# ── Logging setup (must be first) ────────────────────────────────────────────
setup_logging(level=settings.LOG_LEVEL, fmt=settings.LOG_FORMAT)
logger = logging.getLogger(__name__)


# ── Lifespan: startup / shutdown ─────────────────────────────────────────────

# ── Background keepalive task ──────────────────────────────────────

_KEEPALIVE_INTERVAL = 4 * 60  # 4 minutes — well under Atlas's 10-min idle timeout


async def _db_keepalive() -> None:
    """Ping MongoDB every 4 minutes.
    If the ping fails, immediately reconnect so the very next request
    succeeds instead of hanging and triggering a 502 from the tunnel.
    """
    while True:
        await asyncio.sleep(_KEEPALIVE_INTERVAL)
        alive = await ping_db()
        if alive:
            logger.debug("[keepalive] MongoDB ping OK")
        else:
            logger.warning("[keepalive] MongoDB ping failed — reconnecting...")
            try:
                await reconnect_db()
                logger.info("[keepalive] MongoDB reconnect succeeded.")
            except Exception as exc:
                logger.error("[keepalive] MongoDB reconnect failed: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s v%s [%s]", settings.APP_NAME, settings.APP_VERSION, settings.ENVIRONMENT)

    await connect_db()

    # Seed 11 default BRD System Roles (idempotent)
    from app.services.role_service import RoleService
    await RoleService.seed_default_roles()

    # Seed the default admin accounts (idempotent — skips existing emails)
    from app.services.admin_auth_service import AdminAuthService
    from app.repositories.admin_user import AdminUserRepository
    from app.repositories.audit_log import AuditLogRepository
    from app.repositories.refresh_token import RefreshTokenRepository

    svc = AdminAuthService(
        admin_repo=AdminUserRepository(),
        token_repo=RefreshTokenRepository(),
        audit_repo=AuditLogRepository(),
    )
    await svc.seed_default_admins()

    # Seed default categories
    from app.services.category import CategoryService
    from app.repositories.category import CategoryRepository
    
    category_repo = CategoryRepository()
    category_svc = CategoryService(category_repo)
    await category_svc.seed_default_categories()

    # Start the MongoDB keepalive background task
    keepalive_task = asyncio.create_task(_db_keepalive())
    logger.info("[keepalive] MongoDB keepalive task started (interval: %ds)", _KEEPALIVE_INTERVAL)

    try:
        yield
    except (asyncio.CancelledError, KeyboardInterrupt):
        pass
    finally:
        logger.info("Shutting down %s...", settings.APP_NAME)
        keepalive_task.cancel()
        try:
            await keepalive_task
        except asyncio.CancelledError:
            pass
        await disconnect_db()



# ── Application factory ───────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "Bhumi Agri-Tech Platform API — serving BhumiAPP (React Native) "
            "and BhumiAdmin (React + Vite)."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
        swagger_ui_parameters={"persistAuthorization": True},
    )

    # ── Middleware ────────────────────────────────────────────────────────────
    # Starlette applies middleware in LIFO order (last added = outermost).
    # Request logging is added first so it runs innermost (after CORS).
    # CORS is added last so it runs outermost and covers all responses.
    origins = list(set(settings.CORS_ORIGINS + [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5174",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:8000",
    ]))

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=r".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    # ── Exception handlers ────────────────────────────────────────────────────

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error_code": exc.error_code,
                "message": exc.detail,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors = []
        for err in exc.errors():
            field = " -> ".join(str(loc) for loc in err["loc"] if loc != "body")
            errors.append({"field": field, "message": err["msg"]})

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error_code": "VALIDATION_ERROR",
                "message": "Request validation failed.",
                "errors": errors,
            },
        )

    @app.exception_handler(PydanticValidationError)
    async def pydantic_validation_handler(
        request: Request, exc: PydanticValidationError
    ) -> JSONResponse:
        errors = [
            {"field": " -> ".join(str(loc) for loc in e["loc"]), "message": e["msg"]}
            for e in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error_code": "VALIDATION_ERROR",
                "message": "Data validation failed.",
                "errors": errors,
            },
        )

    @app.exception_handler(DuplicateKeyError)
    async def duplicate_key_handler(
        request: Request, exc: DuplicateKeyError
    ) -> JSONResponse:
        logger.warning("DuplicateKeyError on %s %s: %s", request.method, request.url.path, exc)
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "success": False,
                "error_code": "CONFLICT",
                "message": "A record with the provided value already exists.",
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error_code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred. Please try again.",
            },
        )

    # ── Static Files ──────────────────────────────────────────────────────────
    os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)
    
    @app.get(f"/{settings.LOCAL_UPLOAD_DIR}/{{file_path:path}}", include_in_schema=False)
    async def serve_static_file(file_path: str):
        file_full_path = os.path.join(settings.LOCAL_UPLOAD_DIR, file_path)
        if not os.path.isfile(file_full_path):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not Found")
        return FileResponse(file_full_path)

    # ── Routes ────────────────────────────────────────────────────────────────
    from app.routes.chat import router as chat_router
    app.include_router(chat_router) # Root level chat route
    app.include_router(api_router, prefix=settings.API_PREFIX)

    # ── Static file serving — local upload storage ────────────────────────────
    # Only active when STORAGE_BACKEND=local.  Creates the directory if missing
    # so a cold start doesn't crash.  Files are served at /uploads/<path>.
    if settings.STORAGE_BACKEND == "local":
        upload_dir = Path(settings.LOCAL_UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)
        app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")
        if settings.API_PREFIX:
            app.mount(f"{settings.API_PREFIX}/uploads", StaticFiles(directory=str(upload_dir)), name="api_uploads")

    banners_dir = Path("uploads/banners")
    banners_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/banners", StaticFiles(directory=str(banners_dir)), name="banners")

    # ── Health check ──────────────────────────────────────────────────────────
    @app.get("/health", tags=["Health"], include_in_schema=False)
    async def health() -> dict:
        return {"status": "ok", "version": settings.APP_VERSION}

    @app.get("/", tags=["Root"], include_in_schema=False)
    async def root() -> dict:
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "docs": "/docs",
            "health": "/health",
        }

    return app


app = create_app()
