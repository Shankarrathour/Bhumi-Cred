from typing import Optional, List, Union
from datetime import datetime, timezone
from enum import Enum
from beanie import Document, Link
from pydantic import Field, EmailStr
from pymongo import IndexModel, ASCENDING


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
    name: str
    email: EmailStr
    phone: Optional[str] = None
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
    assigned_projects: List[str] = Field(default_factory=list, description="Assigned Project ObjectIDs")
    
    # Multi-Factor Auth (MFA / 2FA)
    mfa_enabled: bool = False
    mfa_type: str = Field(default="totp", description="totp | sms | email")
    mfa_secret: Optional[str] = None
    mfa_backup_codes: List[str] = Field(default_factory=list, description="Hashed recovery codes")
    
    # Account Security & Governance
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None
    created_by_id: Optional[str] = None
    approved_by_id: Optional[str] = None
    
    onboarded_date: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    last_login: Optional[datetime] = None
    last_login_at: Optional[datetime] = None

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    class Settings:
        name = "admin_users"
        indexes = [
            IndexModel([("email", ASCENDING)], unique=True),
            IndexModel([("employee_id", ASCENDING)], sparse=True),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("role", ASCENDING)]),
            IndexModel([("department", ASCENDING)]),
            IndexModel([("role_ref.$id", ASCENDING), ("status", ASCENDING)]),
        ]


# Rebuild Pydantic model for forward references in Pydantic V2
try:
    from app.models.role import Role
    AdminUser.model_rebuild()
except Exception:
    pass
