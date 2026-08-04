import logging
from datetime import datetime, timezone

from app.auth.jwt import create_access_token, TOKEN_TYPE_ADMIN
from app.auth.password import hash_password, verify_password
from app.auth.otp import generate_refresh_token, hash_refresh_token
from app.core.exceptions import (
    InvalidCredentialsException,
    AdminSuspendedException,
    AdminNotFoundException,
    InvalidTokenException,
)
from app.models.admin_user import AdminUser, AdminRole
from app.models.refresh_token import RefreshTokenSession, TokenOwnerType
from app.repositories.admin_user import AdminUserRepository
from app.repositories.audit_log import AuditLogRepository
from app.repositories.refresh_token import RefreshTokenRepository
from app.schemas.auth import TokenPair, AdminAuthResponse
from app.schemas.admin_user import AdminUserResponse

logger = logging.getLogger(__name__)

_DEFAULT_ADMINS = [
    {"name": "Super Admin",       "email": "superadmin@bhumicred.com",       "password": "Superadmin@1234",       "role": AdminRole.SUPER_ADMIN},
    {"name": "Operations Admin",  "email": "operationsadmin@bhumicred.com",  "password": "Operationsadmin@1234",  "role": AdminRole.OPERATIONS_ADMIN},
    {"name": "Finance Manager",   "email": "financemanager@bhumicred.com",   "password": "Financemanager@1234",   "role": AdminRole.FINANCE_MANAGER},
    {"name": "Vendor Manager",    "email": "vendormanager@bhumicred.com",    "password": "Vendormanager@1234",    "role": AdminRole.VENDOR_MANAGER},
    {"name": "Carbon Manager",    "email": "carbonmanager@bhumicred.com",    "password": "Carbonmanager@1234",    "role": AdminRole.CARBON_PROJECT_MANAGER},
    {"name": "Employee Manager",  "email": "employeemanager@bhumicred.com",  "password": "Employeemanager@1234",  "role": AdminRole.EMPLOYEE_MANAGER},
    {"name": "Support Manager",   "email": "supportmanager@bhumicred.com",   "password": "Supportmanager@1234",   "role": AdminRole.SUPPORT_MANAGER},
]


