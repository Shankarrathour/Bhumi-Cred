from typing import Optional, List, Union, Dict, Any
from datetime import datetime, timezone
from enum import Enum
from beanie import Document, Link, PydanticObjectId
from pydantic import Field, EmailStr, field_validator
from pymongo import IndexModel, ASCENDING, DESCENDING


class AdminRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    OPERATIONS_ADMIN = "operations_admin"
    FINANCE_MANAGER = "finance_manager"
    VENDOR_MANAGER = "vendor_manager"
    CARBON_PROJECT_MANAGER = "carbon_project_manager"
    EMPLOYEE_MANAGER = "employee_manager"
    SUPPORT_MANAGER = "support_manager"
    KYC_ADMIN = "kyc_admin"
    GIS_ADMIN = "gis_admin"
    PROJECT_ADMIN = "project_admin"
    INSURANCE_ADMIN = "insurance_admin"
    MARKETPLACE_ADMIN = "marketplace_admin"
    FINANCE_ADMIN = "finance_admin"
    SUPPORT_ADMIN = "support_admin"
    CONTENT_ADMIN = "content_admin"
    AUDITOR = "auditor"


class UserStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DEACTIVATED = "deactivated"
    PENDING_ACTIVATION = "pending_activation"


class AdminUser(Document):
    employee_id: Optional[str] = Field(default=None, description="Unique Employee / Staff ID (e.g. EMP-1004)")
    username: Optional[str] = Field(default=None, description="Unique username for admin portal login")
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(default=None, pattern=r"^[6-9]\d{9}$", description="10-digit Indian phone number")
    avatar_url: Optional[str] = None
    department: Optional[str] = Field(default="Operations", description="Operations, Finance, Support, GIS, etc.")
    designation: Optional[str] = Field(default="Administrator", description="Job title / designation")
    
    password_hash: str
    
    # Linked Role Model or Enum fallback
    role: Union[AdminRole, str] = AdminRole.SUPER_ADMIN
    role_ref: Optional[Link["Role"]] = None  # type: ignore
    
    status: UserStatus = UserStatus.ACTIVE
    is_active: bool = True
    
    # Regional / Project Scope Constraints
    assigned_states: List[str] = Field(default_factory=list, description="Assigned state codes for localized access")
    assigned_districts: List[str] = Field(default_factory=list, description="Assigned district names for localized access")
    assigned_projects: List[PydanticObjectId] = Field(default_factory=list, description="Assigned Project ObjectIDs")
    
    # Multi-Factor Auth (MFA / 2FA)
    mfa_enabled: bool = False
    mfa_type: str = Field(default="totp", description="totp | sms | email")
    mfa_secret: Optional[str] = None
    mfa_backup_codes: List[str] = Field(default_factory=list, description="Hashed recovery codes")
    
    # Account Security & Governance
    failed_login_attempts: int = Field(default=0, ge=0)
    locked_until: Optional[datetime] = None
    created_by_id: Optional[PydanticObjectId] = None
    approved_by_id: Optional[PydanticObjectId] = None
    updated_by_id: Optional[PydanticObjectId] = None
    
    onboarded_date: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    last_login: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    last_login_ip: Optional[str] = None
    password_changed_at: Optional[datetime] = None

    # Soft Delete Support
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by_id: Optional[PydanticObjectId] = None

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    async def soft_delete(self, deleted_by: Optional[PydanticObjectId] = None):
        """Soft delete admin user account."""
        self.is_deleted = True
        self.is_active = False
        self.status = UserStatus.DEACTIVATED
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by_id = deleted_by
        self.updated_at = datetime.now(timezone.utc)
        await self.save()

    class Settings:
        name = "admin_users"
        indexes = [
            IndexModel([("email", ASCENDING)], unique=True),
            IndexModel([("username", ASCENDING)], unique=True, sparse=True),
            IndexModel([("employee_id", ASCENDING)], sparse=True),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("role", ASCENDING)]),
            IndexModel([("department", ASCENDING)]),
            IndexModel([("is_deleted", ASCENDING), ("is_active", ASCENDING)]),
            IndexModel([("name", "text"), ("email", "text"), ("employee_id", "text")])
        ]


# Rebuild Pydantic model for forward references in Pydantic V2
try:
    from app.models.role import Role
    AdminUser.model_rebuild()
except Exception:
    pass
