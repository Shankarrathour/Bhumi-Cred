from typing import Dict, Optional
from datetime import datetime, timezone
from beanie import Document
from pydantic import BaseModel, Field
from pymongo import IndexModel, ASCENDING


class ModulePermissions(BaseModel):
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


class Role(Document):
    name: str = Field(..., description="Human-readable role name (e.g. KYC Admin)")
    code: str = Field(..., description="Unique role identifier (e.g. kyc_admin)")
    description: Optional[str] = None
    is_system_role: bool = Field(default=False, description="System roles cannot be deleted")
    is_active: bool = Field(default=True)
    
    # Map of module name to granular permission flags
    permissions: Dict[str, ModulePermissions] = Field(default_factory=dict)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "roles"
        indexes = [
            IndexModel([("code", ASCENDING)], unique=True),
            IndexModel([("name", ASCENDING)], unique=True),
            IndexModel([("is_active", ASCENDING)]),
        ]