class AdminAuthService:
    def __init__(
        self,
        admin_repo: AdminUserRepository,
        token_repo: RefreshTokenRepository,
        audit_repo: AuditLogRepository,
    ):
        self._admins = admin_repo
        self._tokens = token_repo
        self._audit = audit_repo

    # ── Login ─────────────────────────────────────────────────────────────────

    async def login(
        self,
        email: str,
        password: str,
        role: AdminRole | None = None,
        user_agent: str = "",
        ip_address: str = "",
    ) -> AdminAuthResponse:
        admin = await self._admins.get_by_email(email)

        if not admin:
            raise InvalidCredentialsException()

        if not verify_password(password, admin.password_hash):
            raise InvalidCredentialsException()

        if not admin.is_active:
            raise AdminSuspendedException()

        if role and admin.role != role:
            # Optional: enforce role hint supplied by client
            raise InvalidCredentialsException()

        # Update last login
        await self._admins.update_last_login(admin)

        token_pair = await self._issue_tokens(
            admin, user_agent=user_agent, ip_address=ip_address
        )

        await self._audit.log_event(
            action="ADMIN_LOGIN",
            entity_type="AdminUser",
            entity_id=str(admin.id),
            admin_id=str(admin.id),
            admin_name=admin.name,
            actor_type="admin",
            actor_role=admin.role.value if hasattr(admin.role, "value") else admin.role,
            ip_address=ip_address,
        )

        return AdminAuthResponse(
            tokens=token_pair,
            admin=AdminUserResponse(
                id=str(admin.id),
                name=admin.name,
                email=admin.email,
                role=admin.role,
                is_active=admin.is_active,
                status=admin.status.value if hasattr(admin.status, "value") else admin.status,
                onboarded_date=admin.onboarded_date,
                last_login=admin.last_login,
                created_at=admin.created_at,
                updated_at=admin.updated_at,
            ),
        )

    # ── Refresh Token ─────────────────────────────────────────────────────────

    async def refresh_token(
        self,
        raw_refresh_token: str,
        user_agent: str = "",
        ip_address: str = "",
    ) -> TokenPair:
        token_hash = hash_refresh_token(raw_refresh_token)
        session = await self._tokens.get_active_by_hash(token_hash)

        if not session or session.owner_type != TokenOwnerType.ADMIN:
            raise InvalidTokenException("Invalid or expired refresh token.")

        admin = await self._admins.get_by_id(session.owner_id)
        if not admin:
            await self._tokens.revoke(session)
            raise AdminNotFoundException()
        if not admin.is_active:
            await self._tokens.revoke(session)
            raise AdminSuspendedException()

        # Rotate refresh token
        await self._tokens.revoke(session)
        return await self._issue_tokens(
            admin, user_agent=user_agent, ip_address=ip_address
        )

    # ── Logout ────────────────────────────────────────────────────────────────

    async def logout(self, raw_refresh_token: str, ip_address: str = "") -> None:
        token_hash = hash_refresh_token(raw_refresh_token)
        session = await self._tokens.get_by_hash(token_hash)
        if session:
            await self._tokens.revoke(session)
            admin = await self._admins.get_by_id(session.owner_id)
            if admin:
                await self._audit.log_event(
                    action="ADMIN_LOGOUT",
                    entity_type="AdminUser",
                    entity_id=str(admin.id),
                    admin_id=str(admin.id),
                    admin_name=admin.name,
                    actor_type="admin",
                    actor_role=admin.role.value if hasattr(admin.role, "value") else admin.role,
                    ip_address=ip_address,
                )

    # ── Verify current session ────────────────────────────────────────────────

    async def list_employees(self) -> list[AdminUserResponse]:
        admins, _ = await self._admins.list_paginated(skip=0, limit=100)
        return [
            AdminUserResponse(
                id=str(a.id),
                name=a.name,
                email=a.email,
                role=a.role,
                is_active=a.is_active,
                status=a.status.value if hasattr(a.status, "value") else a.status,
                onboarded_date=a.onboarded_date,
                last_login=a.last_login,
                created_at=a.created_at,
                updated_at=a.updated_at,
            )
            for a in admins
        ]

    async def get_current_admin(self, admin_id: str) -> AdminUserResponse:
        admin = await self._admins.get_by_id(admin_id)
        if not admin:
            raise AdminNotFoundException()
        if not admin.is_active:
            raise AdminSuspendedException()
        return AdminUserResponse(
            id=str(admin.id),
            name=admin.name,
            email=admin.email,
            role=admin.role,
            is_active=admin.is_active,
            status=admin.status.value if hasattr(admin.status, "value") else admin.status,
            onboarded_date=admin.onboarded_date,
            last_login=admin.last_login,
            created_at=admin.created_at,
            updated_at=admin.updated_at,
        )

    # ── Seed all default admin accounts (idempotent) ──────────────────────────

    async def seed_default_admins(self) -> None:
        emails = [entry["email"] for entry in _DEFAULT_ADMINS]
        existing_admins = await AdminUser.find({"email": {"$in": emails}}).to_list()
        existing_emails_set = {a.email for a in existing_admins}
        for entry in _DEFAULT_ADMINS:
            if entry["email"] in existing_emails_set:
                logger.info("Admin already exists — skipping: %s", entry["email"])
                continue
            admin = AdminUser(
                name=entry["name"],
                email=entry["email"],
                username=entry["email"].split("@")[0],  # Unique username derived from email
                password_hash=hash_password(entry["password"]),
                role=entry["role"],
            )
            await self._admins.create(admin)
            logger.info("Admin seeded: %s (%s)", entry["email"], entry["role"].value)

    # ── Private helpers ───────────────────────────────────────────────────────

    async def _issue_tokens(
        self,
        admin: AdminUser,
        user_agent: str = "",
        ip_address: str = "",
    ) -> TokenPair:
        admin_id = str(admin.id)

        access_token, expires_in = create_access_token(
            subject=admin_id,
            token_type=TOKEN_TYPE_ADMIN,
            extra_claims={"role": admin.role, "email": admin.email},
        )

        raw_refresh = generate_refresh_token()
        refresh_hash = hash_refresh_token(raw_refresh)

        session = RefreshTokenSession.create(
            owner_id=admin_id,
            owner_type=TokenOwnerType.ADMIN,
            token_hash=refresh_hash,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        await self._tokens.create(session)

        return TokenPair(
            access_token=access_token,
            refresh_token=raw_refresh,
            expires_in=expires_in,
        )
