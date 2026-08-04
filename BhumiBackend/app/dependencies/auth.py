from typing import Annotated
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.auth.jwt import decode_access_token, TOKEN_TYPE_FARMER, TOKEN_TYPE_ADMIN, TOKEN_TYPE_VENDOR
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
from app.models.vendor import Vendor
from app.models.admin_user import AdminUser, AdminRole
from app.repositories.farmer import FarmerRepository
from app.repositories.admin_user import AdminUserRepository
from app.repositories.vendor import VendorRepository
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
    if not farmer:
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

# ── Vendor dependencies ───────────────────────────────────────────────────────

async def get_current_vendor(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> Vendor:
    token = _extract_token(credentials)
    payload = decode_access_token(token)

    if payload.get("type") != TOKEN_TYPE_VENDOR:
        raise InvalidTokenException("Token is not a vendor token.")

    vendor_id = payload.get("sub")
    if not vendor_id:
        raise InvalidTokenException("Token missing subject claim.")

    vendor = await Vendor.get(vendor_id)
    if not vendor:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Vendor not found.")
        
    if vendor.status == "Rejected":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Vendor account rejected.")

    user_id_var.set(str(vendor.id))
    return vendor

CurrentVendor = Annotated[Vendor, Depends(get_current_vendor)]


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

# ── Vendor dependencies ───────────────────────────────────────────────────────

async def get_current_vendor(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> Vendor:
    token = _extract_token(credentials)
    payload = decode_access_token(token)

    if payload.get("type") != TOKEN_TYPE_VENDOR:
        raise InvalidTokenException("Token is not a vendor token.")

    vendor_id = payload.get("sub")
    if not vendor_id:
        raise InvalidTokenException("Token missing subject claim.")

    repo = VendorRepository()
    vendor = await repo.get_by_id(vendor_id)
    if not vendor:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="VENDOR_NOT_FOUND",
            detail="Vendor not found."
        )
    if not vendor.is_active:
        raise AppException(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="VENDOR_BLOCKED",
            detail="Vendor account is blocked."
        )

    user_id_var.set(f"vendor:{vendor_id}")
    return vendor

CurrentVendor = Annotated[Vendor, Depends(get_current_vendor)]

async def get_verified_vendor(
    vendor: Vendor = Depends(get_current_vendor)
) -> Vendor:
    if not vendor.is_verified:
        raise AppException(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="VENDOR_UNVERIFIED",
            detail="Vendor account is pending verification."
        )
    return vendor

VerifiedVendor = Annotated[Vendor, Depends(get_verified_vendor)]
