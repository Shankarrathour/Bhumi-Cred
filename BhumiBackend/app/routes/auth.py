from fastapi import APIRouter, Depends, Request, status

from app.dependencies.services import get_auth_service
from app.services.auth_service import AuthService
from app.utils.request import get_client_info
from app.schemas.auth import (
    SendOTPRequest,
    VerifyOTPRequest,
    RegisterRequest,
    RefreshTokenRequest,
    SendOTPResponse,
    RoleAuthResponse,
    TokenPair,
)
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/auth", tags=["Farmer Auth"])


@router.post(
    "/send-otp",
    response_model=SendOTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Send OTP to farmer mobile",
    description=(
        "Sends a one-time password to the given mobile number. "
        "In development mode the OTP is returned in `otp_debug` for testing."
    ),
)
async def send_otp(
    payload: SendOTPRequest,
    svc: AuthService = Depends(get_auth_service),
) -> SendOTPResponse:
    return await svc.send_otp(mobile=payload.mobile)


@router.post(
    "/register/send-otp",
    response_model=SendOTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Send OTP for new registration",
    description=(
        "Registration-only endpoint. Returns 409 if the mobile is already registered. "
        "Creates a farmer record and sends an OTP."
    ),
)
async def register_send_otp(
    payload: SendOTPRequest,
    svc: AuthService = Depends(get_auth_service),
) -> SendOTPResponse:
    return await svc.register_send_otp(mobile=payload.mobile, role=payload.role)


@router.post(
    "/login/send-otp",
    response_model=SendOTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Send OTP for existing-account login",
    description=(
        "Login-only endpoint. Returns 404 if the mobile is not registered. "
        "Sends an OTP to the existing farmer's mobile."
    ),
)
async def login_send_otp(
    payload: SendOTPRequest,
    svc: AuthService = Depends(get_auth_service),
) -> SendOTPResponse:
    return await svc.login_send_otp(mobile=payload.mobile, role=payload.role)


@router.post(
    "/verify-otp",
    response_model=RoleAuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify OTP and authenticate (farmer or vendor)",
    description=(
        "Verifies the OTP sent to the given mobile number for the requested role. "
        "Creates a new farmer/vendor account if the mobile is not registered. "
        "Returns JWT access + refresh tokens, discriminated by `role`."
    ),
)
async def verify_otp(
    payload: VerifyOTPRequest,
    request: Request,
    svc: AuthService = Depends(get_auth_service),
) -> RoleAuthResponse:
    ua, ip = get_client_info(request)
    return await svc.verify_otp(
        mobile=payload.mobile,
        otp=payload.otp,
        role=payload.role,
        user_agent=ua,
        ip_address=ip,
    )


@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Pre-register a mobile number",
    description=(
        "Pre-registers a mobile number before OTP verification. "
        "Idempotent — safe to call multiple times for the same number."
    ),
)
async def register(
    payload: RegisterRequest,
    svc: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    result = await svc.register(mobile=payload.mobile)
    return MessageResponse(message=result["message"])


@router.post(
    "/refresh",
    response_model=TokenPair,
    status_code=status.HTTP_200_OK,
    summary="Refresh farmer access token",
    description="Exchange a valid refresh token for a new access token (token rotation).",
)
async def refresh_token(
    payload: RefreshTokenRequest,
    request: Request,
    svc: AuthService = Depends(get_auth_service),
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
    summary="Logout farmer",
    description="Revokes the provided refresh token. Use this on app sign-out.",
)
async def logout(
    payload: RefreshTokenRequest,
    request: Request,
    svc: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    _, ip = get_client_info(request)
    await svc.logout(raw_refresh_token=payload.refresh_token, ip_address=ip)
    return MessageResponse(message="Logged out successfully.")
