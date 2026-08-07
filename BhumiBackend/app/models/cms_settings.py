from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Dict, Any
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field, EmailStr
from pymongo import IndexModel, ASCENDING, DESCENDING


# ── Enums ──────────────────────────────────────────────────────────────────────

class ReportType(str, Enum):
    CARBON_IMPACT = "carbon_impact"
    FARMER_PAYOUTS = "farmer_payouts"
    INSURANCE_CLAIMS = "insurance_claims"
    FINANCIAL_SUMMARY = "financial_summary"

class PolicyType(str, Enum):
    TERMS_OF_SERVICE = "terms_of_service"
    PRIVACY_POLICY = "privacy_policy"
    REFUND_POLICY = "refund_policy"
    FARMER_DISCLAIMER = "farmer_disclaimer"

class StorageProvider(str, Enum):
    CLOUDINARY = "Cloudinary"
    AWS_S3 = "AWS_S3"
    GOOGLE_CLOUD = "Google_Cloud"

class GatewayName(str, Enum):
    RAZORPAY = "Razorpay"
    CASHFREE = "Cashfree"
    STRIPE = "Stripe"


# ── Embedded Schemas ─────────────────────────────────────────────────────────

class DistrictMetric(BaseModel):
    state: str
    district: str
    farmer_count: int = Field(default=0, ge=0)
    land_acres: float = Field(default=0.0, ge=0)


# ── Top-Level Beanie Document Collections ───────────────────────────────────

class NotificationGatewayConfig(Document):
    config_id: str = Field(..., description="Unique Config ID, e.g., CFG-FAST2SMS-MAIN")
    provider: str = Field(..., description="Fast2SMS, Twilio, WhatsApp_Business")
    sender_id: Optional[str] = None
    api_key_encrypted: str
    whatsapp_business_account_id: Optional[str] = None
    is_active: bool = True

    class Settings:
        name = "notification_gateway_configs"
        indexes = [
            IndexModel([("config_id", ASCENDING)], unique=True),
            IndexModel([("provider", ASCENDING), ("is_active", ASCENDING)], unique=True)
        ]


class CMSLocalization(Document):
    locale_id: str = Field(..., description="Unique Locale Ref, e.g., LOC-HI-IN")
    language_code: str = Field(..., description="hi, en, mr, gu")
    language_name: str = "Hindi"
    translation_keys: Dict[str, str] = Field(default_factory=dict)
    is_active: bool = True

    class Settings:
        name = "cms_localizations"
        indexes = [
            IndexModel([("locale_id", ASCENDING)], unique=True),
            IndexModel([("language_code", ASCENDING)], unique=True)
        ]


class SystemSettingAudit(Document):
    audit_id: str = Field(..., description="Unique Audit Ref, e.g., AUD-SETTING-2026-01")
    setting_id: str
    modified_by: PydanticObjectId
    old_value: Dict[str, Any] = Field(default_factory=dict)
    new_value: Dict[str, Any] = Field(default_factory=dict)
    ip_address: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "system_setting_audits"
        indexes = [
            IndexModel([("audit_id", ASCENDING)], unique=True),
            IndexModel([("setting_id", ASCENDING), ("timestamp", DESCENDING)])
        ]


class SystemReport(Document):
    report_id: str = Field(..., description="Unique Report ID, e.g., RPT-2026-08-01")
    report_title: str
    report_type: ReportType = ReportType.CARBON_IMPACT
    file_format: str = "PDF"
    file_url: str
    generated_by: PydanticObjectId
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "system_reports"
        indexes = [
            IndexModel([("report_id", ASCENDING)], unique=True),
            IndexModel([("report_type", ASCENDING), ("created_at", DESCENDING)])
        ]


class PlatformAnalytics(Document):
    analytics_id: str = Field(..., description="Unique Snapshot Ref, e.g., ANL-2026-08-04")
    date: str = Field(..., description="YYYY-MM-DD format, e.g., 2026-08-04")
    active_farmers: int = Field(default=0, ge=0)
    total_land_acres: float = Field(default=0.0, ge=0)
    trees_registered: int = Field(default=0, ge=0)
    total_green_families: int = Field(default=0, ge=0)
    carbon_credits_issued_tco2e: float = Field(default=0.0, ge=0)
    total_payouts_inr: float = Field(default=0.0, ge=0)
    active_insurance_policies: int = Field(default=0, ge=0)
    state_district_metrics: List[DistrictMetric] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "platform_analytics"
        indexes = [
            IndexModel([("analytics_id", ASCENDING)], unique=True),
            IndexModel([("date", ASCENDING)], unique=True)
        ]


class CMSBlog(Document):
    blog_id: str = Field(..., description="Unique Blog ID, e.g., BLG-AGRO-2026-01")
    title: str
    slug: str
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    author_name: str = "BHUMICRED Editorial Team"
    category: str = "Agroforestry Guide"
    cover_image_url: str
    content_markdown: str
    tags: List[str] = Field(default_factory=list)
    views_count: int = 0
    is_published: bool = True
    published_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "cms_blogs"
        indexes = [
            IndexModel([("blog_id", ASCENDING)], unique=True),
            IndexModel([("slug", ASCENDING)], unique=True),
            IndexModel([("is_published", ASCENDING), ("published_at", DESCENDING)]),
            IndexModel([("title", "text"), ("content_markdown", "text")])
        ]


