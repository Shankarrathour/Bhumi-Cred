from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Union
from datetime import datetime
from beanie import PydanticObjectId
import re
from app.models.admin_user import AdminRole, UserStatus


class AdminUserCreate(BaseModel):
    employee_id: Optional[str] = Field(None, description="e.g. EMP-1004")
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9._-]+$")
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, pattern=r"^[6-9]\d{9}$")
    password: str = Field(..., min_length=8, description="Must contain uppercase, lowercase, digit, and special char")
    role: Union[AdminRole, str] = AdminRole.SUPER_ADMIN
    department: Optional[str] = "Operations"
    designation: Optional[str] = "Administrator"
    assigned_states: List[str] = Field(default_factory=list)
    assigned_districts: List[str] = Field(default_factory=list)
    assigned_projects: List[PydanticObjectId] = Field(default_factory=list)

    model_config = {
        "json_schema_extra": {
            "example": {
                "employee_id": "EMP-1004",
                "username": "johndoe_admin",
                "name": "John Doe",
                "email": "john.doe@company.com",
                "phone": "9876543210",
                "password": "StrongPassword@2026",
                "role": "super_admin",
                "department": "Operations",
                "designation": "Administrator",
                "assigned_states": ["MH", "KA"],
                "assigned_districts": ["Pune", "Bengaluru"],
                "assigned_projects": []
            }
        }
    }

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[0-9]", value):
            raise ValueError("Password must contain at least one digit.")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise ValueError("Password must contain at least one special character.")
        return value


class AdminUserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, pattern=r"^[6-9]\d{9}$")
    department: Optional[str] = None
    designation: Optional[str] = None
    role: Optional[Union[AdminRole, str]] = None
    status: Optional[UserStatus] = None
    is_active: Optional[bool] = None
    avatar_url: Optional[str] = None
    assigned_states: Optional[List[str]] = None
    assigned_districts: Optional[List[str]] = None
    assigned_projects: Optional[List[PydanticObjectId]] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "John D. Doe",
                "phone": "9998887776",
                "department": "Finance",
                "designation": "Finance Manager",
                "role": "finance_manager",
                "status": "active",
                "is_active": True,
                "assigned_states": ["MH"],
            }
        }
    }


class AdminUserLogin(BaseModel):
    username_or_email: str
    password: str
    mfa_code: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "username_or_email": "john.doe@company.com",
                "password": "StrongPassword@2026",
                "mfa_code": "123456"
            }
        }
    }


class AdminUserPasswordReset(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[0-9]", value):
            raise ValueError("Password must contain at least one digit.")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise ValueError("Password must contain at least one special character.")
        return value

    model_config = {
        "json_schema_extra": {
            "example": {
                "current_password": "OldPassword@2025",
                "new_password": "StrongPassword@2026"
            }
        }
    }


class AdminUserResponse(BaseModel):
    id: str
    employee_id: Optional[str] = None
    username: Optional[str] = None
    name: str
    email: EmailStr
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    role: Union[AdminRole, str]
    status: UserStatus
    is_active: bool
    assigned_states: List[str] = Field(default_factory=list)
    assigned_districts: List[str] = Field(default_factory=list)
    mfa_enabled: bool = False
    onboarded_date: datetime
    last_login: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "60d5ec49f1b2c8b1f8c8d9a1",
                "employee_id": "EMP-1004",
                "username": "johndoe_admin",
                "name": "John Doe",
                "email": "john.doe@company.com",
                "phone": "9876543210",
                "avatar_url": "https://s3.aws.com/avatars/johndoe.png",
                "department": "Operations",
                "designation": "Administrator",
                "role": "super_admin",
                "status": "active",
                "is_active": True,
                "assigned_states": ["MH", "KA"],
                "assigned_districts": ["Pune", "Bengaluru"],
                "mfa_enabled": False,
                "onboarded_date": "2026-08-04T10:00:00Z",
                "last_login": "2026-08-04T12:30:00Z",
                "is_deleted": False,
                "created_at": "2026-08-04T10:00:00Z",
                "updated_at": "2026-08-04T12:30:00Z"
            }
        }
    }
