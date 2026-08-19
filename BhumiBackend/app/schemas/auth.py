import re
from pydantic import BaseModel, field_validator, EmailStr
from typing import Literal, Optional
from app.models.admin_user import AdminRole
from app.schemas.farmer import FarmerPublicResponse
from app.schemas.admin_user import AdminUserResponse
AuthRole = Literal["farmer", "govt_body", "partner"]

MOBILE_RE = re.compile(r"^[6-9]\d{9}$")


# ── Farmer Auth Requests ──────────────────────────────────────────────────────

class SendOTPRequest(BaseModel):
    mobile: str
    role: AuthRole = "farmer"

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        v = v.strip()
        if not MOBILE_RE.match(v):
            raise ValueError("Mobile must be a valid 10-digit Indian mobile number.")
        return v


class VerifyOTPRequest(BaseModel):
    mobile: str
    otp: str
    role: AuthRole = "farmer"

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        v = v.strip()
        if not MOBILE_RE.match(v):
            raise ValueError("Mobile must be a valid 10-digit Indian mobile number.")
        return v

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) not in (4, 6):
            raise ValueError("OTP must be 4 or 6 digits.")
        return v


class RegisterRequest(BaseModel):
    mobile: str
    role: AuthRole = "farmer"

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        v = v.strip()
        if not MOBILE_RE.match(v):
            raise ValueError("Mobile must be a valid 10-digit Indian mobile number.")
        return v


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ── Admin Auth Requests ───────────────────────────────────────────────────────

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: Optional[AdminRole] = None  # optional role hint for multi-role future


# ── Auth Responses ────────────────────────────────────────────────────────────

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds until access token expires


class FarmerAuthResponse(BaseModel):
    tokens: TokenPair
    farmer: FarmerPublicResponse
    is_new: bool = False  # True if farmer was just created


class RoleAuthResponse(BaseModel):
    """
    Role-aware OTP verification response. `farmer` is populated for all roles (farmer,
    govt_body, partner) for backward compatibility with existing clients that destructure `{ tokens, farmer }`.
    """
    tokens: TokenPair
    role: AuthRole
    is_new: bool = False
    farmer: Optional[FarmerPublicResponse] = None


class AdminAuthResponse(BaseModel):
    tokens: TokenPair
    admin: AdminUserResponse


class SendOTPResponse(BaseModel):
    message: str
    mobile: str
    # In production: never expose OTP. In development only (set by service layer).
    otp_debug: Optional[str] = None