class CMSMedia(Document):
    media_id: str = Field(..., description="Unique Media ID, e.g., MED-2026-0089")
    file_name: str
    file_url: str
    file_type: str = "image/png"
    file_size_bytes: int = Field(..., gt=0)
    uploaded_by: PydanticObjectId
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "cms_media"
        indexes = [
            IndexModel([("media_id", ASCENDING)], unique=True),
            IndexModel([("uploaded_at", DESCENDING)])
        ]


class CMSFAQ(Document):
    faq_id: str = Field(..., description="Unique FAQ ID, e.g., FAQ-FARMER-01")
    category: str = "Farmer Registration"
    question: str
    answer: str
    display_order: int = Field(default=1, ge=1)
    is_active: bool = True

    class Settings:
        name = "cms_faqs"
        indexes = [
            IndexModel([("faq_id", ASCENDING)], unique=True),
            IndexModel([("category", ASCENDING), ("display_order", ASCENDING)])
        ]


class CMSHomepageSection(Document):
    section_id: str = Field(..., description="Unique Section ID, e.g., SEC-HERO-01")
    section_key: str = Field(..., description="hero, stats, testimonials, partners")
    title: str
    subtitle: Optional[str] = None
    media_urls: List[str] = Field(default_factory=list)
    action_button_link: Optional[str] = None
    is_visible: bool = True

    class Settings:
        name = "cms_homepage_sections"
        indexes = [
            IndexModel([("section_id", ASCENDING)], unique=True),
            IndexModel([("section_key", ASCENDING)], unique=True)
        ]


class CMSTermsAndPolicy(Document):
    policy_id: str = Field(..., description="Unique Legal Policy Ref, e.g., LEG-TERMS-V1")
    policy_type: PolicyType = PolicyType.TERMS_OF_SERVICE
    version: str = "1.0"
    title: str
    content_markdown: str
    effective_date: datetime
    is_active: bool = True

    class Settings:
        name = "cms_terms_and_policies"
        indexes = [
            IndexModel([("policy_id", ASCENDING)], unique=True),
            IndexModel([("policy_type", ASCENDING), ("is_active", ASCENDING)])
        ]


class SystemSetting(Document):
    setting_id: str = Field(default="GLOBAL_SYSTEM_SETTINGS")
    app_name: str = "BHUMICRED"
    support_email: EmailStr = "support@bhumicred.com"
    support_phone: str = "1800-123-4567"
    maintenance_mode: bool = False
    default_currency: str = "INR"
    timezone: str = "Asia/Kolkata"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "system_settings"
        indexes = [
            IndexModel([("setting_id", ASCENDING)], unique=True)
        ]


class PlatformFeeSetting(Document):
    setting_id: str = Field(default="GLOBAL_PLATFORM_FEES")
    carbon_trade_fee_percent: float = Field(default=2.5, ge=0)
    marketplace_commission_percent: float = Field(default=5.0, ge=0)
    insurance_processing_fee_inr: float = Field(default=50.0, ge=0)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "platform_fee_settings"
        indexes = [
            IndexModel([("setting_id", ASCENDING)], unique=True)
        ]


class APIKey(Document):
    key_id: str = Field(..., description="Unique API Key Ref, e.g., KEY-PARTNER-MP-01")
    partner_name: str
    api_key_hash: str
    scopes: List[str] = Field(default_factory=lambda: ["read:gis", "read:carbon"])
    rate_limit_per_min: int = 100
    is_active: bool = True
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "api_keys"
        indexes = [
            IndexModel([("key_id", ASCENDING)], unique=True),
            IndexModel([("api_key_hash", ASCENDING)], unique=True)
        ]


class CloudStorageConfig(Document):
    config_id: str = Field(..., description="Unique Storage Config ID, e.g., CFG-CLOUDINARY-MAIN")
    provider: StorageProvider = StorageProvider.CLOUDINARY
    bucket_or_cloud_name: str
    api_key_encrypted: str
    api_secret_encrypted: str
    is_active: bool = True

    class Settings:
        name = "cloud_storage_configs"
        indexes = [
            IndexModel([("config_id", ASCENDING)], unique=True),
            IndexModel([("provider", ASCENDING), ("is_active", ASCENDING)])
        ]


class PaymentGatewayConfig(Document):
    config_id: str = Field(..., description="Unique Gateway Config ID, e.g., CFG-RAZORPAY-MAIN")
    gateway_name: GatewayName = GatewayName.RAZORPAY
    key_id_encrypted: str
    key_secret_encrypted: str
    webhook_secret_encrypted: str
    is_test_mode: bool = False
    is_active: bool = True

    class Settings:
        name = "payment_gateway_configs"
        indexes = [
            IndexModel([("config_id", ASCENDING)], unique=True),
            IndexModel([("gateway_name", ASCENDING), ("is_active", ASCENDING)])
        ]
