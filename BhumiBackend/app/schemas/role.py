from typing import Dict, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class PermissionMatrixSchema(BaseModel):
    view: bool = False
    create: bool = False
    edit: bool = False
    delete: bool = False
    approve: bool = False
    reject: bool = False
    assign: bool = False
    export: bool = False
    download: bool = False
    print_doc: bool = Field(default=False, alias="print")
    send_notification: bool = False
    manage_wallet: bool = False
    manage_payments: bool = False
    access_reports: bool = False
    publish: bool = False

    class Config:
        populate_by_name = True


class RoleCreateSchema(BaseModel):
    name: str = Field(..., example="KYC Admin")
    code: str = Field(..., example="kyc_admin")
    description: Optional[str] = None
    permissions: Dict[str, PermissionMatrixSchema] = Field(default_factory=dict)


class RoleUpdateSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    permissions: Optional[Dict[str, PermissionMatrixSchema]] = None


class RoleResponseSchema(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None
    is_system_role: bool
    is_active: bool
    permissions: Dict[str, PermissionMatrixSchema]
    created_at: datetime
