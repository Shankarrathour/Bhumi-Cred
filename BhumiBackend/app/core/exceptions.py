from fastapi import HTTPException, status
from typing import Optional


class AppException(HTTPException):
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str = "APP_ERROR",
        headers: Optional[dict] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.error_code = error_code


# ── 400 ──────────────────────────────────────────────────────────────────────

class BadRequestException(AppException):
    def __init__(self, detail: str = "Bad request", error_code: str = "BAD_REQUEST"):
        super().__init__(status.HTTP_400_BAD_REQUEST, detail, error_code)


class OTPExpiredException(BadRequestException):
    def __init__(self):
        super().__init__("OTP has expired. Please request a new one.", "OTP_EXPIRED")


class OTPInvalidException(BadRequestException):
    def __init__(self, attempts_left: int = 0):
        msg = (
            f"Invalid OTP. {attempts_left} attempt(s) remaining."
            if attempts_left > 0
            else "Invalid OTP."
        )
        super().__init__(msg, "OTP_INVALID")


# ── 401 ──────────────────────────────────────────────────────────────────────

class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Unauthorized", error_code: str = "UNAUTHORIZED"):
        super().__init__(
            status.HTTP_401_UNAUTHORIZED,
            detail,
            error_code,
            headers={"WWW-Authenticate": "Bearer"},
        )


class InvalidTokenException(UnauthorizedException):
    def __init__(self, detail: str = "Invalid or expired token"):
        super().__init__(detail, "INVALID_TOKEN")


class InvalidCredentialsException(UnauthorizedException):
    def __init__(self):
        super().__init__("Invalid email or password", "INVALID_CREDENTIALS")


# ── 403 ──────────────────────────────────────────────────────────────────────

class ForbiddenException(AppException):
    def __init__(self, detail: str = "Forbidden", error_code: str = "FORBIDDEN"):
        super().__init__(status.HTTP_403_FORBIDDEN, detail, error_code)


class InsufficientPermissionsException(ForbiddenException):
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(detail, "INSUFFICIENT_PERMISSIONS")


class FarmerBlockedException(ForbiddenException):
    def __init__(self):
        super().__init__("Your account has been blocked. Please contact Bhumi support.", "FARMER_BLOCKED")


class ProfileVerificationPendingException(ForbiddenException):
    def __init__(self):
        super().__init__(
            "Your profile verification is still pending. Once your profile is verified by the Admin, you will be able to use this feature.",
            "PROFILE_VERIFICATION_PENDING",
        )


class ProfileVerificationRejectedException(ForbiddenException):
    def __init__(self):
        super().__init__(
            "Your profile verification was rejected by the Admin. Please update your profile/KYC information and submit it again before using this feature.",
            "PROFILE_VERIFICATION_REJECTED",
        )


class VendorBlockedException(ForbiddenException):
    def __init__(self):
        super().__init__("Your vendor account has been blocked. Please contact Bhumi support.", "VENDOR_BLOCKED")


class AdminSuspendedException(ForbiddenException):
    def __init__(self):
        super().__init__("Admin account has been suspended.", "ADMIN_SUSPENDED")


# ── 404 ──────────────────────────────────────────────────────────────────────

class NotFoundException(AppException):
    def __init__(self, detail: str = "Resource not found", error_code: str = "NOT_FOUND"):
        super().__init__(status.HTTP_404_NOT_FOUND, detail, error_code)


class FarmerNotFoundException(NotFoundException):
    def __init__(self):
        super().__init__("Farmer not found", "FARMER_NOT_FOUND")


class AdminNotFoundException(NotFoundException):
    def __init__(self):
        super().__init__("Admin user not found", "ADMIN_NOT_FOUND")


# ── 409 ──────────────────────────────────────────────────────────────────────

class ConflictException(AppException):
    def __init__(self, detail: str = "Resource already exists", error_code: str = "CONFLICT"):
        super().__init__(status.HTTP_409_CONFLICT, detail, error_code)


