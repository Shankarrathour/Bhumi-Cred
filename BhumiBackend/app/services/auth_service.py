import logging
from datetime import datetime, timezone

from app.auth.jwt import create_access_token, TOKEN_TYPE_FARMER, TOKEN_TYPE_GOVT, TOKEN_TYPE_PARTNER
from app.auth.password import hash_otp, verify_otp
from app.auth.otp import generate_otp, generate_refresh_token, hash_refresh_token
from app.config.settings import settings
from app.core.exceptions import (
    OTPExpiredException,
    OTPInvalidException,
    OTPMaxAttemptsException,
    FarmerBlockedException,
    InvalidTokenException,
    MobileAlreadyRegisteredException,
    MobileNotRegisteredException,
    AccountRoleMismatchException,
)
from app.integrations.sms import send_otp_sms
from app.models.farmer import Farmer, KYCStatus
from app.models.otp_session import OTPSession
from app.models.refresh_token import RefreshTokenSession, TokenOwnerType
from app.repositories.audit_log import AuditLogRepository
from app.repositories.farmer import FarmerRepository
from app.repositories.otp_session import OTPSessionRepository
from app.repositories.refresh_token import RefreshTokenRepository
from app.schemas.auth import (
    TokenPair,
    FarmerAuthResponse,
    RoleAuthResponse,
    SendOTPResponse,
)
from app.schemas.farmer import FarmerPublicResponse
from app.repositories.notification import NotificationRepository
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(
        self,
        farmer_repo: FarmerRepository,
        otp_repo: OTPSessionRepository,
        token_repo: RefreshTokenRepository,
        audit_repo: AuditLogRepository,
        notification_service: NotificationService | None = None,
    ):
        self._farmers = farmer_repo
        self._otps = otp_repo
        self._tokens = token_repo
        self._audit = audit_repo
        self._notifications = notification_service or NotificationService(NotificationRepository())

    # ── Send OTP variants ────────────────────────────────────────────────────

    async def send_otp(self, mobile: str) -> SendOTPResponse:
        """Legacy endpoint — no existence check; kept for backward compatibility."""
        return await self._do_send_otp(mobile, role="farmer")

    async def register_send_otp(self, mobile: str, role: str = "farmer") -> SendOTPResponse:
        """Registration flow: mobile must not belong to an active registration."""
        existing = await self._farmers.get_by_mobile(mobile)
        if existing:
            if getattr(existing, "role", "farmer") != role:
                raise AccountRoleMismatchException(getattr(existing, "role", "farmer"))
            if existing.kyc_status != KYCStatus.UNVERIFIED:
                raise MobileAlreadyRegisteredException()
        return await self._do_send_otp(mobile, role=role)

    async def login_send_otp(self, mobile: str, role: str = "farmer") -> SendOTPResponse:
        """Login flow: mobile must belong to an existing account under the requested role."""
        existing = await self._farmers.get_by_mobile(mobile)
        if not existing or (
            existing.kyc_status == KYCStatus.UNVERIFIED
            and not existing.onboarding_completed
        ):
            raise MobileNotRegisteredException()
        if getattr(existing, "role", "farmer") != role:
            raise AccountRoleMismatchException(getattr(existing, "role", "farmer"))
        return await self._do_send_otp(mobile, role=role)

    # ── Private helpers ───────────────────────────────────────────────────────

    async def _do_send_otp(self, mobile: str, role: str = "farmer") -> SendOTPResponse:
        otp = generate_otp()
        otp_hash = hash_otp(otp)
        await self._otps.invalidate_all_for_mobile(mobile, role=role)
        session = OTPSession.create_for_mobile(mobile, otp_hash, role=role)
        await self._otps.create(session)
        await send_otp_sms(mobile, otp)
        response = SendOTPResponse(message=f"OTP sent to {mobile}.", mobile=mobile)
        if settings.is_development:
            response.otp_debug = otp
        return response

    # ── Verify OTP ───────────────────────────────────────────────────────────

    async def verify_otp(
        self,
        mobile: str,
        otp: str,
        role: str = "farmer",
        user_agent: str = "",
        ip_address: str = "",
    ) -> RoleAuthResponse:
        await self._consume_otp(mobile, otp, role=role)

        farmer, is_new = await self._farmers.find_or_create(mobile, role=role)

        if not farmer.is_active:
            raise FarmerBlockedException()

        owner_type = TokenOwnerType.FARMER
        token_type = TOKEN_TYPE_FARMER
        if role == "govt_body":
            owner_type = TokenOwnerType.GOVT
            token_type = TOKEN_TYPE_GOVT
        elif role == "partner":
            owner_type = TokenOwnerType.PARTNER
            token_type = TOKEN_TYPE_PARTNER

        token_pair = await self._issue_tokens(
            farmer, token_type=token_type, owner_type=owner_type, user_agent=user_agent, ip_address=ip_address
        )

        await self._audit.log_event(
            action=f"{role.upper()}_REGISTERED" if is_new else f"{role.upper()}_LOGIN",
            entity_type="Farmer",
            entity_id=str(farmer.id),
            admin_id=str(farmer.id),
            admin_name=farmer.full_name or farmer.mobile,
            actor_type=role,
            actor_role=role,
            ip_address=ip_address,
            remarks=f"Authenticated as {role} via OTP verification.",
        )

        if is_new and role == "farmer":
            try:
                await self._notifications.create_admin_notification(
                    "Farmer Registered",
                    f"Farmer {farmer.farmer_id} ({farmer.full_name or 'Unknown'}) has successfully registered.",
                    type="registration",
                    actor_type="farmer",
                )
            except Exception:
                logger.exception(f"Failed to create admin notification for new farmer {farmer.id}")

        return RoleAuthResponse(
            tokens=token_pair,
            role=role,
            is_new=is_new,
            farmer=FarmerPublicResponse(
                id=str(farmer.id),
                farmer_id=farmer.farmer_id,
                mobile=farmer.mobile,
                full_name=farmer.full_name,
                kyc_status=farmer.kyc_status,
                onboarding_completed=farmer.onboarding_completed,
                wallet_balance=farmer.wallet_balance,
                sustainability_score=farmer.sustainability_score,
                locale=farmer.locale,
            ),
        )

    async def _consume_otp(self, mobile: str, otp: str, role: str) -> None:
        """Shared OTP validation — same OTPSession infrastructure for both roles."""
        session = await self._otps.get_active_for_mobile(mobile, role=role)

        if not session:
            raise OTPExpiredException()

        if session.attempts >= settings.OTP_MAX_ATTEMPTS:
            raise OTPMaxAttemptsException()

        if not verify_otp(otp, session.otp_hash):
            await self._otps.increment_attempts(session)
            attempts_left = settings.OTP_MAX_ATTEMPTS - session.attempts
            raise OTPInvalidException(attempts_left=max(0, attempts_left))

        await self._otps.mark_verified(session)

    async def _verify_otp_farmer(
        self,
        mobile: str,
        otp: str,
        user_agent: str = "",
        ip_address: str = "",
    ) -> RoleAuthResponse:
        await self._consume_otp(mobile, otp, role="farmer")

        # Find or create farmer
        farmer, is_new = await self._farmers.find_or_create(mobile)

        if not farmer.is_active:
            raise FarmerBlockedException()

        # Issue tokens
        token_pair = await self._issue_tokens(
            farmer, user_agent=user_agent, ip_address=ip_address
        )

        await self._audit.log_event(
            action="FARMER_REGISTERED" if is_new else "FARMER_LOGIN",
            entity_type="Farmer",
            entity_id=str(farmer.id),
            admin_id=str(farmer.id),
            admin_name=farmer.full_name or farmer.mobile,
            actor_type="farmer",
            actor_role="farmer",
            ip_address=ip_address,
            remarks="Authenticated via OTP verification.",
        )

        if is_new:
            try:
                await self._notifications.create_admin_notification(
                    "Farmer Registered",
                    f"Farmer {farmer.farmer_id} ({farmer.full_name or 'Unknown'}) has successfully registered.",
                    type="registration",
                    actor_type="farmer",
                )
            except Exception:
                logger.exception(f"Failed to create admin notification for new farmer {farmer.id}")

        return RoleAuthResponse(
            tokens=token_pair,
            role="farmer",
            is_new=is_new,
            farmer=FarmerPublicResponse(
                id=str(farmer.id),
                farmer_id=farmer.farmer_id,
                mobile=farmer.mobile,
                full_name=farmer.full_name,
                kyc_status=farmer.kyc_status,
                onboarding_completed=farmer.onboarding_completed,
                wallet_balance=farmer.wallet_balance,
                sustainability_score=farmer.sustainability_score,
                locale=farmer.locale,
            ),
        )

    async def _verify_otp_vendor(
        self,
        mobile: str,
        otp: str,
        user_agent: str = "",
        ip_address: str = "",
    ) -> RoleAuthResponse:
        await self._consume_otp(mobile, otp, role="vendor")

        vendor, is_new = await self._vendors.find_or_create(mobile)

        if not vendor.is_active:
            raise VendorBlockedException()

        token_pair = await self._issue_vendor_tokens(
            vendor, user_agent=user_agent, ip_address=ip_address
        )

        await self._audit.log_event(
            action="VENDOR_REGISTERED" if is_new else "VENDOR_LOGIN",
            entity_type="Vendor",
            entity_id=str(vendor.id),
            admin_id=str(vendor.id),
            admin_name=vendor.name or vendor.phone,
            actor_type="vendor",
            actor_role="vendor",
            ip_address=ip_address,
            remarks="Authenticated via OTP verification.",
        )

        if is_new:
            try:
                await self._notifications.create_admin_notification(
                    "Vendor Registration",
                    f"Vendor {vendor.vendor_id} registered successfully.",
                    type="registration",
                    actor_type="vendor",
                )
            except Exception:
                logger.exception(f"Failed to create admin notification for new vendor {vendor.id}")

        return RoleAuthResponse(
            tokens=token_pair,
            role="vendor",
            is_new=is_new,
            vendor=VendorProfileResponse(
                id=str(vendor.id),
                name=vendor.name,
                email=vendor.email,
                phone=vendor.phone,
                business_name=vendor.business_name,
                gst_number=vendor.gst_number,
                address=vendor.address,
                is_active=vendor.is_active,
                is_verified=vendor.is_verified,
                status=vendor.status,
                rejection_reason=vendor.rejection_reason,
                wallet_balance=vendor.wallet_balance,
                created_at=vendor.created_at,
                updated_at=vendor.updated_at,
            ),
        )

    # ── Register ─────────────────────────────────────────────────────────────

    async def register(self, mobile: str) -> dict:
        """
        Pre-register a mobile number — creates farmer record if it doesn't exist.
        The actual authentication still requires OTP.
        """
        farmer, is_new = await self._farmers.find_or_create(mobile)
        return {
            "message": "Mobile registered successfully. Proceed to verify OTP.",
            "is_new": is_new,
        }

    # ── Refresh Token ─────────────────────────────────────────────────────────

    async def refresh_token(
        self,
        raw_refresh_token: str,
        user_agent: str = "",
        ip_address: str = "",
    ) -> TokenPair:
        token_hash = hash_refresh_token(raw_refresh_token)
        session = await self._tokens.get_active_by_hash(token_hash)

        if not session:
            raise InvalidTokenException("Invalid or expired refresh token.")

        if session.owner_type not in (TokenOwnerType.FARMER, TokenOwnerType.GOVT, TokenOwnerType.PARTNER):
            raise InvalidTokenException("Invalid or expired refresh token.")

        farmer = await self._farmers.get_by_id(session.owner_id)
        if not farmer or not farmer.is_active:
            await self._tokens.revoke(session)
            raise FarmerBlockedException()

        token_type = TOKEN_TYPE_FARMER
        if session.owner_type == TokenOwnerType.GOVT:
            token_type = TOKEN_TYPE_GOVT
        elif session.owner_type == TokenOwnerType.PARTNER:
            token_type = TOKEN_TYPE_PARTNER

        await self._tokens.revoke(session)
        return await self._issue_tokens(
            farmer, token_type=token_type, owner_type=session.owner_type, user_agent=user_agent, ip_address=ip_address
        )

    # ── Logout ────────────────────────────────────────────────────────────────

    async def logout(self, raw_refresh_token: str, ip_address: str = "") -> None:
        token_hash = hash_refresh_token(raw_refresh_token)
        session = await self._tokens.get_by_hash(token_hash)
        if session:
            await self._tokens.revoke(session)
            farmer = await self._farmers.get_by_id(session.owner_id)
            if farmer:
                role = getattr(farmer, "role", "farmer")
                await self._audit.log_event(
                    action=f"{role.upper()}_LOGOUT",
                    entity_type="Farmer",
                    entity_id=str(farmer.id),
                    admin_id=str(farmer.id),
                    admin_name=farmer.full_name or farmer.mobile,
                    actor_type=role,
                    actor_role=role,
                    ip_address=ip_address,
                )

    async def _issue_tokens(
        self,
        farmer: Farmer,
        token_type: str = TOKEN_TYPE_FARMER,
        owner_type: TokenOwnerType = TokenOwnerType.FARMER,
        user_agent: str = "",
        ip_address: str = "",
    ) -> TokenPair:
        farmer_id = str(farmer.id)

        access_token, expires_in = create_access_token(
            subject=farmer_id,
            token_type=token_type,
            extra_claims={"mobile": farmer.mobile},
        )

        raw_refresh = generate_refresh_token()
        refresh_hash = hash_refresh_token(raw_refresh)

        session = RefreshTokenSession.create(
            owner_id=farmer_id,
            owner_type=owner_type,
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
