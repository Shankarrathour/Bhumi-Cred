from typing import Callable
from fastapi import Depends, HTTPException, status
from app.core.exceptions import AppException
from app.models.admin_user import AdminUser, AdminRole
from app.models.role import Role
from app.dependencies.auth import get_current_admin


def RequirePermission(module: str, action: str) -> Callable:
    """FastAPI Dependency Guard that verifies if the current logged-in admin

    user has the specified permission action on the given module.
    """
    async def permission_checker(
        current_admin: AdminUser = Depends(get_current_admin),
    ) -> AdminUser:
        # Super Admin bypasses all checks
        if current_admin.role == AdminRole.SUPER_ADMIN or current_admin.role == "super_admin":
            return current_admin

        # Fetch linked Role model or lookup role by code
        role_obj: Role | None = None
        if current_admin.role_ref:
            role_obj = await current_admin.role_ref.fetch()
        if not role_obj and current_admin.role:
            role_obj = await Role.find_one(Role.code == str(current_admin.role))

        if not role_obj:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No role permission configured for admin role '{current_admin.role}'",
            )

        module_perms = role_obj.permissions.get(module)
        if not module_perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: No permissions configured for module '{module}'",
            )

        action_allowed = getattr(module_perms, action, False)
        if not action_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Required permission '{action}' on module '{module}' is missing",
            )

        return current_admin

    return permission_checker
