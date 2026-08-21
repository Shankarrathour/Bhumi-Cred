import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import UploadFile

logger = logging.getLogger(__name__)

from app.models.farmer import (
    Farmer,
    KYCStatus,
    Address as EmbeddedAddress,
    BankDetails,
    IdentityDetails,
)
from app.models.family_member import FamilyMember
from app.models.land_parcel import LandParcel, LandVerificationStatus
from app.repositories.farmer import FarmerRepository
from app.repositories.family_member import FamilyMemberRepository
from app.repositories.land_parcel import LandParcelRepository
from app.schemas.farmer_profile import UpdateProfileRequest, FarmerProfileResponse
from app.schemas.address import AddressSchema, UpdateAddressRequest, AddressResponse
from app.schemas.family import (
    CreateFamilyMemberRequest,
    UpdateFamilyMemberRequest,
    FamilyMemberResponse,
)
from app.schemas.land import (
    CreateLandParcelRequest,
    UpdateLandParcelRequest,
    LandParcelResponse,
    LandSummaryResponse,
)
from app.schemas.bank import UpdateBankRequest, BankResponse
from app.schemas.identity import UpdateIdentityRequest, IdentityResponse, KYCStatusResponse
from app.core.exceptions import (
    FarmerNotFoundException,
    FamilyMemberNotFoundException,
    LandParcelNotFoundException,
    KYCAlreadyApprovedException,
)
from app.config.settings import settings
from app.utils.upload import (
    upload_file,
    ALLOWED_IMAGE_TYPES,
    ALLOWED_DOCUMENT_TYPES,
    MAX_PHOTO_BYTES,
    MAX_DOCUMENT_BYTES,
)
from app.integrations.cloudinary_service import CloudinaryService
from app.repositories.notification import NotificationRepository
from app.services.notification_service import NotificationService


def _mask_aadhaar(number: str) -> str:
    return f"XXXX-XXXX-{number[-4:]}" if len(number) >= 4 else "XXXX"


def _mask_account(number: str) -> str:
    if len(number) <= 4:
        return number
    return "X" * (len(number) - 4) + number[-4:]


