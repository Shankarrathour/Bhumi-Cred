import logging
from typing import Optional
from fastapi import UploadFile, status
from app.core.exceptions import AppException
from app.auth.password import hash_password, verify_password
from app.auth.jwt import create_access_token, TOKEN_TYPE_VENDOR
from app.repositories.vendor import VendorRepository
from app.schemas.vendor_auth import (
    VendorRegisterRequest,
    VendorLoginRequest,
    VendorAuthResponse,
    VendorProfileResponse,
    VendorWizardUpdateRequest,
)
from datetime import datetime, timezone
from app.config.settings import settings
from app.models.vendor import Vendor
from app.utils.upload import (
    upload_file,
    ALLOWED_IMAGE_TYPES,
    ALLOWED_DOCUMENT_TYPES,
    MAX_PHOTO_BYTES,
    MAX_DOCUMENT_BYTES,
)
from app.integrations.cloudinary_service import CloudinaryService
from app.utils.id_generator import generate_public_id
from app.repositories.notification import NotificationRepository
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)

class VendorAuthService:
    def __init__(
        self,
        vendor_repo: VendorRepository,
        cloudinary_svc: Optional[CloudinaryService] = None,
        notification_service: Optional[NotificationService] = None,
    ):
        self.vendor_repo = vendor_repo
        self._cloudinary = cloudinary_svc
        self._notifications = notification_service or NotificationService(NotificationRepository())

    def _build_profile_response(self, vendor: Vendor) -> VendorProfileResponse:
        return VendorProfileResponse(
            id=str(vendor.id),
            vendor_id=vendor.vendor_id,
            name=vendor.name,
            father_name=vendor.father_name,
            email=vendor.email,
            phone=vendor.phone,
            dob=vendor.dob,
            gender=vendor.gender,
            profile_photo_url=vendor.profile_photo_url,
            business_name=vendor.business_name,
            gst_number=vendor.gst_number,
            years_of_experience=vendor.years_of_experience,
            business_description=vendor.business_description,
            address=vendor.address,
            state=vendor.state,
            district=vendor.district,
            tehsil=vendor.tehsil,
            gram_panchayat=vendor.gram_panchayat,
            village_city=vendor.village_city,
            pincode=vendor.pincode,
            latitude=vendor.latitude,
            longitude=vendor.longitude,
            kyc_identity_type=vendor.kyc_identity_type,
            kyc_identity_number=vendor.kyc_identity_number,
            kyc_document_front_url=vendor.kyc_document_front_url,
            kyc_document_back_url=vendor.kyc_document_back_url,
            bank_account_number=vendor.bank_account_number,
            bank_ifsc=vendor.bank_ifsc,
            bank_holder_name=vendor.bank_holder_name,
            is_active=vendor.is_active,
            is_verified=vendor.is_verified,
            status=vendor.status,
            rejection_reason=vendor.rejection_reason,
            wallet_balance=vendor.wallet_balance,
            created_at=vendor.created_at,
            updated_at=vendor.updated_at,
        )

    async def register_vendor(self, data: VendorRegisterRequest) -> VendorAuthResponse:
        # Check duplicates
        if await self.vendor_repo.get_by_email(data.email):
            raise AppException(
                status_code=status.HTTP_409_CONFLICT,
                error_code="EMAIL_EXISTS",
                detail="Email is already registered"
            )
            
        if await self.vendor_repo.get_by_phone(data.phone):
            raise AppException(
                status_code=status.HTTP_409_CONFLICT,
                error_code="PHONE_EXISTS",
                detail="Phone number is already registered"
            )

        # Create vendor
        vendor_id = await generate_public_id("VEN", "vendor_id")
        vendor = Vendor(
            vendor_id=vendor_id,
            name=data.name,
            email=data.email,
            phone=data.phone,
            password_hash=hash_password(data.password),
            business_name=data.business_name,
            gst_number=data.gst_number,
            address=data.address
        )

        await self.vendor_repo.create(vendor)

        try:
            await self._notifications.create_admin_notification(
                "Vendor Registration",
                f"Vendor {vendor.vendor_id} registered successfully.",
                type="registration",
                actor_type="vendor",
            )
        except Exception:
            logger.exception(f"Failed to create admin notification for new vendor {vendor.id}")

        # Generate token
        token, expires_in = create_access_token(
            subject=str(vendor.id),
            token_type=TOKEN_TYPE_VENDOR
        )

        profile = self._build_profile_response(vendor)

        return VendorAuthResponse(
            access_token=token,
            expires_in=expires_in,
            vendor=profile
        )

    async def login_vendor(self, data: VendorLoginRequest) -> VendorAuthResponse:
        vendor = await self.vendor_repo.get_by_email(data.email)
        
        if not vendor or not verify_password(data.password, vendor.password_hash):
            raise AppException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                error_code="INVALID_CREDENTIALS",
                detail="Invalid email or password"
            )
            
        if not vendor.is_active:
            raise AppException(
                status_code=status.HTTP_403_FORBIDDEN,
                error_code="VENDOR_BLOCKED",
                detail="Vendor account is blocked or inactive"
            )

        token, expires_in = create_access_token(
            subject=str(vendor.id),
            token_type=TOKEN_TYPE_VENDOR
        )
        
        profile = self._build_profile_response(vendor)

        return VendorAuthResponse(
            access_token=token,
            expires_in=expires_in,
            vendor=profile
        )

    async def get_current_vendor_profile(self, vendor: Vendor) -> VendorProfileResponse:
        return self._build_profile_response(vendor)

    async def update_vendor_profile(
        self, vendor: Vendor, data: VendorWizardUpdateRequest
    ) -> VendorProfileResponse:
        """
        Called once from the Review step of the multi-step registration wizard
        (and again on Resubmit after a rejection). Only overwrites fields that
        were actually provided, so it's safe to call incrementally too.
        Resubmitting always resets status back to Pending for re-review.
        """
        if data.name is not None:
            vendor.name = data.name
        if data.father_name is not None:
            vendor.father_name = data.father_name
        if data.email is not None:
            vendor.email = data.email
        if data.dob is not None:
            vendor.dob = data.dob
        if data.gender is not None:
            vendor.gender = data.gender
        if data.business_name is not None:
            vendor.business_name = data.business_name
        if data.gst_number is not None:
            vendor.gst_number = data.gst_number
        if data.years_of_experience is not None:
            vendor.years_of_experience = data.years_of_experience
        if data.business_description is not None:
            vendor.business_description = data.business_description
        if data.address is not None:
            vendor.address = data.address
        if data.state is not None:
            vendor.state = data.state
        if data.district is not None:
            vendor.district = data.district
        if data.tehsil is not None:
            vendor.tehsil = data.tehsil
        if data.gram_panchayat is not None:
            vendor.gram_panchayat = data.gram_panchayat
        if data.village_city is not None:
            vendor.village_city = data.village_city
        if data.pincode is not None:
            vendor.pincode = data.pincode
        if data.latitude is not None:
            vendor.latitude = data.latitude
        if data.longitude is not None:
            vendor.longitude = data.longitude
        if data.kyc_identity_type is not None:
            vendor.kyc_identity_type = data.kyc_identity_type
        if data.kyc_identity_number is not None:
            vendor.kyc_identity_number = data.kyc_identity_number
        if data.bank_account_number is not None:
            vendor.bank_account_number = data.bank_account_number
        if data.bank_ifsc is not None:
            vendor.bank_ifsc = data.bank_ifsc
        if data.bank_holder_name is not None:
            vendor.bank_holder_name = data.bank_holder_name

        if vendor.status == "Rejected":
            vendor.status = "Pending"
        vendor.rejection_reason = None
        vendor.updated_at = datetime.now(timezone.utc)
        await vendor.save()

        return await self.get_current_vendor_profile(vendor)

    # ── File uploads ─────────────────────────────────────────────────────────

    async def upload_photo(self, vendor: Vendor, file: UploadFile) -> str:
        if self._cloudinary and self._cloudinary.is_enabled:
            old_asset = vendor.profile_photo_asset
            folder = f"bhumi/{settings.cloudinary_env}/vendors/{vendor.id}/photo"
            new_asset = await self._cloudinary.upload(
                file, folder=folder, allowed_types=ALLOWED_IMAGE_TYPES, max_bytes=MAX_PHOTO_BYTES,
            )
            try:
                vendor.profile_photo_url = new_asset.secure_url
                vendor.profile_photo_asset = new_asset
                vendor.updated_at = datetime.now(timezone.utc)
                await vendor.save()
            except Exception:
                await self._cloudinary.delete(new_asset)
                raise
            if old_asset:
                await self._cloudinary.delete(old_asset)
            return new_asset.secure_url

        url = await upload_file(file, f"vendors/{vendor.id}/photo", ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES)
        vendor.profile_photo_url = url
        vendor.updated_at = datetime.now(timezone.utc)
        await vendor.save()
        return url

    async def upload_kyc_document(self, vendor: Vendor, slot: str, file: UploadFile) -> str:
        """slot is 'front' or 'back' — 'back' is only meaningful for Aadhaar."""
        if slot not in ("front", "back"):
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code="INVALID_DOCUMENT_SLOT",
                detail="slot must be 'front' or 'back'.",
            )

        if self._cloudinary and self._cloudinary.is_enabled:
            old_asset = vendor.kyc_document_front_asset if slot == "front" else vendor.kyc_document_back_asset
            folder = f"bhumi/{settings.cloudinary_env}/vendors/{vendor.id}/kyc"
            new_asset = await self._cloudinary.upload(
                file, folder=folder, allowed_types=ALLOWED_DOCUMENT_TYPES, max_bytes=MAX_DOCUMENT_BYTES,
            )
            try:
                if slot == "front":
                    vendor.kyc_document_front_url = new_asset.secure_url
                    vendor.kyc_document_front_asset = new_asset
                else:
                    vendor.kyc_document_back_url = new_asset.secure_url
                    vendor.kyc_document_back_asset = new_asset
                vendor.updated_at = datetime.now(timezone.utc)
                await vendor.save()
            except Exception:
                await self._cloudinary.delete(new_asset)
                raise
            if old_asset:
                await self._cloudinary.delete(old_asset)
            return new_asset.secure_url

        url = await upload_file(file, f"vendors/{vendor.id}/kyc/{slot}", ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_BYTES)
        if slot == "front":
            vendor.kyc_document_front_url = url
        else:
            vendor.kyc_document_back_url = url
        vendor.updated_at = datetime.now(timezone.utc)
        await vendor.save()
        return url
