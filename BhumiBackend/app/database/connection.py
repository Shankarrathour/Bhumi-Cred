import certifi
import dns.resolver
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.config.settings import settings

logger = logging.getLogger(__name__)

# Fix Windows / local network DNS timeouts for MongoDB Atlas SRV resolution
try:
    resolver = dns.resolver.get_default_resolver()
    resolver.timeout = 2.0
    resolver.lifetime = 4.0
    public_dns = ["8.8.8.8", "1.1.1.1", "8.8.4.4"]
    existing = [ns for ns in getattr(resolver, "nameservers", []) if ns not in public_dns]
    # Put public DNS FIRST so dead local router/ISP DNS servers are bypassed
    resolver.nameservers = public_dns + existing
except Exception as exc:
    logger.warning("Could not configure fallback DNS resolvers: %s", exc)

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
    from app.models.sale import CarbonCreditSale
    from app.models.wallet import Wallet, WalletTransaction, WalletBankAccount, WithdrawalRequest
    from app.homescreen.models import Milestone
    from app.models.registration import BhumiCredRegistration
    from app.models.invoice import Invoice
    from app.models.audit_schedule import AuditSchedule
    from app.models.green_family import GreenFamilyCover
    from app.models.vendor import Vendor
    from app.models.product import Product
    from app.models.category import Category
    from app.models.wishlist import Wishlist
    from app.models.cart import CartItem
    from app.models.order import Order
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
    from app.models.support_ticket import SupportTicket
    from app.models.tree_plan import TreePlan
    from app.models.counter import Counter
    from app.models.climate_risk_insurance import ClimateRiskInsuranceCard

    # Rebuild Pydantic forward references for models using Link
    AdminUser.model_rebuild()

    import asyncio

    max_attempts = 3
    for attempt in range(1, max_attempts + 1):
        try:
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
                serverSelectionTimeoutMS=15000,
                connectTimeoutMS=15000,
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
                    CarbonCreditSale,
                    Wallet,
                    WalletTransaction,
                    WalletBankAccount,
                    WithdrawalRequest,
                    Milestone,
                    BhumiCredRegistration,
                    Invoice,
                    AuditSchedule,
                    GreenFamilyCover,
                    Vendor,
                    Product,
                    Category,
                    Wishlist,
                    CartItem,
                    Order,
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
                    SupportTicket,
                    TreePlan,
                    Counter,
                    ClimateRiskInsuranceCard,
                ],
                allow_index_dropping=True,
            )
            break
        except Exception as err:
            logger.warning(f"MongoDB connection attempt {attempt}/{max_attempts} failed: {err}")
            if attempt == max_attempts:
                raise err
            await asyncio.sleep(2)

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
