from app.repositories.farmer import FarmerRepository

from app.repositories.otp_session import OTPSessionRepository
from app.repositories.refresh_token import RefreshTokenRepository
from app.repositories.admin_user import AdminUserRepository
from app.repositories.family_member import FamilyMemberRepository
from app.repositories.land_parcel import LandParcelRepository
from app.repositories.project_enrollment import ProjectEnrollmentRepository
from app.repositories.sustainability_project import SustainabilityProjectRepository
from app.repositories.registration import BhumiCredRegistrationRepository, InvoiceRepository, AuditScheduleRepository
from app.repositories.wallet import (
    WalletRepository,
    WalletTransactionRepository,
    WalletBankAccountRepository,
    WithdrawalRequestRepository,
)
from app.repositories.tree_registration import TreeRegistrationRepository
from app.repositories.audit_log import AuditLogRepository
from app.repositories.gateway_request_log import GatewayRequestLogRepository
from app.services.auth_service import AuthService
from app.services.admin_auth_service import AdminAuthService
from app.services.farmer_profile_service import FarmerProfileService
from app.services.admin_farmer_service import AdminFarmerService
from app.services.projects_service import ProjectsService
from app.services.registration import BhumiCredRegistrationService
from app.services.wallet_service import WalletService
from app.services.admin_wallet_service import AdminWalletService
from app.services.admin_activity_log_service import AdminActivityLogService
from app.services.product import VendorProductService
from app.integrations.cloudinary_service import CloudinaryService

# Module-level singleton — CloudinaryService configures the Cloudinary SDK
# once at startup.  is_enabled returns False when STORAGE_BACKEND != "cloudinary"
# so no Cloudinary calls are made in local / S3 mode.
_cloudinary_service = CloudinaryService()
from app.services.tree_registration_service import TreeRegistrationService
from app.repositories.notification import NotificationRepository
from app.services.notification_service import NotificationService



def get_auth_service() -> AuthService:
    return AuthService(
        farmer_repo=FarmerRepository(),
        otp_repo=OTPSessionRepository(),
        token_repo=RefreshTokenRepository(),
        audit_repo=AuditLogRepository(),
        notification_service=get_notification_service(),
    )


def get_admin_auth_service() -> AdminAuthService:
    return AdminAuthService(
        admin_repo=AdminUserRepository(),
        token_repo=RefreshTokenRepository(),
        audit_repo=AuditLogRepository(),
    )


def get_farmer_profile_service() -> FarmerProfileService:
    return FarmerProfileService(
        farmer_repo=FarmerRepository(),
        family_repo=FamilyMemberRepository(),
        land_repo=LandParcelRepository(),
        cloudinary_svc=_cloudinary_service,
        notification_service=get_notification_service(),
    )



def get_admin_farmer_service() -> AdminFarmerService:
    return AdminFarmerService(
        farmer_repo=FarmerRepository(),
        family_repo=FamilyMemberRepository(),
        land_repo=LandParcelRepository(),
        audit_repo=AuditLogRepository(),
        notification_service=get_notification_service(),
    )



def get_admin_activity_log_service() -> AdminActivityLogService:
    return AdminActivityLogService(
        audit_repo=AuditLogRepository(),
        gateway_repo=GatewayRequestLogRepository(),
    )


def get_projects_service() -> ProjectsService:
    return ProjectsService(
        farmer_repo=FarmerRepository(),
        land_repo=LandParcelRepository(),
        enrollment_repo=ProjectEnrollmentRepository(),
        project_repo=SustainabilityProjectRepository(),
        notification_service=get_notification_service(),
    )

def get_registration_service() -> BhumiCredRegistrationService:
    return BhumiCredRegistrationService(
        registration_repo=BhumiCredRegistrationRepository(),
        invoice_repo=InvoiceRepository(),
        audit_repo=AuditScheduleRepository()
    )

def get_wallet_service() -> WalletService:
    return WalletService(
        wallet_repo=WalletRepository(),
        tx_repo=WalletTransactionRepository(),
        bank_repo=WalletBankAccountRepository(),
        withdrawal_repo=WithdrawalRequestRepository(),
        farmer_repo=FarmerRepository(),
        notification_service=get_notification_service(),
    )


def get_admin_wallet_service() -> AdminWalletService:
    return AdminWalletService(
        wallet_repo=WalletRepository(),
        tx_repo=WalletTransactionRepository(),
        withdrawal_repo=WithdrawalRequestRepository(),
        farmer_repo=FarmerRepository(),
        notification_service=get_notification_service(),
    )

def get_tree_registration_service() -> TreeRegistrationService:
    return TreeRegistrationService(
        tree_repo=TreeRegistrationRepository(),
        farmer_repo=FarmerRepository(),
        notification_service=get_notification_service(),
        cloudinary_svc=_cloudinary_service,
    )

def get_notification_service() -> NotificationService:
    return NotificationService(
        repo=NotificationRepository(),
    )

def get_cloudinary_service() -> CloudinaryService:
    return _cloudinary_service




def get_vendor_product_service() -> VendorProductService:
    from app.repositories.product import ProductRepository
    from app.repositories.category import CategoryRepository
    from app.services.inventory import InventoryService

    product_repo = ProductRepository()
    category_repo = CategoryRepository()
    inventory_service = InventoryService(product_repo)
    return VendorProductService(
        product_repo=product_repo,
        category_repo=category_repo,
        inventory_service=inventory_service,
        cloudinary_svc=_cloudinary_service,
        notification_service=get_notification_service(),
    )
