from typing import Optional, Dict, Any
from datetime import datetime, timezone
from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING, DESCENDING


class AuditLog(Document):
    action: str = Field(description="Action performed (e.g. APPROVE_APPLICATION, DELETE_USER)")
    entity_type: str = Field(default="", description="Type of entity modified (e.g. AgriApplication, Farmer, Land)")
    entity_id: str = Field(default="", description="ID of the target entity modified")
    
    module: str = Field(default="system", description="BRD Module code (e.g. farmer_management, land_management)")
    
    # Actor Details
    admin_id: str = Field(description="ID of the actor who performed the action")
    admin_name: str = Field(default="System", description="Name of the actor")
    actor_type: str = Field(default="admin", description="'admin', 'farmer', 'vendor', or 'system'")
    actor_role: Optional[str] = Field(
        default=None,
        description="The actor's role code at the time of the action (e.g. 'operations_admin')"
    )
    
    # State Diffing
    old_value: Optional[Dict[str, Any]] = Field(default=None, description="Previous document state before change")
    new_value: Optional[Dict[str, Any]] = Field(default=None, description="Updated document state after change")
    
    # Network & Device Forensics
    ip_address: Optional[str] = Field(default=None, description="Client IP address")
    user_agent: Optional[str] = Field(default=None, description="Raw HTTP User Agent string")
    device: Optional[str] = Field(default=None, description="Parsed device info (e.g. Windows PC, iPhone 15)")
    browser: Optional[str] = Field(default=None, description="Parsed browser info (e.g. Chrome 127, Safari 17)")
    city: Optional[str] = Field(default=None, description="Client city location")
    country: Optional[str] = Field(default=None, description="Client country location")
    
    # Request Execution Telemetry
    request_method: Optional[str] = Field(default=None, description="HTTP Method (GET, POST, PUT, DELETE)")
    request_path: Optional[str] = Field(default=None, description="API endpoint path")
    status_code: Optional[int] = Field(default=200, description="HTTP Response status code")
    execution_time_ms: Optional[float] = Field(default=0.0, description="Execution time in milliseconds")
    
    success: bool = Field(default=True, description="Whether the action succeeded")
    remarks: str = Field(default="", description="Optional remarks or failure stacktrace summary")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "audit_logs"
        indexes = [
            IndexModel([("timestamp", DESCENDING)]),
            IndexModel([("admin_id", ASCENDING), ("timestamp", DESCENDING)]),
            IndexModel([("module", ASCENDING), ("action", ASCENDING), ("timestamp", DESCENDING)]),
            IndexModel([("entity_type", ASCENDING), ("entity_id", ASCENDING)]),
            IndexModel([("success", ASCENDING)]),
        ]
