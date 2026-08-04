import hashlib
import uuid
from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends, Request, HTTPException, status

from app.dependencies.services import get_admin_auth_service
from app.dependencies.auth import CurrentAdmin
from app.services.admin_auth_service import AdminAuthService
from app.utils.request import get_client_info
from app.models.admin_user import AdminUser
from app.models.user_session import UserSession
from app.models.password_reset import PasswordResetToken
from app.schemas.auth import (
    AdminLoginRequest,
    RefreshTokenRequest,
    AdminAuthResponse,
    TokenPair,
)
from app.schemas.admin_user import AdminUserResponse
from app.schemas.common import MessageResponse
from app.schemas.admin_auth_ext import (
    PasswordResetRequestSchema,
    PasswordResetConfirmSchema,
    UserSessionResponseSchema,
)

router = APIRouter(prefix="/admin/auth", tags=["Admin Auth & Sessions"])


@router.post(
    "/login",
    response_model=AdminAuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Admin login",
    description="Authenticates an admin user with email and password. Returns JWT access + refresh tokens and the admin profile.",
)
async def admin_login(
    payload: AdminLoginRequest,
    request: Request,
    svc: AdminAuthService = Depends(get_admin_auth_service),
) -> AdminAuthResponse:
    ua, ip = get_client_info(request)
    return await svc.login(
        email=str(payload.email),
        password=payload.password,
        role=payload.role,
        user_agent=ua,
        ip_address=ip,
    )


@router.post(
    "/refresh",
    response_model=TokenPair,
    status_code=status.HTTP_200_OK,
    summary="Refresh admin access token",
    description="Exchange a valid admin refresh token for a new access token (token rotation).",
)
async def admin_refresh(
    payload: RefreshTokenRequest,
    request: Request,
    svc: AdminAuthService = Depends(get_admin_auth_service),
) -> TokenPair:
    ua, ip = get_client_info(request)
    return await svc.refresh_token(
        raw_refresh_token=payload.refresh_token,
        user_agent=ua,
        ip_address=ip,
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Admin logout",
    description="Revokes the provided admin refresh token.",
)
async def admin_logout(
    payload: RefreshTokenRequest,
    request: Request,
    svc: AdminAuthService = Depends(get_admin_auth_service),
) -> MessageResponse:
    _, ip = get_client_info(request)
    await svc.logout(raw_refresh_token=payload.refresh_token, ip_address=ip)
    return MessageResponse(message="Logged out successfully.")


@router.get(
    "/verify",
    response_model=AdminUserResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify admin session",
    description="Validates the current admin access token and returns the admin profile.",
)
async def admin_verify(
    current_admin: CurrentAdmin,
    svc: AdminAuthService = Depends(get_admin_auth_service),
) -> AdminUserResponse:
    return await svc.get_current_admin(str(current_admin.id))


@router.get(
    "/employees",
    response_model=list[AdminUserResponse],
    status_code=status.HTTP_200_OK,
    summary="List all admin employees",
    description="Returns all registered admin staff users.",
)
async def list_employees(
    current_admin: CurrentAdmin,
    svc: AdminAuthService = Depends(get_admin_auth_service),
) -> list[AdminUserResponse]:
    return await svc.list_employees()


@router.post(
    "/password-reset/request",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Request Password Reset Token",
    description="Generates a single-use password reset token for the specified admin email.",
)
async def request_password_reset(
    payload: PasswordResetRequestSchema,
    request: Request,
):
    user = await AdminUser.find_one(AdminUser.email == payload.email)
    if not user:
        # Prevent user enumeration attacks
        return MessageResponse(message="If the email is registered, a password reset token has been issued.")

    raw_token = str(uuid.uuid4())
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    ua, ip = get_client_info(request)

    reset_token = PasswordResetToken(
        user_id=str(user.id),
        email=payload.email,
        token_hash=token_hash,
        is_used=False,
        request_ip=ip,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
    )
    await reset_token.insert()

    return MessageResponse(message=f"Password reset token generated: {raw_token}")


@router.post(
    "/password-reset/confirm",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Confirm Password Reset",
    description="Resets the admin account password using a single-use token.",
)
async def confirm_password_reset(
    payload: PasswordResetConfirmSchema,
):
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()
    reset_entry = await PasswordResetToken.find_one(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.is_used == False,
    )

    if not reset_entry or reset_entry.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token.",
        )

    user = await AdminUser.get(reset_entry.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    from app.core.security import hash_password
    user.password_hash = hash_password(payload.new_password)
    await user.save()

    reset_entry.is_used = True
    reset_entry.used_at = datetime.now(timezone.utc)
    await reset_entry.save()

    return MessageResponse(message="Password reset successfully.")


@router.get(
    "/sessions",
    response_model=List[UserSessionResponseSchema],
    status_code=status.HTTP_200_OK,
    summary="List Active User Sessions",
    description="Returns all active login sessions for the currently logged-in admin.",
)
async def list_active_sessions(
    current_admin: CurrentAdmin,
):
    sessions = await UserSession.find(
        UserSession.user.id == current_admin.id,
        UserSession.is_active == True,
    ).to_list()

    return [
        UserSessionResponseSchema(
            id=str(s.id),
            user_id=str(current_admin.id),
            session_token=s.session_token,
            device_name=s.device_name,
            device_type=s.device_type,
            ip_address=s.ip_address,
            city=s.city,
            country=s.country,
            is_active=s.is_active,
            last_activity_at=s.last_activity_at,
            created_at=s.created_at,
        )
        for s in sessions
    ]


@router.post(
    "/sessions/{session_id}/revoke",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Revoke Active Session",
    description="Invalidates a specific active login session.",
)
async def revoke_session(
    session_id: str,
    current_admin: CurrentAdmin,
):
    session = await UserSession.get(session_id)
    if not session or str(session.user.id) != str(current_admin.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    session.is_active = False
    await session.save()

    return MessageResponse(message="Session revoked successfully.")