class FarmerProfileService:
    def __init__(
        self,
        farmer_repo: FarmerRepository,
        family_repo: FamilyMemberRepository,
        land_repo: LandParcelRepository,
        cloudinary_svc: Optional[CloudinaryService] = None,
        notification_service: Optional[NotificationService] = None,
    ):
        self._notifications = notification_service or NotificationService(NotificationRepository())
        self._farmers = farmer_repo
        self._family = family_repo
        self._land = land_repo
        self._cloudinary = cloudinary_svc

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def _get_farmer(self, farmer_id: str) -> Farmer:
        farmer = await self._farmers.get_by_id(farmer_id)
        if not farmer:
            raise FarmerNotFoundException()
        return farmer

    def _check_onboarding(self, farmer: Farmer) -> bool:
        idd = farmer.identity_details
        return bool(
            farmer.full_name
            and farmer.state
            and farmer.district
            and farmer.city
            and farmer.village
            and farmer.full_address
            and idd
            and (idd.aadhaar_number or idd.pan_number)
        )

    def _build_profile_response(self, farmer: Farmer) -> FarmerProfileResponse:
        return FarmerProfileResponse(
            id=str(farmer.id),
            farmer_id=farmer.farmer_id,
            mobile=farmer.mobile,
            full_name=farmer.full_name,
            father_name=farmer.father_name,
            dob=farmer.dob,
            gender=farmer.gender,
            category=farmer.category,
            education=farmer.education,
            occupation=farmer.occupation,
            email=farmer.email,
            farmer_photo_url=farmer.farmer_photo_url,
            kyc_status=farmer.kyc_status,
            is_active=farmer.is_active,
            onboarding_completed=farmer.onboarding_completed,
            locale=farmer.locale,
            wallet_balance=farmer.wallet_balance,
            sustainability_score=farmer.sustainability_score,
            total_acreage=farmer.total_acreage,
            total_trees=farmer.total_trees,
            carbon_credits_generated=farmer.carbon_credits_generated,
            created_at=farmer.created_at,
            updated_at=farmer.updated_at,
        )

    def _build_address_response(self, farmer: Farmer) -> AddressResponse:
        current = AddressSchema(
            state=farmer.state,
            district=farmer.district,
            tehsil=farmer.tehsil,
            village=farmer.village,
            city=farmer.city,
            pincode=farmer.pincode,
            full_address=farmer.full_address,
            gram_panchayat=farmer.gram_panchayat,
            vikash_khand=farmer.vikash_khand,
        )
        perm: AddressSchema | None = None
        if farmer.permanent_address:
            pa = farmer.permanent_address
            perm = AddressSchema(
                state=pa.state,
                district=pa.district,
                tehsil=pa.tehsil,
                village=pa.village,
                city=pa.city,
                pincode=pa.pincode,
                full_address=pa.full_address,
            )
        return AddressResponse(current_address=current, permanent_address=perm)

    def _build_bank_response(self, farmer: Farmer) -> BankResponse:
        bd = farmer.bank_details
        if not bd:
            return BankResponse()
        masked = _mask_account(bd.account_number) if bd.account_number else None
        return BankResponse(
            bank_name=bd.bank_name,
            ifsc_code=bd.ifsc_code,
            account_number_masked=masked,
            account_holder_name=bd.account_holder_name,
            is_verified=bd.is_verified,
            added_at=bd.added_at,
        )

    def _build_identity_response(self, farmer: Farmer) -> IdentityResponse:
        idd = farmer.identity_details
        if not idd:
            return IdentityResponse()
        masked = _mask_aadhaar(idd.aadhaar_number) if idd.aadhaar_number else None
        return IdentityResponse(
            aadhaar_masked=masked,
            pan_number=idd.pan_number,
            aadhaar_url=idd.aadhaar_url,
            pan_url=idd.pan_url,
            submitted_at=idd.submitted_at,
        )

    @staticmethod
    def _family_response(m: FamilyMember) -> FamilyMemberResponse:
        return FamilyMemberResponse(
            id=str(m.id),
            name=m.name,
            relationship=m.relationship,
            age=m.age,
            occupation=m.occupation,
            created_at=m.created_at,
            updated_at=m.updated_at,
        )

    @staticmethod
    def _land_response(p: LandParcel) -> LandParcelResponse:
        return LandParcelResponse(
            id=str(p.id),
            name=getattr(p, "name", None),
            khasra_number=p.khasra_number or p.survey_number,
            survey_number=p.survey_number or p.khasra_number,
            area_acres=p.area_acres,
            area_unit=getattr(p, "area_unit", None),
            ownership_type=p.ownership_type,
            plantation_date=getattr(p, "plantation_date", None),
            is_irrigated=p.is_irrigated,
            belongs_to_another_person=p.belongs_to_another_person,
            fathers_name=p.fathers_name,
            country=p.country,
            state=p.state,
            district=p.district,
            city=p.city,
            gram_panchayat=p.gram_panchayat,
            vikash_khand=p.vikash_khand,
            tehsil=p.tehsil,
            village=p.village,
            full_address=p.full_address,
            landmark=p.landmark,
            coordinates=p.coordinates,
            boundary_polygon=p.boundary_polygon,
            land_type=getattr(p, "land_type", None),
            crop_type=p.crop_type,
            soil_type=p.soil_type,
            soil_organic_carbon=p.soil_organic_carbon,
            tree_stock_count=p.tree_stock_count,
            plantation_area_acres=p.plantation_area_acres,
            agroforestry_species=p.agroforestry_species,
            trees=getattr(p, "trees", []),
            land_document_url=p.land_document_url,
            land_photo_urls=getattr(p, "land_photo_urls", []),
            verification_status=p.verification_status,
            verification_remarks=p.verification_remarks,
            correction_fields=getattr(p, "correction_fields", None),
            verified_at=p.verified_at,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )

    async def _recalc_acreage(self, farmer: Farmer) -> None:
        total = await self._land.get_total_acreage(str(farmer.id))
        if farmer.total_acreage != total:
            farmer.total_acreage = total
            farmer.updated_at = datetime.now(timezone.utc)
            await farmer.save()

    # ── Profile ───────────────────────────────────────────────────────────────

    async def get_profile(self, farmer_id: str) -> FarmerProfileResponse:
        farmer = await self._get_farmer(farmer_id)
        return self._build_profile_response(farmer)

    async def update_profile(
        self, farmer_id: str, data: UpdateProfileRequest
    ) -> FarmerProfileResponse:
        farmer = await self._get_farmer(farmer_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(farmer, field, value)
        farmer.onboarding_completed = self._check_onboarding(farmer)
        farmer.updated_at = datetime.now(timezone.utc)
        await farmer.save()
        return self._build_profile_response(farmer)

    async def upload_photo(self, farmer_id: str, file: UploadFile) -> str:
        logger.info("Photo upload started [farmer_id=%s filename=%s]", farmer_id, file.filename)
        farmer = await self._get_farmer(farmer_id)

        if self._cloudinary and self._cloudinary.is_enabled:
            # ── Cloudinary path ───────────────────────────────────────────
            old_asset = farmer.farmer_photo_asset
            folder = f"bhumi/{settings.cloudinary_env}/farmers/{farmer_id}/photo"

            # Step 1: Upload new asset to Cloudinary
            try:
                new_asset = await self._cloudinary.upload(
                    file,
                    folder=folder,
                    allowed_types=ALLOWED_IMAGE_TYPES,
                    max_bytes=MAX_PHOTO_BYTES,
                )
                logger.info(
                    "Cloudinary upload success [farmer_id=%s url=%s]",
                    farmer_id, new_asset.secure_url,
                )
            except Exception:
                logger.error("Cloudinary upload failed [farmer_id=%s]", farmer_id)
                raise

            # Step 2: Update MongoDB — rollback if save fails
            try:
                farmer.farmer_photo_url = new_asset.secure_url
                farmer.farmer_photo_asset = new_asset
                farmer.updated_at = datetime.now(timezone.utc)
                await farmer.save()
                logger.info("MongoDB updated [farmer_id=%s field=farmer_photo_url]", farmer_id)
            except Exception:
                logger.error("MongoDB update failed [farmer_id=%s] — rolling back Cloudinary asset", farmer_id)
                await self._cloudinary.delete(new_asset)
                raise

            # Step 3: Delete previous Cloudinary asset (post-commit cleanup)
            if old_asset:
                await self._cloudinary.delete(old_asset)

            return new_asset.secure_url

        # ── Local / S3 fallback path ──────────────────────────────────────
        url = await upload_file(
            file, f"photos/{farmer_id}", ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES
        )
        farmer.farmer_photo_url = url
        farmer.updated_at = datetime.now(timezone.utc)
        try:
            await farmer.save()
            logger.info("MongoDB updated [farmer_id=%s field=farmer_photo_url url=%s]", farmer_id, url)
        except Exception:
            logger.error("MongoDB update failed [farmer_id=%s]", farmer_id)
            raise
        return url

    # ── Address ───────────────────────────────────────────────────────────────

    async def get_address(self, farmer_id: str) -> AddressResponse:
        farmer = await self._get_farmer(farmer_id)
        return self._build_address_response(farmer)

    async def update_address(
        self, farmer_id: str, data: UpdateAddressRequest
    ) -> AddressResponse:
        farmer = await self._get_farmer(farmer_id)

        if data.current_address is not None:
            ca = data.current_address
            farmer.state = ca.state
            farmer.district = ca.district
            farmer.tehsil = ca.tehsil
            farmer.village = ca.village
            farmer.city = ca.city
            farmer.pincode = ca.pincode
            farmer.full_address = ca.full_address
            if ca.gram_panchayat is not None:
                farmer.gram_panchayat = ca.gram_panchayat
            if ca.vikash_khand is not None:
                farmer.vikash_khand = ca.vikash_khand

        if data.permanent_address is not None:
            pa = data.permanent_address
            farmer.permanent_address = EmbeddedAddress(
                state=pa.state,
                district=pa.district,
                tehsil=pa.tehsil,
                village=pa.village,
                city=pa.city,
                pincode=pa.pincode,
                full_address=pa.full_address,
            )

        farmer.onboarding_completed = self._check_onboarding(farmer)
        farmer.updated_at = datetime.now(timezone.utc)
        await farmer.save()
        return self._build_address_response(farmer)

    # ── Family ────────────────────────────────────────────────────────────────

    async def get_family(self, farmer_id: str) -> list[FamilyMemberResponse]:
        await self._get_farmer(farmer_id)
        members = await self._family.get_active_by_farmer(farmer_id)
        return [self._family_response(m) for m in members]

    async def add_family_member(
        self, farmer_id: str, data: CreateFamilyMemberRequest
    ) -> FamilyMemberResponse:
        await self._get_farmer(farmer_id)
        now = datetime.now(timezone.utc)
        member = FamilyMember(
            farmer_id=farmer_id,
            name=data.name,
            relationship=data.relationship,
            age=data.age,
            occupation=data.occupation,
            created_at=now,
            updated_at=now,
        )
        await self._family.create(member)
        return self._family_response(member)

    async def update_family_member(
        self, farmer_id: str, member_id: str, data: UpdateFamilyMemberRequest
    ) -> FamilyMemberResponse:
        member = await self._family.get_by_id_and_farmer(member_id, farmer_id)
        if not member:
            raise FamilyMemberNotFoundException()
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(member, field, value)
        member.updated_at = datetime.now(timezone.utc)
        await member.save()
        return self._family_response(member)

    async def delete_family_member(self, farmer_id: str, member_id: str) -> None:
        member = await self._family.get_by_id_and_farmer(member_id, farmer_id)
        if not member:
            raise FamilyMemberNotFoundException()
        member.is_active = False
        member.updated_at = datetime.now(timezone.utc)
        await member.save()

    # ── Land ──────────────────────────────────────────────────────────────────

    async def get_land(self, farmer_id: str) -> LandSummaryResponse:
        await self._get_farmer(farmer_id)
        parcels = await self._land.get_active_by_farmer(farmer_id)
        total = sum(p.area_acres for p in parcels)
        irrigated = sum(p.area_acres for p in parcels if p.is_irrigated)
        return LandSummaryResponse(
            parcels=[self._land_response(p) for p in parcels],
            total_area_acres=total,
            irrigated_area_acres=irrigated,
            non_irrigated_area_acres=total - irrigated,
            total_parcels=len(parcels),
        )

    async def add_land_parcel(
        self, farmer_id: str, data: CreateLandParcelRequest
    ) -> LandParcelResponse:
        farmer = await self._get_farmer(farmer_id)
        now = datetime.now(timezone.utc)

        # Deduplication guard: prevent identical double-submit within 15 seconds
        from datetime import timedelta
        from beanie import PydanticObjectId
        recent_cutoff = now - timedelta(seconds=15)
        farmer_ids = [farmer_id]
        if PydanticObjectId.is_valid(farmer_id):
            farmer_ids.append(PydanticObjectId(farmer_id))
        existing_duplicate = await LandParcel.find_one(
            {
                "farmer_id": {"$in": farmer_ids},
                "area_acres": data.area_acres,
                "village": data.village,
                "created_at": {"$gte": recent_cutoff},
            }
        )
        if existing_duplicate:
            return self._land_response(existing_duplicate)

        parcel = LandParcel(
            farmer_id=farmer_id,
            name=data.name,
            khasra_number=data.khasra_number or data.survey_number,
            survey_number=data.survey_number or data.khasra_number,
            area_acres=data.area_acres,
            area_unit=data.area_unit,
            ownership_type=data.ownership_type,
            plantation_date=data.plantation_date,
            is_irrigated=data.is_irrigated,
            belongs_to_another_person=data.belongs_to_another_person,
            fathers_name=data.fathers_name,
            country=data.country,
            state=data.state,
            district=data.district,
            city=data.city,
            gram_panchayat=data.gram_panchayat,
            vikash_khand=data.vikash_khand,
            tehsil=data.tehsil,
            village=data.village,
            full_address=data.full_address,
            landmark=data.landmark,
            coordinates=data.coordinates,
            boundary_polygon=data.boundary_polygon,
            land_type=data.land_type,
            crop_type=data.crop_type,
            soil_type=data.soil_type,
            tree_stock_count=sum(t.count for t in data.trees) if data.trees else data.tree_stock_count,
            plantation_area_acres=data.plantation_area_acres,
            agroforestry_species=data.agroforestry_species,
            trees=data.trees or [],
            land_document_url=data.land_document_url,
            land_photo_urls=data.land_photo_urls or [],
            verification_status=LandVerificationStatus.PENDING,
            created_at=now,
            updated_at=now,
        )
        await self._land.create(parcel)
        await self._recalc_acreage(farmer)

        try:
            await self._notifications.create_admin_notification(
                "New Land Registered",
                f"Farmer {farmer.farmer_id} submitted a new land for verification.",
                type="land",
                actor_type="farmer",
            )
        except Exception:
            logger.exception(f"Failed to create admin notification for new land parcel [farmer_id={farmer.id}]")

        return self._land_response(parcel)

    async def update_land_parcel(
        self, farmer_id: str, parcel_id: str, data: UpdateLandParcelRequest
    ) -> LandParcelResponse:
        farmer = await self._get_farmer(farmer_id)
        parcel = await self._land.get_by_id_and_farmer(parcel_id, farmer_id)
        if not parcel:
            raise LandParcelNotFoundException()
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(parcel, field, value)
        
        if parcel.verification_status == LandVerificationStatus.CORRECTION_REQUIRED:
            parcel.verification_status = LandVerificationStatus.SUBMITTED
            parcel.correction_fields = None
            
        parcel.updated_at = datetime.now(timezone.utc)
        await parcel.save()
        await self._recalc_acreage(farmer)
        return self._land_response(parcel)

    async def delete_land_parcel(self, farmer_id: str, parcel_id: str) -> None:
        farmer = await self._get_farmer(farmer_id)
        parcel = await self._land.get_by_id_and_farmer(parcel_id, farmer_id)
        if not parcel:
            raise LandParcelNotFoundException()

        # Delete Cloudinary asset before soft-deleting the parcel record
        if self._cloudinary and parcel.land_document_asset:
            await self._cloudinary.delete(parcel.land_document_asset)
            parcel.land_document_url = None
            parcel.land_document_asset = None

        parcel.is_active = False
        parcel.updated_at = datetime.now(timezone.utc)
        await parcel.save()
        await self._recalc_acreage(farmer)

    # ── Bank ──────────────────────────────────────────────────────────────────

    async def get_bank(self, farmer_id: str) -> BankResponse:
        farmer = await self._get_farmer(farmer_id)
        return self._build_bank_response(farmer)

    async def update_bank(
        self, farmer_id: str, data: UpdateBankRequest
    ) -> BankResponse:
        farmer = await self._get_farmer(farmer_id)
        added_at = (farmer.bank_details.added_at if farmer.bank_details else None) or datetime.now(
            timezone.utc
        )
        farmer.bank_details = BankDetails(
            bank_name=data.bank_name,
            ifsc_code=data.ifsc_code,
            account_number=data.account_number,
            account_holder_name=data.account_holder_name,
            is_verified=False,
            added_at=added_at,
        )
        farmer.onboarding_completed = self._check_onboarding(farmer)
        farmer.updated_at = datetime.now(timezone.utc)
        await farmer.save()
        return self._build_bank_response(farmer)

    # ── Identity ──────────────────────────────────────────────────────────────

    async def get_identity(self, farmer_id: str) -> IdentityResponse:
        farmer = await self._get_farmer(farmer_id)
        return self._build_identity_response(farmer)

    async def update_identity(
        self, farmer_id: str, data: UpdateIdentityRequest
    ) -> IdentityResponse:
        farmer = await self._get_farmer(farmer_id)

        if farmer.kyc_status == KYCStatus.APPROVED:
            raise KYCAlreadyApprovedException()

        existing = farmer.identity_details or IdentityDetails()
        submitted_at = existing.submitted_at or datetime.now(timezone.utc)
        farmer.identity_details = IdentityDetails(
            aadhaar_number=(
                data.aadhaar_number if data.aadhaar_number is not None else existing.aadhaar_number
            ),
            pan_number=(
                data.pan_number if data.pan_number is not None else existing.pan_number
            ),
            aadhaar_url=existing.aadhaar_url,
            pan_url=existing.pan_url,
            aadhaar_asset=existing.aadhaar_asset,
            pan_asset=existing.pan_asset,
            submitted_at=submitted_at,
        )

        idd = farmer.identity_details
        just_submitted = False
        if farmer.kyc_status == KYCStatus.UNVERIFIED and (
            idd.aadhaar_number or idd.pan_number
        ):
            farmer.kyc_status = KYCStatus.PENDING
            just_submitted = True

        farmer.onboarding_completed = self._check_onboarding(farmer)
        farmer.updated_at = datetime.now(timezone.utc)
        await farmer.save()

        if just_submitted:
            try:
                await self._notifications.create_admin_notification(
                    "Farmer Profile Submitted",
                    f"Farmer {farmer.farmer_id} ({farmer.full_name or 'Unknown'}) submitted profile for verification.",
                    type="profile",
                    actor_type="farmer",
                )
            except Exception:
                logger.exception(f"Failed to create admin notification for profile submission [farmer_id={farmer.id}]")

        return self._build_identity_response(farmer)

    
    async def upload_land_document(self, farmer_id: str, file: UploadFile) -> str:
        logger.info("Land document upload started [farmer_id=%s filename=%s]", farmer_id, file.filename)
        from app.utils.upload import ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, upload_file

        async def _notify_document_uploaded() -> None:
            try:
                farmer = await self._farmers.get_by_id(farmer_id)
                if farmer:
                    await self._notifications.create_admin_notification(
                        "Land Document Uploaded",
                        f"Farmer {farmer.farmer_id} uploaded a land document for verification.",
                        type="land_document",
                        actor_type="farmer",
                    )
            except Exception:
                logger.exception(f"Failed to create admin notification for land document upload [farmer_id={farmer_id}]")

        if self._cloudinary and self._cloudinary.is_enabled:
            folder = f"bhumi/{settings.cloudinary_env}/farmers/{farmer_id}/land"
            try:
                new_asset = await self._cloudinary.upload(
                    file, folder=folder,
                    allowed_types=ALLOWED_DOCUMENT_TYPES, max_bytes=MAX_DOCUMENT_BYTES,
                )
                logger.info("Cloudinary upload success [farmer_id=%s url=%s]", farmer_id, new_asset.secure_url)
                await _notify_document_uploaded()
                return new_asset.secure_url
            except Exception:
                logger.error("Cloudinary upload failed [farmer_id=%s]", farmer_id)
                raise


        # Local fallback
        folder = f"farmers/{farmer_id}/land"
        url = await upload_file(
            file,
            folder=folder,
            allowed_types=ALLOWED_DOCUMENT_TYPES,
            max_bytes=MAX_DOCUMENT_BYTES,
        )
        logger.info("Local upload success [farmer_id=%s url=%s]", farmer_id, url)
        await _notify_document_uploaded()
        return url


    async def upload_identity_document(
        self, farmer_id: str, document_type: str, file: UploadFile
    ) -> str:
        logger.info(
            "Identity document upload started [farmer_id=%s document_type=%s filename=%s]",
            farmer_id, document_type, file.filename,
        )
        from app.core.exceptions import BadRequestException as _BadReq
        valid_types = ("aadhaar", "aadhaar_front", "aadhaar_back", "pan")
        if document_type not in valid_types:
            raise _BadReq("document_type must be 'aadhaar', 'aadhaar_front', 'aadhaar_back', or 'pan'.", "INVALID_DOCUMENT_TYPE")

        farmer = await self._get_farmer(farmer_id)
        if farmer.kyc_status == KYCStatus.APPROVED:
            raise KYCAlreadyApprovedException()

        existing = farmer.identity_details or IdentityDetails()

        def _update_identity(url: str, asset=None):
            idd = farmer.identity_details or IdentityDetails(submitted_at=datetime.now(timezone.utc))
            if document_type in ("aadhaar", "aadhaar_front"):
                idd.aadhaar_url = url
                idd.aadhaar_front_url = url
                if asset: idd.aadhaar_asset = asset
            elif document_type == "aadhaar_back":
                idd.aadhaar_back_url = url
            elif document_type == "pan":
                idd.pan_url = url
                idd.pan_card_url = url
                if asset: idd.pan_asset = asset
            if not idd.submitted_at:
                idd.submitted_at = datetime.now(timezone.utc)
            farmer.identity_details = idd

        if self._cloudinary and self._cloudinary.is_enabled:
            folder = f"bhumi/{settings.cloudinary_env}/farmers/{farmer_id}/identity"
            old_asset = existing.aadhaar_asset if document_type in ("aadhaar", "aadhaar_front") else (existing.pan_asset if document_type == "pan" else None)

            try:
                new_asset = await self._cloudinary.upload(
                    file, folder=folder,
                    allowed_types=ALLOWED_DOCUMENT_TYPES, max_bytes=MAX_DOCUMENT_BYTES,
                )
                logger.info(
                    "Cloudinary upload success [farmer_id=%s document_type=%s url=%s]",
                    farmer_id, document_type, new_asset.secure_url,
                )
            except Exception:
                logger.error(
                    "Cloudinary upload failed [farmer_id=%s document_type=%s]",
                    farmer_id, document_type,
                )
                raise

            try:
                _update_identity(new_asset.secure_url, new_asset)
                farmer.updated_at = datetime.now(timezone.utc)
                await farmer.save()
                logger.info(
                    "MongoDB updated [farmer_id=%s field=%s_url]",
                    farmer_id, document_type,
                )
            except Exception:
                logger.error(
                    "MongoDB update failed [farmer_id=%s document_type=%s] — rolling back Cloudinary asset",
                    farmer_id, document_type,
                )
                await self._cloudinary.delete(new_asset)
                raise

            if old_asset:
                await self._cloudinary.delete(old_asset)
            return new_asset.secure_url

        # Local / S3 fallback
        url = await upload_file(
            file, f"identity/{farmer_id}/{document_type}",
            ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_BYTES,
        )
        _update_identity(url)
        farmer.updated_at = datetime.now(timezone.utc)
        try:
            await farmer.save()
            logger.info(
                "MongoDB updated [farmer_id=%s field=%s_url url=%s]",
                farmer_id, document_type, url,
            )
        except Exception:
            logger.error(
                "MongoDB update failed [farmer_id=%s document_type=%s]",
                farmer_id, document_type,
            )
            raise
        return url

    # ── KYC ──────────────────────────────────────────────────────────────────

    async def get_kyc_status(self, farmer_id: str) -> KYCStatusResponse:
        farmer = await self._get_farmer(farmer_id)
        idd = farmer.identity_details
        bd = farmer.bank_details
        return KYCStatusResponse(
            kyc_status=farmer.kyc_status,
            kyc_remarks=(
                farmer.kyc_remarks if farmer.kyc_status == KYCStatus.REJECTED else None
            ),
            kyc_reviewed_at=farmer.kyc_reviewed_at,
            has_aadhaar=bool(idd and idd.aadhaar_number),
            has_pan=bool(idd and idd.pan_number),
            has_bank_details=bool(bd and bd.account_number),
            onboarding_completed=farmer.onboarding_completed,
        )

    async def delete_account(self, farmer_id: str) -> None:
        farmer = await self._get_farmer(farmer_id)
        farmer_object_id = str(farmer.id)
        farmer_mobile = farmer.mobile

        from beanie import PydanticObjectId
        farmer_pydantic_id = PydanticObjectId(farmer_object_id)

        from app.models.land_parcel import LandParcel
        from app.models.project_enrollment import ProjectEnrollment
        from app.models.notification import Notification
        from app.models.tree_registration import TreeRegistration
        from app.models.green_family import GreenFamilyCover
        from app.models.wallet import Wallet, WalletTransaction, WalletBankAccount, WithdrawalRequest
        from app.models.order import Order
        from app.models.cart import CartItem
        from app.models.wishlist import Wishlist
        from app.models.soil_test import SoilTestBooking
        from app.models.farmer_badge import FarmerBadge
        from app.models.referral import FarmerReferral
        from app.models.support_ticket import SupportTicket
        from app.models.tree_insurance import (
            TreeInsurancePolicy,
            TreeInsuranceClaim,
            PolicyPremium,
            PolicyRenewal,
            ClaimSettlement,
        )
        from app.models.gis_land import GISLandParcel
        from app.models.agri_application import AgriApplication
        from app.models.refresh_token import RefreshTokenSession
        from app.models.sale import CarbonCreditSale
        from app.models.family_member import FamilyMember
        from app.models.activity_log import FarmerActivityLog
        from app.models.otp_session import OTPSession
        from app.models.registration import BhumiCredRegistration
        from app.models.marketplace import (
            MarketplaceSubscription,
            MarketplaceWishlist,
            MarketplaceOrder,
            MarketplaceReview,
            MarketplacePayment,
            MarketplaceShipping,
            MarketplaceReturn,
        )
        from app.models.financial_wallet import (
            Wallet as FinWallet,
            WalletTransaction as FinWalletTransaction,
            WalletWithdrawal as FinWalletWithdrawal,
            FinancialAuditLog,
            EscrowAccount,
        )
        from app.models.mrv_ai import (
            MRVIOTTelemetry,
            MRVLidarScan,
            MRVAuditTrail,
            MRVDroneFlight,
            MRVDroneSurvey,
            MRVSatelliteImage,
            MRVSatelliteMonitoring,
            MRVTreeMonitoring,
            MRVSoilReport,
            MRVAIDetection,
            MRVDuplicateDetection,
            MRVVerificationQueue,
            MRVMediaEvidence,
        )

        try:
            # 1. Fetch land parcel IDs
            land_parcels = await LandParcel.find(
                {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id, farmer_mobile]}}
            ).to_list()
            land_ids = [p.id for p in land_parcels]
            land_pydantic_ids = [PydanticObjectId(str(lid)) for lid in land_ids]
            all_land_identifiers = land_ids + land_pydantic_ids

            # 2. Delete land parcels & GIS
            await LandParcel.find(
                {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id, farmer_mobile]}}
            ).delete()
            await GISLandParcel.find(
                {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id, farmer_mobile]}}
            ).delete()

            # 3. Clean up MRV collections
            if all_land_identifiers:
                await MRVIOTTelemetry.find({"land_id": {"$in": all_land_identifiers}}).delete()
                await MRVLidarScan.find({"land_id": {"$in": all_land_identifiers}}).delete()
                await MRVAuditTrail.find({"land_id": {"$in": all_land_identifiers}}).delete()
                await MRVDroneFlight.find({"land_id": {"$in": all_land_identifiers}}).delete()
                await MRVDroneSurvey.find({"land_id": {"$in": all_land_identifiers}}).delete()
                await MRVSatelliteImage.find({"land_id": {"$in": all_land_identifiers}}).delete()
                await MRVSatelliteMonitoring.find({"land_id": {"$in": all_land_identifiers}}).delete()
                await MRVTreeMonitoring.find({"land_id": {"$in": all_land_identifiers}}).delete()
                await MRVSoilReport.find({"land_id": {"$in": all_land_identifiers}}).delete()
                await MRVAIDetection.find({"land_id": {"$in": all_land_identifiers}}).delete()
                await MRVDuplicateDetection.find({"land_id": {"$in": all_land_identifiers}}).delete()
                await MRVVerificationQueue.find({"land_id": {"$in": all_land_identifiers}}).delete()
            await MRVMediaEvidence.find(
                {"$or": [
                    {"land_id": {"$in": all_land_identifiers}},
                    {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}},
                ]}
            ).delete()

            # 4. Delete unmapped trees collection
            try:
                db = LandParcel.get_motor_collection().database
                await db["trees"].delete_many(
                    {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id, farmer_mobile]}}
                )
            except Exception:
                pass

            # 5. Delete family members & logs & OTPs
            await FamilyMember.find({"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
            await FarmerActivityLog.find({"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
            await OTPSession.find({"mobile": farmer_mobile}).delete()
            await RefreshTokenSession.find({"owner_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
            await BhumiCredRegistration.find(
                {"$or": [
                    {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}},
                    {"mobile_number": farmer_mobile},
                ]}
            ).delete()

            # 6. Delete project enrollments & notifications & trees & green family
            await ProjectEnrollment.find(
                {"$or": [
                    {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}},
                    {"farmer_id": farmer_mobile},
                ]}
            ).delete()
            await Notification.find({"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
            await TreeRegistration.find({"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
            await GreenFamilyCover.find({"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()

            # 7. Delete wallets, financial wallets, escrow
            await Wallet.find({"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
            await WalletTransaction.find({"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
            await WalletBankAccount.find({"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
            await WithdrawalRequest.find({"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
            await EscrowAccount.find({"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
            try:
                db = Farmer.get_motor_collection().database
                await db["financial_wallets"].delete_many({"$or": [{"user_id": {"$in": [farmer_object_id, farmer_pydantic_id, farmer_mobile]}}, {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id, farmer_mobile]}}]})
                await db["financial_wallet_transactions"].delete_many({"$or": [{"user_id": {"$in": [farmer_object_id, farmer_pydantic_id, farmer_mobile]}}, {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id, farmer_mobile]}}]})
            except Exception:
                pass

            # 8. Delete marketplace & schemes & insurance & support
            await Order.find({"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
            await CartItem.find({"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
            await Wishlist.find({"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
            await CarbonCreditSale.find({"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
            await SoilTestBooking.find({"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
            await FarmerBadge.find({"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
            await TreeInsurancePolicy.find({"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
            await TreeInsuranceClaim.find({"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
            await SupportTicket.find({"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
            await AgriApplication.find({"user_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()
        except Exception as e:
            logger.warning(f"Error during dependent collections cleanup on delete_account: {e}")

        # Finally, hard delete the farmer document
        await farmer.delete()

