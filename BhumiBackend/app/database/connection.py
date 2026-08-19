import certifi
import dns.resolver
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.config.settings import settings

logger = logging.getLogger(__name__)

def configure_dns_resolver() -> None:
    """Configure DNS resolver with streamlined nameservers to avoid socket buffer exhaustion on Windows."""
    try:
        if hasattr(dns.resolver, "reset_default_resolver"):
            dns.resolver.reset_default_resolver()
        resolver = dns.resolver.get_default_resolver()
        resolver.timeout = 3.0
        resolver.lifetime = 6.0
        # Streamline nameservers: Keep local ones first, append public DNS as fallbacks
        orig = list(resolver.nameservers)
        for ns in ["8.8.8.8", "1.1.1.1"]:
            if ns not in orig:
                orig.append(ns)
        resolver.nameservers = orig[:4]  # Limit to 4 to avoid socket bloat
    except Exception as exc:
        logger.warning("Could not configure fallback DNS resolvers: %s", exc)


# Initial DNS configuration on module load
configure_dns_resolver()

_client: AsyncIOMotorClient | None = None


async def connect_db() -> None:
    global _client

    logger.info("Connecting to MongoDB Atlas...")

    # Import all models here so Beanie can register them
    from app.models.farmer import Farmer
    from app.models.admin_user import AdminUser
    from app.models.role import Role
    from app.models.user_session import UserSession
    from app.models.login_history import LoginHistory
    from app.models.password_reset import PasswordResetToken
    from app.models.otp_session import OTPSession
    from app.models.refresh_token import RefreshTokenSession
    from app.models.family_member import FamilyMember
    from app.models.farmer_activity import FarmerActivityLog
    from app.models.land_parcel import LandParcel
    from app.models.project_enrollment import ProjectEnrollment
    from app.models.sustainability_project import SustainabilityProject
    from app.models.banner import Banner
    from app.models.cms_settings import (
        SystemSetting, APIKey, SystemSettingAudit,
        CloudStorageConfig, PaymentGatewayConfig, NotificationGatewayConfig
    )
    from app.models.sale import CarbonCreditSale
    from app.models.wallet import Wallet, WalletTransaction, WalletBankAccount, WithdrawalRequest
    from app.models.project_mgmt import ProjectMilestone
    from app.models.registration import BhumiCredRegistration
    from app.models.invoice import Invoice
    from app.models.audit_schedule import AuditSchedule
    from app.models.green_family import GreenFamilyCover
    from app.models.product import Product
    from app.models.category import Category
    from app.models.wishlist import Wishlist
    from app.models.cart import CartItem
    from app.models.order import Order
    from app.models.marketplace import (
        MarketplaceSubscription,
        MarketplaceVendorPayout,
        MarketplaceWishlist,
        MarketplaceVendor,
        MarketplaceCategory,
        MarketplaceProduct,
        MarketplaceInventory,
        MarketplaceOrder,
        MarketplaceOrderItem,
        MarketplaceCoupon,
        MarketplaceReturn,
        MarketplaceReview,
        MarketplacePayment,
        MarketplaceShipping,
    )
    from app.models.financial_wallet import (
        FinancialAuditLog,
        EscrowAccount,
        TaxDeductionCertificate,
        WalletWithdrawal,
        FinancialSettlement,
        CommissionLedger,
        FinancialInvoice,
        TaxLedger,
        PlatformRevenue,
        PlatformFeeConfig,
    )
    from app.models.agri_category import AgriCategory
    from app.models.agri_scheme import AgriScheme
    from app.models.agri_questionnaire import AgriQuestionnaire
    from app.models.agri_assessment import AgriAssessment
    from app.models.agri_application import AgriApplication
    from app.models.agri_application_document import AgriApplicationDocument
    from app.models.agri_application_timeline import AgriApplicationTimeline
    from app.models.audit_log import AuditLog
    from app.models.gateway_request_log import GatewayRequestLog
    from app.models.tree_registration import TreeRegistration
    from app.models.notification import Notification
    from app.models.tree_plan import TreePlan
    from app.models.soil_test import SoilTestBooking
    from app.models.counter import Counter
    from app.models.climate_risk_insurance import ClimateRiskInsuranceCard
    from app.models.support_ticket import SupportTicket
    from app.models.govt import (
        GovtOrganization, Department, AuthorizedPerson, GovtScheme, SchemeApplication, SubsidyDisbursement
    )
    from app.models.partner import (
        Partner, PartnerAgreement, CommissionStructure, PartnerJurisdiction, PartnerStaff,
        GISApiLog, InsuranceMasterPlan, CarbonOfftakeContract, VendorOrder, PartnerComplianceAudit,
        PartnerPerformance, PartnerRevenue, PartnerRating
    )
    from app.models.tree_insurance import (
        TreeInsurancePolicy, TreeInsuranceClaim, InsuranceCompany, InsuranceSurveyor, ClaimSettlement,
        PolicyPremium, PolicyRenewal, InsuranceSpeciesRate, InsuranceSatelliteAudit, InsuranceReinsuranceAllocation, ClaimHistory
    )

    # Rebuild Pydantic forward references for models using Link
    AdminUser.model_rebuild()

    import asyncio

    max_attempts = 3
    for attempt in range(1, max_attempts + 1):
        try:
            configure_dns_resolver()
            if _client is not None:
                try:
                    _client.close()
                except Exception:
                    pass

            tls_kwargs = {"tlsCAFile": certifi.where()}
            if attempt == max_attempts:
                # If certifi handshake timed out or failed twice, fallback to invalid cert allowance
                tls_kwargs = {"tlsAllowInvalidCertificates": True}

            _client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                # ── Connection pool keepalive settings ─────────────────────
                # maxIdleTimeMS: close idle sockets after 5 min so they are
                # recycled before MongoDB Atlas drops them at ~10 min idle.
                maxIdleTimeMS=300_000,
                # heartbeatFrequencyMS: driver pings the server every 30 s
                # to detect stale connections before a real request hits one.
                heartbeatFrequencyMS=30_000,
                # minPoolSize: keep at least 1 socket alive at all times.
                minPoolSize=1,
                # ── Timeout settings ──────────────────────────────────────
                serverSelectionTimeoutMS=10000,
                connectTimeoutMS=10000,
                socketTimeoutMS=30000,
                retryWrites=True,
                **tls_kwargs,
            )

            await init_beanie(
                database=_client[settings.DATABASE_NAME],
                document_models=[
                    Farmer,
                    AdminUser,
                    Role,
                    UserSession,
                    LoginHistory,
                    PasswordResetToken,
                    OTPSession,
                    RefreshTokenSession,
                    FamilyMember,
                    FarmerActivityLog,
                    LandParcel,
                    ProjectEnrollment,
                    SustainabilityProject,
                    Banner,
                    SystemSetting,
                    SystemSettingAudit,
                    APIKey,
                    CloudStorageConfig,
                    PaymentGatewayConfig,
                    NotificationGatewayConfig,
                    CarbonCreditSale,
                    Wallet,
                    WalletTransaction,
                    WalletBankAccount,
                    WithdrawalRequest,
                    ProjectMilestone,
                    BhumiCredRegistration,
                    Invoice,
                    AuditSchedule,
                    GreenFamilyCover,
                    Product,
                    Category,
                    Wishlist,
                    CartItem,
                    Order,
                    MarketplaceSubscription,
                    MarketplaceVendorPayout,
                    MarketplaceWishlist,
                    MarketplaceVendor,
                    MarketplaceCategory,
                    MarketplaceProduct,
                    MarketplaceInventory,
                    MarketplaceOrder,
                    MarketplaceOrderItem,
                    MarketplaceCoupon,
                    MarketplaceReturn,
                    MarketplaceReview,
                    MarketplacePayment,
                    MarketplaceShipping,
                    FinancialAuditLog,
                    EscrowAccount,
                    TaxDeductionCertificate,
                    SoilTestBooking,

                    WalletWithdrawal,
                    FinancialSettlement,
                    CommissionLedger,
                    FinancialInvoice,
                    TaxLedger,
                    PlatformRevenue,
                    PlatformFeeConfig,
                    AgriCategory,
                    AgriScheme,
                    AgriQuestionnaire,
                    AgriAssessment,
                    AgriApplication,
                    AgriApplicationDocument,
                    AgriApplicationTimeline,
                    AuditLog,
                    GatewayRequestLog,
                    TreeRegistration,
                    Notification,
                    TreePlan,
                    Counter,
                    ClimateRiskInsuranceCard,
                    SupportTicket,
                    GovtOrganization,
                    Department,
                    AuthorizedPerson,
                    GovtScheme,
                    SchemeApplication,
                    SubsidyDisbursement,
                    Partner,
                    PartnerAgreement,
                    CommissionStructure,
                    PartnerJurisdiction,
                    PartnerStaff,
                    GISApiLog,
                    InsuranceMasterPlan,
                    CarbonOfftakeContract,
                    VendorOrder,
                    PartnerComplianceAudit,
                    PartnerPerformance,
                    PartnerRevenue,
                    PartnerRating,
                    TreeInsurancePolicy,
                    TreeInsuranceClaim,
                    InsuranceCompany,
                    InsuranceSurveyor,
                    ClaimSettlement,
                    PolicyPremium,
                    PolicyRenewal,
                    InsuranceSpeciesRate,
                    InsuranceSatelliteAudit,
                    InsuranceReinsuranceAllocation,
                    ClaimHistory,
                ],
                allow_index_dropping=True,
            )
            logger.info("MongoDB connected successfully — database: %s", settings.DATABASE_NAME)
            return
        except Exception as err:
            logger.warning(f"MongoDB connection attempt {attempt}/{max_attempts} failed: {err}")
            if attempt == max_attempts:
                logger.error("MongoDB Atlas connection unavailable (%s). Continuing in resilient offline/standalone mode.", err)
                return
            await asyncio.sleep(1.5)

    logger.info(
        "MongoDB connected — database: %s",
        settings.DATABASE_NAME,
    )


async def disconnect_db() -> None:
    global _client
    if _client:
        _client.close()
        _client = None
        logger.info("MongoDB connection closed.")


def get_client() -> AsyncIOMotorClient:
    if _client is None:
        raise RuntimeError("Database not initialised. Call connect_db() first.")
    return _client


def get_db():
    if _client is None:
        raise RuntimeError("Database not initialised. Call connect_db() first.")
    return _client[settings.DATABASE_NAME]


async def ping_db() -> bool:
    """Ping MongoDB to verify the connection is alive.
    Returns True on success, False if the ping fails.
    Used by the background keepalive task in main.py.
    """
    global _client
    if _client is None:
        return False
    try:
        await _client.admin.command("ping")
        return True
    except Exception as exc:
        logger.warning("MongoDB ping failed: %s — will attempt reconnect.", exc)
        return False


async def reconnect_db() -> None:
    """Fully tear down and re-establish the MongoDB connection.
    Called automatically by the keepalive task when a ping fails.
    """
    global _client
    logger.warning("Reconnecting to MongoDB Atlas...")
    if _client is not None:
        try:
            _client.close()
        except Exception:
            pass
        _client = None
    await connect_db()
    logger.info("MongoDB reconnect complete.")
