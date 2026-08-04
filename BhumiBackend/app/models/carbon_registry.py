from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Dict, Any
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field, EmailStr
from pymongo import IndexModel, ASCENDING, DESCENDING


# ── Enums ──────────────────────────────────────────────────────────────────────

class RegistryType(str, Enum):
    VERRA = "Verra_VCS"
    GOLD_STANDARD = "Gold_Standard"
    NCCF = "NCCF_India"
    UNFCCC_CDM = "UNFCCC_CDM"
    GCR = "Global_Carbon_Registry"

class RegistryStatus(str, Enum):
    LISTED = "listed"
    UNDER_VALIDATION = "under_validation"
    REGISTERED = "registered"
    ACTIVE_MONITORING = "active_monitoring"
    CREDITS_ISSUED = "credits_issued"
    REJECTED = "rejected"
    ARCHIVED = "archived"

class RegistryDocType(str, Enum):
    PDD = "pdd"
    MONITORING_REPORT = "monitoring_report"
    VERIFICATION_REPORT = "verification_report"
    VALIDATION_STATEMENT = "validation_statement"
    ISSUANCE_CERTIFICATE = "issuance_certificate"

class CreditAction(str, Enum):
    ISSUED = "issued"
    TRANSFERRED = "transferred"
    RESERVED = "reserved"
    RETIRED = "retired"
    CANCELLED = "cancelled"

class BuyerType(str, Enum):
    CORPORATE = "corporate"
    INVESTMENT_FUND = "investment_fund"
    BROKER = "broker"
    INDIVIDUAL = "individual"

class TransferStatus(str, Enum):
    INITIATED = "initiated"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


# ── Top-Level Beanie Document Collections ───────────────────────────────────

class CarbonDeveloper(Document):
    developer_id: str = Field(..., description="Unique Developer ID, e.g., DEV-2026-001")
    developer_name: str
    registration_number: str
    contact_email: EmailStr
    contact_phone: str = Field(..., pattern=r"^[6-9]\d{9}$")
    website_url: Optional[str] = None
    active_projects_count: int = 0
    is_verified: bool = True

    # Audit & Soft Delete
    is_deleted: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "carbon_developers"
        indexes = [
            IndexModel([("developer_id", ASCENDING)], unique=True),
            IndexModel([("contact_email", ASCENDING)], unique=True)
        ]


class CarbonBuyer(Document):
    buyer_id: str = Field(..., description="Unique Buyer ID, e.g., BUYER-2026-089")
    buyer_name: str
    buyer_type: BuyerType = BuyerType.CORPORATE
    country: str = "India"
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    total_credits_purchased: float = 0.0
    total_credits_retired: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "carbon_buyers"
        indexes = [
            IndexModel([("buyer_id", ASCENDING)], unique=True),
            IndexModel([("contact_email", ASCENDING)], unique=True)
        ]


class CreditTransfer(Document):
    transfer_id: str = Field(..., description="Unique Transfer ID, e.g., TRX-CRED-2026-0091")
    seller_id: PydanticObjectId
    buyer_id: PydanticObjectId
    issuance_id: PydanticObjectId
    quantity_tco2e: float = Field(..., gt=0)
    unit_price_usd: float = Field(..., gt=0)
    total_amount_usd: float = Field(..., gt=0)
    registry_transfer_ref: Optional[str] = None
    status: TransferStatus = TransferStatus.COMPLETED
    transfer_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "credit_transfers"
        indexes = [
            IndexModel([("transfer_id", ASCENDING)], unique=True),
            IndexModel([("seller_id", ASCENDING), ("transfer_date", DESCENDING)]),
            IndexModel([("buyer_id", ASCENDING), ("transfer_date", DESCENDING)])
        ]


class RegistryMethodology(Document):
    methodology_code: str = Field(..., description="Unique code, e.g., VM0042")
    registry_type: RegistryType = RegistryType.VERRA
    title: str
    sector_scope: str = "Agriculture & Agroforestry"
    version: str = "1.0"
    approval_date: datetime
    document_url: str

    class Settings:
        name = "registry_methodologies"
        indexes = [
            IndexModel([("methodology_code", ASCENDING)], unique=True),
            IndexModel([("registry_type", ASCENDING)])
        ]


class RegistryVVBBody(Document):
    vvb_id: str = Field(..., description="Unique VVB ID, e.g., VVB-TUV-SUD-01")
    vvb_name: str
    accreditation_body: str = "UNFCCC / ANSI"
    accreditation_number: str
    contact_email: EmailStr
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "registry_vvb_bodies"
        indexes = [
            IndexModel([("vvb_id", ASCENDING)], unique=True),
            IndexModel([("accreditation_number", ASCENDING)], unique=True)
        ]


class RegistryProject(Document):
    registry_project_id: str = Field(..., description="Unique Registry ID, e.g., REG-VRA-2026-0042")
    project_name: str
    registry_type: RegistryType = RegistryType.VERRA
    methodology_code: str
    developer_id: PydanticObjectId
    host_country: str = "India"
    crediting_period_start: datetime
    crediting_period_end: datetime
    registry_status: RegistryStatus = RegistryStatus.LISTED
    is_active: bool = True

    # Audit & Security Fields
    created_by_id: Optional[PydanticObjectId] = None
    updated_by_id: Optional[PydanticObjectId] = None

    # Soft Delete Support
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by_id: Optional[PydanticObjectId] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    async def soft_delete(self, deleted_by: Optional[PydanticObjectId] = None):
        """Soft delete registry project."""
        self.is_deleted = True
        self.is_active = False
        self.registry_status = RegistryStatus.ARCHIVED
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by_id = deleted_by
        self.updated_at = datetime.now(timezone.utc)
        await self.save()

    class Settings:
        name = "registry_projects"
        indexes = [
            IndexModel([("registry_project_id", ASCENDING)], unique=True),
            IndexModel([("developer_id", ASCENDING), ("registry_status", ASCENDING)]),
            IndexModel([("is_deleted", ASCENDING), ("is_active", ASCENDING)]),
            IndexModel([("registry_type", ASCENDING), ("methodology_code", ASCENDING)])
        ]