# ── 429 ──────────────────────────────────────────────────────────────────────

class TooManyRequestsException(AppException):
    def __init__(self, detail: str = "Too many requests", error_code: str = "RATE_LIMITED"):
        super().__init__(status.HTTP_429_TOO_MANY_REQUESTS, detail, error_code)


class OTPMaxAttemptsException(TooManyRequestsException):
    def __init__(self):
        super().__init__(
            "Maximum OTP attempts exceeded. Please request a new OTP.",
            "OTP_MAX_ATTEMPTS",
        )


# ── Phase 2: 404 ─────────────────────────────────────────────────────────────

class FamilyMemberNotFoundException(NotFoundException):
    def __init__(self):
        super().__init__("Family member not found", "FAMILY_MEMBER_NOT_FOUND")


class LandParcelNotFoundException(NotFoundException):
    def __init__(self):
        super().__init__("Land parcel not found", "LAND_PARCEL_NOT_FOUND")


# ── Auth flow: mobile registration guards ────────────────────────────────────

class MobileAlreadyRegisteredException(ConflictException):
    def __init__(self):
        super().__init__(
            "Mobile number is already registered. Please login.",
            "MOBILE_ALREADY_REGISTERED",
        )


class MobileNotRegisteredException(NotFoundException):
    def __init__(self):
        super().__init__(
            "Mobile number not registered. Please register first.",
            "MOBILE_NOT_REGISTERED",
        )


class AccountRoleMismatchException(BadRequestException):
    """Raised when a mobile number is registered under a different role than requested."""

    def __init__(self, actual_role: str):
        label = "Vendor" if actual_role == "vendor" else "Farmer"
        super().__init__(
            f"This mobile number is registered as a {label}. Please select 'Login as {label}'.",
            "ACCOUNT_ROLE_MISMATCH",
        )


# ── Phase 2: 409 ─────────────────────────────────────────────────────────────

class KYCAlreadyApprovedException(ConflictException):
    def __init__(self):
        super().__init__(
            "KYC is already approved. Identity details cannot be modified.",
            "KYC_ALREADY_APPROVED",
        )


# ── Wallet: 404 ──────────────────────────────────────────────────────────────

class WalletNotFoundException(NotFoundException):
    def __init__(self):
        super().__init__("Wallet not found", "WALLET_NOT_FOUND")


class BankAccountNotFoundException(NotFoundException):
    def __init__(self):
        super().__init__("No linked bank account found", "BANK_ACCOUNT_NOT_FOUND")


class WithdrawalNotFoundException(NotFoundException):
    def __init__(self):
        super().__init__("Withdrawal request not found", "WITHDRAWAL_NOT_FOUND")


# ── Wallet: 400 ──────────────────────────────────────────────────────────────

class InsufficientBalanceException(BadRequestException):
    def __init__(self):
        super().__init__(
            "Insufficient wallet balance for this withdrawal.", "INSUFFICIENT_BALANCE"
        )


class PendingWithdrawalExistsException(BadRequestException):
    def __init__(self):
        super().__init__(
            "A withdrawal request is already pending. Please wait for it to be processed.",
            "PENDING_WITHDRAWAL_EXISTS",
        )


class WithdrawalAlreadyProcessedException(BadRequestException):
    def __init__(self):
        super().__init__(
            "This withdrawal request has already been processed.", "WITHDRAWAL_ALREADY_PROCESSED"
        )


class MaxBankAccountsException(BadRequestException):
    def __init__(self):
        super().__init__(
            "Maximum of 3 bank accounts allowed. Please delete an existing account first.",
            "MAX_BANK_ACCOUNTS_REACHED",
        )


# ── 500 ──────────────────────────────────────────────────────────────────────

class InternalServerException(AppException):
    def __init__(self, detail: str = "Internal server error"):
        super().__init__(status.HTTP_500_INTERNAL_SERVER_ERROR, detail, "INTERNAL_ERROR")
