import logging
from datetime import datetime, timezone
from typing import Optional

from app.models.admin_user import AdminUser
from app.models.farmer import Farmer, KYCStatus, IdentityDetails, IdentityType
from app.models.family_member import FamilyMember
from app.models.land_parcel import LandParcel, LandVerificationStatus
from app.models.farmer_activity import FarmerActivityLog
from app.models.otp_session import OTPSession
from app.models.registration import BhumiCredRegistration
from app.repositories.audit_log import AuditLogRepository
from app.repositories.farmer import FarmerRepository
from app.repositories.family_member import FamilyMemberRepository
from app.repositories.land_parcel import LandParcelRepository
from app.schemas.admin_farmer import (
    AdminFarmerListItem,
    AdminFarmerDetailResponse,
    AdminFarmerLocationTreeResponse,
    AdminBankResponse,
    AdminIdentityResponse,
    UpdateIdentityRequest,
    FarmerAccountStatus,
    UpdateFarmerStatusRequest,
    UpdateFarmerStatusResponse,
    RejectRequest,
    KYCActionResponse,
)
from app.schemas.address import AddressSchema
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.family import FamilyMemberResponse
from app.schemas.land import (
    AdminLandVerificationItem,
    AdminLandVerificationRequest,
    LandParcelResponse,
    LandSummaryResponse,
    LandHistoryEvent,
)
from app.core.exceptions import BadRequestException, FarmerNotFoundException
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


