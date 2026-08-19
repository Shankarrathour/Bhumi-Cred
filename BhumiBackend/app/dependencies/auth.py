from typing import Annotated
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.auth.jwt import decode_access_token, TOKEN_TYPE_FARMER, TOKEN_TYPE_ADMIN, TOKEN_TYPE_GOVT, TOKEN_TYPE_PARTNER
from app.core.context import user_id_var
from app.core.exceptions import (
    InvalidTokenException,
    FarmerNotFoundException,
    FarmerBlockedException,
    AdminNotFoundException,
    AdminSuspendedException,
    InsufficientPermissionsException,
    ProfileVerificationPendingException,
    ProfileVerificationRejectedException,
    AppException
)
from app.models.farmer import Farmer, KYCStatus
from app.models.admin_user import AdminUser, AdminRole
from app.repositories.farmer import FarmerRepository
from app.repositories.admin_user import AdminUserRepository
from fastapi import status

_bearer = HTTPBearer(auto_error=False)


def _extract_token(
    credentials: HTTPAuthorizationCredentials | None,
) -> str:
    if not credentials or not credentials.credentials:
        raise InvalidTokenException("Missing Authorization header.")
    return credentials.credentials


# ── Farmer dependencies ───────────────────────────────────────────────────────

async def get_current_farmer(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> Farmer:
    token = _extract_token(credentials)
    payload = decode_access_token(token)

    if payload.get("type") != TOKEN_TYPE_FARMER:
        raise InvalidTokenException("Token is not a farmer token.")

    farmer_id = payload.get("sub")
    if not farmer_id:
        raise InvalidTokenException("Token missing subject claim.")

    repo = FarmerRepository()
    farmer = await repo.get_by_id(farmer_id)
    if not farmer or getattr(farmer, "role", "farmer") != "farmer":
        raise FarmerNotFoundException()
    if not farmer.is_active:
        raise FarmerBlockedException()

    user_id_var.set(str(farmer.id))
    return farmer


CurrentFarmer = Annotated[Farmer, Depends(get_current_farmer)]


async def get_optional_farmer(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> Farmer | None:
    if not credentials or not credentials.credentials:
        return None
    try:
        return await get_current_farmer(credentials)
    except InvalidTokenException:
        return None


OptionalFarmer = Annotated[Farmer | None, Depends(get_optional_farmer)]


async def get_verified_farmer(
    farmer: Farmer = Depends(get_current_farmer)
) -> Farmer:
    """
    Gate for actions that must not run until the Admin has approved the farmer's
    KYC. Browsing/read endpoints should keep using CurrentFarmer; only
    state-changing "protected actions" (add/edit/delete land, tree & green-family
    registration, project enrollment, marketplace purchase, wallet withdrawal,
    scheme applications, etc.) should depend on VerifiedFarmer instead.

    Profile/KYC/identity/bank/family editing endpoints must keep using
    CurrentFarmer, not VerifiedFarmer — a pending/rejected farmer must still be
    able to fix and resubmit their own KYC details.
    """
    if farmer.kyc_status == KYCStatus.REJECTED:
        raise ProfileVerificationRejectedException()
    if farmer.kyc_status != KYCStatus.APPROVED:
        raise ProfileVerificationPendingException()
    return farmer


VerifiedFarmer = Annotated[Farmer, Depends(get_verified_farmer)]

# ── Govt Body dependencies ───────────────────────────────────────────────────

async def get_current_govt_body(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> Farmer:
    token = _extract_token(credentials)
    payload = decode_access_token(token)

    if payload.get("type") != TOKEN_TYPE_GOVT:
        raise InvalidTokenException("Token is not a government body token.")

    user_id = payload.get("sub")
    if not user_id:
        raise InvalidTokenException("Token missing subject claim.")

    repo = FarmerRepository()
    user = await repo.get_by_id(user_id)
    if not user or getattr(user, "role", "farmer") != "govt_body":
        raise FarmerNotFoundException()
    if not user.is_active:
        raise FarmerBlockedException()

    user_id_var.set(f"govt_body:{user_id}")
    return user

CurrentGovtBody = Annotated[Farmer, Depends(get_current_govt_body)]


# ── Partner dependencies ─────────────────────────────────────────────────────

async def get_current_partner(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> Farmer:
    token = _extract_token(credentials)
    payload = decode_access_token(token)

    if payload.get("type") != TOKEN_TYPE_PARTNER:
        raise InvalidTokenException("Token is not a partner token.")

    user_id = payload.get("sub")
    if not user_id:
        raise InvalidTokenException("Token missing subject claim.")

    repo = FarmerRepository()
    user = await repo.get_by_id(user_id)
    if not user or getattr(user, "role", "farmer") != "partner":
        raise FarmerNotFoundException()
    if not user.is_active:
        raise FarmerBlockedException()

    user_id_var.set(f"partner:{user_id}")
    return user

CurrentPartner = Annotated[Farmer, Depends(get_current_partner)]


# ── Admin dependencies ────────────────────────────────────────────────────────

async def get_current_admin(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> AdminUser:
    token = _extract_token(credentials)
    payload = decode_access_token(token)

    if payload.get("type") != TOKEN_TYPE_ADMIN:
        raise InvalidTokenException("Token is not an admin token.")

    admin_id = payload.get("sub")
    if not admin_id:
        raise InvalidTokenException("Token missing subject claim.")

    repo = AdminUserRepository()
    admin = await repo.get_by_id(admin_id)
    if not admin:
        raise AdminNotFoundException()
    if not admin.is_active:
        raise AdminSuspendedException()

    user_id_var.set(f"admin:{admin_id}")
    return admin


CurrentAdmin = Annotated[AdminUser, Depends(get_current_admin)]


def require_roles(*roles: AdminRole):
    """
    Factory that returns a dependency enforcing at least one of the given roles.

    Usage:
        @router.get("/...", dependencies=[Depends(require_roles(AdminRole.SUPER_ADMIN))])
    """
    async def _checker(admin: CurrentAdmin) -> AdminUser:
        if admin.role not in roles:
            raise InsufficientPermissionsException(
                f"Required role(s): {', '.join(r.value for r in roles)}."
            )
        return admin

    return _checker


