from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.rbac import RequirePermission
from app.models.admin_user import AdminUser
from app.models.role import Role
from app.schemas.role import RoleCreateSchema, RoleUpdateSchema, RoleResponseSchema, PermissionMatrixSchema

router = APIRouter(prefix="/admin/roles", tags=["Admin - Role & Permission Management (RBAC)"])


@router.get("", response_model=List[RoleResponseSchema])
async def list_roles(
    current_admin: AdminUser = Depends(RequirePermission("rbac", "view")),
):
    """List all configured system and custom roles with their permission matrices."""
    roles = await Role.find_all().to_list()
    return [
        RoleResponseSchema(
            id=str(r.id),
            name=r.name,
            code=r.code,
            description=r.description,
            is_system_role=r.is_system_role,
            is_active=r.is_active,
            permissions={k: PermissionMatrixSchema(**v.model_dump()) for k, v in r.permissions.items()},
            created_at=r.created_at,
        )
        for r in roles
    ]


@router.post("", response_model=RoleResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_custom_role(
    payload: RoleCreateSchema,
    current_admin: AdminUser = Depends(RequirePermission("rbac", "create")),
):
    """Create a new custom role with granular permission matrix."""
    existing = await Role.find_one(Role.code == payload.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role with code '{payload.code}' already exists",
        )

    role = Role(
        name=payload.name,
        code=payload.code,
        description=payload.description,
        is_system_role=False,
        is_active=True,
        permissions=payload.permissions,
    )
    await role.insert()

    return RoleResponseSchema(
        id=str(role.id),
        name=role.name,
        code=role.code,
        description=role.description,
        is_system_role=role.is_system_role,
        is_active=role.is_active,
        permissions={k: PermissionMatrixSchema(**v.model_dump()) for k, v in role.permissions.items()},
        created_at=role.created_at,
    )


@router.get("/{role_id}", response_model=RoleResponseSchema)
async def get_role(
    role_id: str,
    current_admin: AdminUser = Depends(RequirePermission("rbac", "view")),
):
    """Get detailed role configuration by ID."""
    role = await Role.get(role_id)
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    return RoleResponseSchema(
        id=str(role.id),
        name=role.name,
        code=role.code,
        description=role.description,
        is_system_role=role.is_system_role,
        is_active=role.is_active,
        permissions={k: PermissionMatrixSchema(**v.model_dump()) for k, v in role.permissions.items()},
        created_at=role.created_at,
    )


@router.put("/{role_id}", response_model=RoleResponseSchema)
async def update_role(
    role_id: str,
    payload: RoleUpdateSchema,
    current_admin: AdminUser = Depends(RequirePermission("rbac", "edit")),
):
    """Update role name, description, active status, or permission matrix."""
    role = await Role.get(role_id)
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    if payload.name is not None:
        role.name = payload.name
    if payload.description is not None:
        role.description = payload.description
    if payload.is_active is not None:
        role.is_active = payload.is_active
    if payload.permissions is not None:
        role.permissions = payload.permissions

    await role.save()

    return RoleResponseSchema(
        id=str(role.id),
        name=role.name,
        code=role.code,
        description=role.description,
        is_system_role=role.is_system_role,
        is_active=role.is_active,
        permissions={k: PermissionMatrixSchema(**v.model_dump()) for k, v in role.permissions.items()},
        created_at=role.created_at,
    )


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_custom_role(
    role_id: str,
    current_admin: AdminUser = Depends(RequirePermission("rbac", "delete")),
):
    """Delete custom role (System roles cannot be deleted)."""
    role = await Role.get(role_id)
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    if role.is_system_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="System default roles cannot be deleted",
        )

    await role.delete()
    return None