class AdminFarmerService:
    def __init__(
        self,
        farmer_repo: FarmerRepository,
        family_repo: FamilyMemberRepository,
        land_repo: LandParcelRepository,
        audit_repo: AuditLogRepository,
        notification_service: NotificationService,
    ):
        self._farmers = farmer_repo
        self._family = family_repo
        self._land = land_repo
        self._audit = audit_repo
        self._notifications = notification_service

    # ── Private helpers ───────────────────────────────────────────────────────

    async def _get_farmer(self, farmer_id: str) -> Farmer:
        farmer = await self._farmers.get_by_id(farmer_id)
        if not farmer:
            raise FarmerNotFoundException()
        return farmer

    def _to_list_item(self, farmer: Farmer) -> AdminFarmerListItem:
        return AdminFarmerListItem(
            id=str(farmer.id),
            farmer_id=farmer.farmer_id,
            mobile=farmer.mobile,
            full_name=farmer.full_name,
            state=farmer.state,
            district=farmer.district,
            kyc_status=farmer.kyc_status,
            is_active=farmer.is_active,
            onboarding_completed=farmer.onboarding_completed,
            total_acreage=farmer.total_acreage,
            sustainability_score=farmer.sustainability_score,
            created_at=farmer.created_at,
        )

    def _to_detail(self, farmer: Farmer) -> AdminFarmerDetailResponse:
        perm: Optional[AddressSchema] = None
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
        return AdminFarmerDetailResponse(
            id=str(farmer.id),
            farmer_id=farmer.farmer_id,
            mobile=farmer.mobile,
            full_name=farmer.full_name,
            father_name=farmer.father_name,
            dob=farmer.dob,
            email=farmer.email,
            gender=farmer.gender,
            category=farmer.category,
            education=farmer.education,
            occupation=farmer.occupation,
            state=farmer.state,
            district=farmer.district,
            tehsil=farmer.tehsil,
            city=farmer.city,
            village=farmer.village,
            country=farmer.country,
            gram_panchayat=farmer.gram_panchayat,
            vikash_khand=farmer.vikash_khand,
            full_address=farmer.full_address,
            pincode=farmer.pincode,
            permanent_address=perm,
            identity_type=farmer.identity_type,
            kyc_status=farmer.kyc_status,
            kyc_remarks=farmer.kyc_remarks,
            kyc_reviewed_by=farmer.kyc_reviewed_by,
            kyc_reviewed_at=farmer.kyc_reviewed_at,
            farmer_photo_url=farmer.farmer_photo_url,
            id_proof_url=farmer.id_proof_url,
            sustainability_score=farmer.sustainability_score,
            total_acreage=farmer.total_acreage,
            total_trees=farmer.total_trees,
            carbon_credits_generated=farmer.carbon_credits_generated,
            wallet_balance=farmer.wallet_balance,
            locale=farmer.locale,
            is_active=farmer.is_active,
            onboarding_completed=farmer.onboarding_completed,
            created_at=farmer.created_at,
            updated_at=farmer.updated_at,
        )

    @staticmethod
    def _to_family_response(m: FamilyMember) -> FamilyMemberResponse:
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
    def _to_land_response(p: LandParcel) -> LandParcelResponse:
        return LandParcelResponse(
            id=str(p.id),
            survey_number=p.survey_number,
            area_acres=p.area_acres,
            ownership_type=p.ownership_type,
            is_irrigated=p.is_irrigated,
            state=p.state,
            district=p.district,
            tehsil=p.tehsil,
            village=p.village,
            land_document_url=p.land_document_url,
            verification_status=p.verification_status,
            verification_remarks=p.verification_remarks,
            verified_at=p.verified_at,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )

    async def _to_land_verification_item(self, p: LandParcel) -> AdminLandVerificationItem:
        farmer = await self._farmers.get_by_id(p.farmer_id) if p.farmer_id else None
        
        # Build dynamic history timeline
        history_events = []
        
        # 1. Created Event
        history_events.append(
            LandHistoryEvent(
                title="Created",
                desc="Land parcel submitted by farmer via Mobile App",
                date=p.created_at
            )
        )
        
        # 2. Edited Event (if updated_at is later than created_at)
        if p.updated_at > p.created_at and (p.updated_at - p.created_at).total_seconds() > 60:
            history_events.append(
                LandHistoryEvent(
                    title="Edited",
                    desc="GIS coordinates and Khasra document updated",
                    date=p.updated_at
                )
            )
            
        # 3. Approved / Rejected Event
        if p.verification_status == LandVerificationStatus.VERIFIED:
            history_events.append(
                LandHistoryEvent(
                    title="Approved",
                    desc="Admin approved land GIS boundary and title deed",
                    date=p.verified_at or p.updated_at
                )
            )
            
            # Fetch farmer's enrollments to check real status of project assignment and tree registration
            enrollments = []
            if p.farmer_id:
                from app.models.project_enrollment import ProjectEnrollment
                enrollments = await ProjectEnrollment.find({"farmer_id": str(p.farmer_id)}).to_list()
            
            # 4. Project Assigned Event
            assigned_enrollment = next((e for e in enrollments if e.stage_project_assigned), None)
            if assigned_enrollment:
                history_events.append(
                    LandHistoryEvent(
                        title="Project Assigned",
                        desc=f"Assigned to {p.crop_type or 'Agroforestry'} Carbon Project",
                        date=assigned_enrollment.updated_at or p.updated_at
                    )
                )
                
            # 5. Carbon Registered Event
            trees_enrollment = next((e for e in enrollments if e.stage_trees_registered), None)
            if trees_enrollment:
                history_events.append(
                    LandHistoryEvent(
                        title="Carbon Registered",
                        desc=f"{p.tree_stock_count or 0} trees verified for carbon capture benefits",
                        date=trees_enrollment.updated_at or p.updated_at
                    )
                )
        elif p.verification_status == LandVerificationStatus.REJECTED:
            history_events.append(
                LandHistoryEvent(
                    title="Rejected",
                    desc=f"Admin rejected. Reason: {p.verification_remarks or 'No remarks provided'}",
                    date=p.updated_at
                )
            )
            
        return AdminLandVerificationItem(
            id=str(p.id),
            farmer_id=str(p.farmer_id) if p.farmer_id else None,
            farmer_public_id=farmer.farmer_id if farmer else None,
            farmer_name=farmer.full_name if farmer else None,
            farmer_mobile=farmer.mobile if farmer else "",
            survey_number=p.survey_number,
            area_acres=p.area_acres,
            ownership_type=p.ownership_type,
            is_irrigated=p.is_irrigated,
            belongs_to_another_person=p.belongs_to_another_person,
            fathers_name=p.fathers_name or (farmer.father_name if farmer else None),
            country=p.country,
            state=p.state or (farmer.state if farmer else None),
            district=p.district or (farmer.district if farmer else None),
            city=p.city or (farmer.city if farmer else None),
            gram_panchayat=p.gram_panchayat or (farmer.gram_panchayat if farmer else None),
            vikash_khand=p.vikash_khand or (farmer.vikash_khand if farmer else None),
            tehsil=p.tehsil or (farmer.tehsil if farmer else None),
            village=p.village or (farmer.village if farmer else None),
            full_address=p.full_address or (farmer.full_address if farmer else None),
            landmark=p.landmark,
            coordinates=p.coordinates,
            boundary_polygon=p.boundary_polygon,
            crop_type=p.crop_type,
            soil_type=p.soil_type,
            soil_organic_carbon=p.soil_organic_carbon,
            tree_stock_count=p.tree_stock_count,
            plantation_area_acres=p.plantation_area_acres,
            agroforestry_species=p.agroforestry_species,
            land_document_url=p.land_document_url,
            land_photo_urls=getattr(p, "land_photo_urls", []),
            verification_status=p.verification_status,
            verification_remarks=p.verification_remarks,
            verified_at=p.verified_at,
            created_at=p.created_at,
            updated_at=p.updated_at,
            history=history_events,
        )

    # ── Public API ────────────────────────────────────────────────────────────

    async def list_farmers(
        self,
        page: int,
        limit: int,
        kyc_status: Optional[KYCStatus] = None,
        is_active: Optional[bool] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        village: Optional[str] = None,
        search: Optional[str] = None,
    ) -> PaginatedResponse[AdminFarmerListItem]:
        skip = (page - 1) * limit
        farmers, total = await self._farmers.list_paginated(
            skip=skip,
            limit=limit,
            kyc_status=kyc_status,
            is_active=is_active,
            state=state,
            district=district,
            village=village,
            search=search,
        )
        total_pages = max(1, (total + limit - 1) // limit)
        return PaginatedResponse[AdminFarmerListItem](
            data=[self._to_list_item(f) for f in farmers],
            meta=PaginationMeta(
                total=total,
                page=page,
                limit=limit,
                total_pages=total_pages,
            ),
        )

    async def get_location_tree(self) -> AdminFarmerLocationTreeResponse:
        combos = await self._farmers.get_location_combinations()

        states_and_districts: dict[str, set] = {}
        district_blocks: dict[str, set] = {}
        block_villages: dict[str, set] = {}

        for combo in combos:
            state = combo.get("state")
            district = combo.get("district")
            block = combo.get("block")
            village = combo.get("village")
            if not state:
                continue
            states_and_districts.setdefault(state, set())
            if not district:
                continue
            states_and_districts[state].add(district)
            district_blocks.setdefault(district, set())
            if not block:
                continue
            district_blocks[district].add(block)
            block_villages.setdefault(block, set())
            if village:
                block_villages[block].add(village)

        return AdminFarmerLocationTreeResponse(
            states_and_districts={k: sorted(v) for k, v in states_and_districts.items()},
            district_blocks={k: sorted(v) for k, v in district_blocks.items()},
            block_villages={k: sorted(v) for k, v in block_villages.items()},
        )

    async def get_farmer_detail(self, farmer_id: str) -> AdminFarmerDetailResponse:
        farmer = await self._get_farmer(farmer_id)
        return self._to_detail(farmer)

    async def get_farmer_family(self, farmer_id: str) -> list[FamilyMemberResponse]:
        await self._get_farmer(farmer_id)
        members = await self._family.get_active_by_farmer(farmer_id)
        return [self._to_family_response(m) for m in members]

    async def get_farmer_land(self, farmer_id: str) -> LandSummaryResponse:
        await self._get_farmer(farmer_id)
        parcels = await self._land.get_active_by_farmer(farmer_id)
        total = sum(p.area_acres for p in parcels)
        irrigated = sum(p.area_acres for p in parcels if p.is_irrigated)
        return LandSummaryResponse(
            parcels=[self._to_land_response(p) for p in parcels],
            total_area_acres=total,
            irrigated_area_acres=irrigated,
            non_irrigated_area_acres=total - irrigated,
        )

    async def list_land_verification_queue(self) -> list[AdminLandVerificationItem]:
        parcels = await self._land.list_active()
        return [await self._to_land_verification_item(parcel) for parcel in parcels]

    async def verify_land_parcel(
        self, parcel_id: str, data: AdminLandVerificationRequest
    ) -> AdminLandVerificationItem:
        parcel = await self._land.get_by_id(parcel_id)
        if not parcel or not parcel.is_active:
            raise BadRequestException("Land parcel not found.", "LAND_PARCEL_NOT_FOUND")

        parcel.verification_status = data.status
        parcel.verification_remarks = data.remarks
        parcel.verified_at = (
            datetime.now(timezone.utc)
            if data.status == LandVerificationStatus.VERIFIED
            else None
        )
        parcel.updated_at = datetime.now(timezone.utc)
        await parcel.save()

        if data.status == LandVerificationStatus.VERIFIED and parcel.farmer_id:
          farmer = await self._farmers.get_by_id(parcel.farmer_id)
          if farmer:
              farmer.total_acreage = await self._land.get_total_acreage(str(farmer.id))
              farmer.updated_at = datetime.now(timezone.utc)
              await farmer.save()

        if data.status == LandVerificationStatus.VERIFIED and parcel.farmer_id:
            try:
                await self._notifications.create_notification(
                    str(parcel.farmer_id),
                    "Land Verification Approved",
                    "Your land has been successfully verified by the admin.",
                    type="land",
                )
            except Exception:
                logger.exception(f"Failed to create land-verified notification for farmer {parcel.farmer_id}")
        elif data.status == LandVerificationStatus.REJECTED and parcel.farmer_id:
            message = "Your land verification request has been rejected."
            if data.remarks:
                message += f" Reason: {data.remarks}"
            try:
                await self._notifications.create_notification(
                    str(parcel.farmer_id),
                    "Land Verification Rejected",
                    message,
                    type="land",
                )
            except Exception:
                logger.exception(f"Failed to create land-rejected notification for farmer {parcel.farmer_id}")

        return await self._to_land_verification_item(parcel)

    async def get_farmer_bank(self, farmer_id: str) -> AdminBankResponse:
        farmer = await self._get_farmer(farmer_id)
        bd = farmer.bank_details
        if not bd:
            return AdminBankResponse()
        return AdminBankResponse(
            bank_name=bd.bank_name,
            ifsc_code=bd.ifsc_code,
            account_number=bd.account_number,
            account_holder_name=bd.account_holder_name,
            is_verified=bd.is_verified,
            added_at=bd.added_at,
        )

    async def get_farmer_identity(self, farmer_id: str) -> AdminIdentityResponse:
        farmer = await self._get_farmer(farmer_id)
        idd = farmer.identity_details
        
        # Derive Aadhaar number
        aadhaar_num = (idd.aadhaar_number if idd and idd.aadhaar_number else None) or getattr(farmer, "aadhaar_number", None) or (
            farmer.identity_number if getattr(farmer, "identity_type", None) == IdentityType.AADHAAR else None
        )
        
        # Derive PAN number
        pan_num = (idd.pan_number if idd and idd.pan_number else None) or getattr(farmer, "pan_number", None) or (
            farmer.identity_number if getattr(farmer, "identity_type", None) == IdentityType.PAN else None
        )
        
        # Derive Aadhaar URL
        aadhaar_url = (idd.aadhaar_url if idd and idd.aadhaar_url else None) or farmer.id_proof_url
        
        # Derive PAN URL
        pan_url = (idd.pan_url if idd and idd.pan_url else None) or getattr(farmer, "pan_url", None)
        
        return AdminIdentityResponse(
            aadhaar_number=aadhaar_num,
            pan_number=pan_num,
            aadhaar_url=aadhaar_url,
            pan_url=pan_url,
            submitted_at=idd.submitted_at if idd else None,
        )

    async def update_farmer_identity(
        self, farmer_id: str, data: UpdateIdentityRequest
    ) -> AdminIdentityResponse:
        farmer = await self._get_farmer(farmer_id)
        if not farmer.identity_details:
            farmer.identity_details = IdentityDetails()

        if data.aadhaar_number is not None:
            farmer.identity_details.aadhaar_number = data.aadhaar_number
        if data.pan_number is not None:
            farmer.identity_details.pan_number = data.pan_number
        if data.aadhaar_url is not None:
            farmer.identity_details.aadhaar_url = data.aadhaar_url
            farmer.id_proof_url = data.aadhaar_url
        if data.pan_url is not None:
            farmer.identity_details.pan_url = data.pan_url

        farmer.identity_details.submitted_at = datetime.now(timezone.utc)
        farmer.updated_at = datetime.now(timezone.utc)
        await farmer.save()

        return await self.get_farmer_identity(farmer_id)

    async def update_farmer_status(
        self,
        farmer_id: str,
        data: UpdateFarmerStatusRequest,
    ) -> UpdateFarmerStatusResponse:
        farmer = await self._get_farmer(farmer_id)

        if data.status == FarmerAccountStatus.ACTIVE:
            if farmer.is_active and farmer.kyc_status != KYCStatus.BLOCKED:
                raise BadRequestException(
                    "Farmer account is already active.", "FARMER_ALREADY_ACTIVE"
                )
            farmer.is_active = True
            if farmer.kyc_status == KYCStatus.BLOCKED:
                farmer.kyc_status = KYCStatus.UNVERIFIED
            message = "Farmer account activated successfully."

        elif data.status == FarmerAccountStatus.INACTIVE:
            if farmer.kyc_status == KYCStatus.BLOCKED:
                raise BadRequestException(
                    "Cannot deactivate a blocked farmer. Set status to active first.",
                    "FARMER_BLOCKED",
                )
            if not farmer.is_active:
                raise BadRequestException(
                    "Farmer account is already inactive.", "FARMER_ALREADY_INACTIVE"
                )
            farmer.is_active = False
            message = "Farmer account deactivated successfully."

        else:  # BLOCKED
            if not farmer.is_active and farmer.kyc_status == KYCStatus.BLOCKED:
                raise BadRequestException(
                    "Farmer account is already blocked.", "FARMER_ALREADY_BLOCKED"
                )
            farmer.is_active = False
            farmer.kyc_status = KYCStatus.BLOCKED
            message = "Farmer account blocked successfully."

        farmer.updated_at = datetime.now(timezone.utc)
        await farmer.save()

        return UpdateFarmerStatusResponse(
            id=str(farmer.id),
            is_active=farmer.is_active,
            kyc_status=farmer.kyc_status,
            message=message,
        )

    async def approve_farmer(
        self, farmer_id: str, admin: AdminUser, ip_address: str = ""
    ) -> KYCActionResponse:
        farmer = await self._get_farmer(farmer_id)
        now = datetime.now(timezone.utc)
        farmer.kyc_status = KYCStatus.APPROVED
        farmer.is_active = True
        farmer.kyc_reviewed_by = admin.email
        farmer.kyc_reviewed_at = now
        farmer.updated_at = now
        await farmer.save()
        await self._audit.log_event(
            action="KYC_APPROVED",
            entity_type="Farmer",
            entity_id=str(farmer.id),
            admin_id=str(admin.id),
            admin_name=admin.name,
            actor_type="admin",
            actor_role=admin.role.value if hasattr(admin.role, "value") else str(admin.role),
            ip_address=ip_address,
        )
        try:
            await self._notifications.create_notification(
                str(farmer.id),
                "Profile Verified",
                "Your profile has been successfully verified by the Admin.",
                type="kyc",
            )
        except Exception:
            logger.exception(f"Failed to create profile-verified notification for farmer {farmer.id}")
        return KYCActionResponse(
            id=str(farmer.id),
            kyc_status=farmer.kyc_status,
            is_active=farmer.is_active,
            kyc_reviewed_by=farmer.kyc_reviewed_by,
            kyc_reviewed_at=farmer.kyc_reviewed_at,
            message="Farmer KYC approved successfully.",
        )

    async def reject_farmer(
        self, farmer_id: str, admin: AdminUser, kyc_remarks: Optional[str], ip_address: str = ""
    ) -> KYCActionResponse:
        farmer = await self._get_farmer(farmer_id)
        now = datetime.now(timezone.utc)
        farmer.kyc_status = KYCStatus.REJECTED
        farmer.kyc_remarks = kyc_remarks
        farmer.kyc_reviewed_by = admin.email
        farmer.kyc_reviewed_at = now
        farmer.updated_at = now
        await farmer.save()
        await self._audit.log_event(
            action="KYC_REJECTED",
            entity_type="Farmer",
            entity_id=str(farmer.id),
            admin_id=str(admin.id),
            admin_name=admin.name,
            actor_type="admin",
            actor_role=admin.role.value if hasattr(admin.role, "value") else str(admin.role),
            ip_address=ip_address,
            remarks=kyc_remarks or "",
        )
        try:
            await self._notifications.create_notification(
                str(farmer.id),
                "Profile Rejected",
                "Your profile verification has been rejected. Please review and update your information.",
                type="kyc",
            )
        except Exception:
            logger.exception(f"Failed to create profile-rejected notification for farmer {farmer.id}")
        return KYCActionResponse(
            id=str(farmer.id),
            kyc_status=farmer.kyc_status,
            is_active=farmer.is_active,
            kyc_remarks=farmer.kyc_remarks,
            kyc_reviewed_by=farmer.kyc_reviewed_by,
            kyc_reviewed_at=farmer.kyc_reviewed_at,
            message="Farmer KYC rejected.",
        )

    async def block_farmer_account(
        self, farmer_id: str, admin: AdminUser, ip_address: str = ""
    ) -> KYCActionResponse:
        farmer = await self._get_farmer(farmer_id)
        farmer.is_active = False
        farmer.updated_at = datetime.now(timezone.utc)
        await farmer.save()
        await self._audit.log_event(
            action="FARMER_BLOCKED",
            entity_type="Farmer",
            entity_id=str(farmer.id),
            admin_id=str(admin.id),
            admin_name=admin.name,
            actor_type="admin",
            actor_role=admin.role.value if hasattr(admin.role, "value") else str(admin.role),
            ip_address=ip_address,
        )
        return KYCActionResponse(
            id=str(farmer.id),
            kyc_status=farmer.kyc_status,
            is_active=farmer.is_active,
            message="Farmer account blocked successfully.",
        )

    async def unblock_farmer_account(
        self, farmer_id: str, admin: AdminUser, ip_address: str = ""
    ) -> KYCActionResponse:
        farmer = await self._get_farmer(farmer_id)
        farmer.is_active = True
        farmer.updated_at = datetime.now(timezone.utc)
        await farmer.save()
        await self._audit.log_event(
            action="FARMER_UNBLOCKED",
            entity_type="Farmer",
            entity_id=str(farmer.id),
            admin_id=str(admin.id),
            admin_name=admin.name,
            actor_type="admin",
            actor_role=admin.role.value if hasattr(admin.role, "value") else str(admin.role),
            ip_address=ip_address,
        )
        return KYCActionResponse(
            id=str(farmer.id),
            kyc_status=farmer.kyc_status,
            is_active=farmer.is_active,
            message="Farmer account unblocked successfully.",
        )

    async def assign_project_to_farmer(
        self, farmer_id: str, project_id: str
    ) -> dict:
        farmer = await self._get_farmer(farmer_id)
        # Store or record project assignment
        return {
            "farmer_id": str(farmer.id),
            "project_id": project_id,
            "assigned_at": datetime.now(timezone.utc).isoformat(),
            "status": "assigned"
        }

    async def delete_farmer(
        self, farmer_id: str, admin: AdminUser, ip_address: str = ""
    ) -> dict:
        """
        Permanently delete a farmer and all associated records.
        After deletion the mobile number is freed — the farmer can re-register
        fresh from the app with any new details.

        Collections cleaned up:
            - farmers (the main record)
            - land_parcels
            - family_members
            - farmer_activity_logs
            - otp_sessions (keyed by mobile)
            - registrations (bhumi_cred_registrations)
        """
        farmer = await self._get_farmer(farmer_id)
        farmer_object_id = str(farmer.id)
        farmer_mobile = farmer.mobile
        farmer_display = farmer.full_name or farmer_mobile

        from beanie import PydanticObjectId
        farmer_pydantic_id = PydanticObjectId(farmer_object_id)

        # 1. Delete land parcels (matches either string or PydanticObjectId)
        land_deleted = await LandParcel.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()

        # 2. Delete family members
        family_deleted = await FamilyMember.find(
            {"farmer_id": farmer_object_id}
        ).delete()

        # 3. Delete activity logs
        activity_deleted = await FarmerActivityLog.find(
            {"farmer_id": farmer_object_id}
        ).delete()

        # 4. Delete OTP sessions tied to this mobile
        otp_deleted = await OTPSession.find(
            {"mobile": farmer_mobile, "role": "farmer"}
        ).delete()

        # 5. Delete registration records
        reg_deleted = await BhumiCredRegistration.find(
            {"$or": [
                {"farmer_id": farmer_object_id},
                {"mobile_number": farmer_mobile},
            ]}
        ).delete()

        # 6. Hard delete the farmer document last
        await farmer.delete()

        # Log the deletion in audit trail
        role_str = admin.role.value if hasattr(admin.role, "value") else str(admin.role)
        await self._audit.log_event(
            action="FARMER_DELETED",
            entity_type="Farmer",
            entity_id=farmer_object_id,
            admin_id=str(admin.id),
            admin_name=admin.name,
            actor_type="admin",
            actor_role=role_str,
            ip_address=ip_address,
            remarks=f"Hard delete by admin. Mobile {farmer_mobile} is now free for re-registration.",
        )

        logger.warning(
            f"FARMER HARD DELETED: {farmer_display} ({farmer_mobile}) | "
            f"Deleted by admin {admin.email} | "
            f"land={getattr(land_deleted, 'deleted_count', 0)} "
            f"family={getattr(family_deleted, 'deleted_count', 0)} "
            f"activity={getattr(activity_deleted, 'deleted_count', 0)} "
            f"otp={getattr(otp_deleted, 'deleted_count', 0)} "
            f"reg={getattr(reg_deleted, 'deleted_count', 0)}"
        )

        return {
            "deleted_farmer_id": farmer_object_id,
            "deleted_mobile": farmer_mobile,
            "message": f"Farmer '{farmer_display}' and all associated records permanently deleted. Mobile number {farmer_mobile} is now free for re-registration.",
            "deleted_counts": {
                "land_parcels": getattr(land_deleted, 'deleted_count', 0),
                "family_members": getattr(family_deleted, 'deleted_count', 0),
                "activity_logs": getattr(activity_deleted, 'deleted_count', 0),
                "otp_sessions": getattr(otp_deleted, 'deleted_count', 0),
                "registrations": getattr(reg_deleted, 'deleted_count', 0),
            }
        }