class ProjectDesignDocument(Document):
    pdd_id: str = Field(..., description="Unique PDD ID, e.g., PDD-VRA-2026-01")
    registry_project_id: PydanticObjectId
    pdd_version: str = "1.0"
    baseline_methodology: str
    estimated_annual_reductions_tco2e: float = Field(..., gt=0)
    pdd_document_url: str
    validation_body_name: str
    validation_date: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "project_design_documents"
        indexes = [
            IndexModel([("pdd_id", ASCENDING)], unique=True),
            IndexModel([("registry_project_id", ASCENDING)], unique=True)
        ]


class MonitoringReport(Document):
    monitoring_report_id: str = Field(..., description="Unique MR ID, e.g., MR-2026-Q1")
    registry_project_id: PydanticObjectId
    monitoring_period_start: datetime
    monitoring_period_end: datetime
    reported_reductions_tco2e: float = Field(..., gt=0)
    monitoring_report_url: str
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "monitoring_reports"
        indexes = [
            IndexModel([("monitoring_report_id", ASCENDING)], unique=True),
            IndexModel([("registry_project_id", ASCENDING), ("monitoring_period_start", DESCENDING)])
        ]


class VerificationReport(Document):
    verification_report_id: str = Field(..., description="Unique VR ID, e.g., VR-2026-Q1")
    monitoring_report_id: PydanticObjectId
    registry_project_id: PydanticObjectId
    vvb_name: str
    verified_reductions_tco2e: float = Field(..., gt=0)
    verification_statement_url: str
    verification_date: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "verification_reports"
        indexes = [
            IndexModel([("verification_report_id", ASCENDING)], unique=True),
            IndexModel([("monitoring_report_id", ASCENDING)], unique=True)
        ]


class CreditIssuance(Document):
    issuance_id: str = Field(..., description="Unique Issuance ID, e.g., ISS-2026-0091")
    registry_project_id: PydanticObjectId
    verification_report_id: PydanticObjectId
    vintage_year: int = Field(..., ge=2000, le=2100)
    serial_number_range: str = Field(..., description="e.g., VRA-2026-000001 to 017700")
    quantity_tco2e: float = Field(..., gt=0)
    buffer_pool_quantity_tco2e: float = Field(default=0.0, ge=0)
    available_quantity_tco2e: float = Field(..., ge=0)
    issuance_date: datetime
    certificate_url: str

    # Soft Delete
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by_id: Optional[PydanticObjectId] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    async def soft_delete(self, deleted_by: Optional[PydanticObjectId] = None):
        """Soft delete credit issuance."""
        self.is_deleted = True
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by_id = deleted_by
        self.updated_at = datetime.now(timezone.utc)
        await self.save()

    class Settings:
        name = "credit_issuances"
        indexes = [
            IndexModel([("issuance_id", ASCENDING)], unique=True),
            IndexModel([("serial_number_range", ASCENDING)], unique=True),
            IndexModel([("is_deleted", ASCENDING)]),
            IndexModel([("registry_project_id", ASCENDING), ("vintage_year", DESCENDING)])
        ]


class CreditRetirement(Document):
    retirement_id: str = Field(..., description="Unique Retirement ID, e.g., RET-2026-0045")
    issuance_id: PydanticObjectId
    buyer_id: PydanticObjectId
    quantity_retired: float = Field(..., gt=0)
    serial_numbers_retired: List[str] = Field(default_factory=list)
    retirement_reason: str
    beneficiary_name: str
    digital_seal_hash: Optional[str] = None
    qr_code_verification_url: Optional[str] = None
    retirement_certificate_url: str
    retired_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "credit_retirements"
        indexes = [
            IndexModel([("retirement_id", ASCENDING)], unique=True),
            IndexModel([("buyer_id", ASCENDING), ("retired_at", DESCENDING)])
        ]


class CreditHistory(Document):
    serial_number: str
    action: CreditAction
    from_account_id: Optional[PydanticObjectId] = None
    to_account_id: Optional[PydanticObjectId] = None
    transaction_hash: Optional[str] = None
    remarks: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "credit_histories"
        indexes = [
            IndexModel([("serial_number", ASCENDING), ("timestamp", DESCENDING)]),
            IndexModel([("action", ASCENDING)])
        ]


class RegistryDocument(Document):
    document_id: str = Field(..., description="Unique Document ID, e.g., DOC-REG-2026-01")
    registry_project_id: PydanticObjectId
    doc_type: RegistryDocType
    title: str
    file_url: str
    file_hash: Optional[str] = None
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "registry_documents"
        indexes = [
            IndexModel([("document_id", ASCENDING)], unique=True),
            IndexModel([("registry_project_id", ASCENDING), ("doc_type", ASCENDING)])
        ]
