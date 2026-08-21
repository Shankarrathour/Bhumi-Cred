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
        from bson import ObjectId
        farmer = None
        if ObjectId.is_valid(farmer_id):
            farmer = await self._farmers.get_by_id(farmer_id)
        if not farmer:
            farmer = await Farmer.find_one(Farmer.farmer_id == farmer_id)
        if not farmer:
            farmer = await Farmer.find_one(Farmer.mobile == farmer_id)
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
        coords_str = None
        if p.coordinates:
            coords_str = f"{p.coordinates.latitude:.4f}, {p.coordinates.longitude:.4f}"

        return LandParcelResponse(
            id=str(p.id),
            name=p.name,
            khasra_number=p.khasra_number or p.survey_number,
            survey_number=p.survey_number or p.khasra_number,
            area_acres=p.area_acres,
            area_unit=p.area_unit or "Acre",
            ownership_type=p.ownership_type,
            plantation_date=p.plantation_date,
            is_irrigated=p.is_irrigated,
            belongs_to_another_person=p.belongs_to_another_person,
            fathers_name=p.fathers_name,
            country=p.country or "India",
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
            land_type=p.land_type,
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

    async def _to_land_verification_item(self, p: LandParcel) -> AdminLandVerificationItem:
        farmer = await self._farmers.get_by_id(p.farmer_id)
        
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
        # Fetch farmer's enrollments to check real project assignment and tree registration
        assigned_project_name = None
        assigned_project_id_val = None
        try:
            from app.models.project_enrollment import ProjectEnrollment
            from app.models.project import SustainabilityProject
            enrollments = await ProjectEnrollment.find({"farmer_id": str(p.farmer_id)}).to_list()
            assigned_enrollment = next((e for e in enrollments if e.stage_project_assigned), None)
            if not assigned_enrollment and enrollments:
                assigned_enrollment = enrollments[0]
            if assigned_enrollment and assigned_enrollment.project_id:
                assigned_project_id_val = assigned_enrollment.project_id
                proj = await SustainabilityProject.find_one({"$or": [{"project_id": assigned_enrollment.project_id}, {"id": assigned_enrollment.project_id}]})
                if proj and proj.title:
                    assigned_project_name = proj.title
                else:
                    assigned_project_name = f"Project {assigned_enrollment.project_id.replace('-', ' ').title()}"
        except Exception:
            enrollments = []

        if p.verification_status in (LandVerificationStatus.VERIFIED, LandVerificationStatus.APPROVED):
            history_events.append(
                LandHistoryEvent(
                    title="Approved",
                    desc="Admin approved land GIS boundary and title deed",
                    date=p.verified_at or p.updated_at
                )
            )
            
            # 4. Project Assigned Event
            assigned_enrollment = next((e for e in enrollments if e.stage_project_assigned), None)
            if assigned_enrollment:
                history_events.append(
                    LandHistoryEvent(
                        title="Project Assigned",
                        desc=f"Assigned to {assigned_project_name or 'Carbon Project'}",
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
            farmer_id=str(p.farmer_id),
            farmer_public_id=farmer.farmer_id if farmer else None,
            farmer_name=farmer.full_name if farmer else None,
            farmer_mobile=farmer.mobile if farmer else "",
            khasra_number=p.khasra_number or p.survey_number,
            survey_number=p.survey_number or p.khasra_number,
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
            trees=getattr(p, "trees", []),
            land_document_url=p.land_document_url,
            land_photo_urls=getattr(p, "land_photo_urls", []),
            verification_status=p.verification_status,
            verification_remarks=p.verification_remarks,
            correction_fields=getattr(p, "correction_fields", None),
            verified_at=p.verified_at,
            created_at=p.created_at,
            updated_at=p.updated_at,
            assigned_project=assigned_project_name,
            assigned_project_id=assigned_project_id_val,
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
            total_parcels=len(parcels),
        )

    async def list_land_verification_queue(self) -> list[AdminLandVerificationItem]:
        active_farmers = await Farmer.find(Farmer.is_active == True).to_list()
        valid_farmer_ids = set()
        for f in active_farmers:
            valid_farmer_ids.add(str(f.id))
            if f.farmer_id:
                valid_farmer_ids.add(f.farmer_id)
            if f.mobile:
                valid_farmer_ids.add(f.mobile)

        parcels = await LandParcel.find(
            {"is_active": True, "farmer_id": {"$in": list(valid_farmer_ids)}}
        ).sort("-created_at").to_list()

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
            if data.status in (LandVerificationStatus.VERIFIED, LandVerificationStatus.APPROVED)
            else None
        )
        parcel.updated_at = datetime.now(timezone.utc)
        await parcel.save()

        if data.status in (LandVerificationStatus.VERIFIED, LandVerificationStatus.APPROVED):
            farmer = await self._farmers.get_by_id(parcel.farmer_id)
            if farmer:
                farmer.total_acreage = await self._land.get_total_acreage(str(farmer.id))
                farmer.updated_at = datetime.now(timezone.utc)
                await farmer.save()

            try:
                await self._notifications.create_notification(
                    str(parcel.farmer_id),
                    "Land Verification Approved",
                    "Your land has been successfully verified by the admin.",
                    type="land",
                )
            except Exception:
                logger.exception(f"Failed to create land-verified notification for farmer {parcel.farmer_id}")
        elif data.status == LandVerificationStatus.REJECTED:
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
        
        bank_name = None
        account_number = None
        ifsc_code = None
        account_holder_name = None
        is_verified = False
        added_at = None
        upi_id = None

        # 1. Fetch UPI ID from Wallet collection (saved via BhumiAPP)
        try:
            from app.models.wallet import Wallet
            wallet = await Wallet.find_one(Wallet.farmer_id == str(farmer.id))
            if wallet:
                upi_id = wallet.upi_id
        except Exception as err:
            logger.warning(f"Error checking Wallet for farmer {farmer_id}: {err}")

        # 2. Check WalletBankAccount collection in MongoDB (saved via BhumiAPP)
        try:
            from app.models.wallet import WalletBankAccount
            acc = await WalletBankAccount.find_one(
                WalletBankAccount.farmer_id == str(farmer.id),
                WalletBankAccount.is_active == True,
                WalletBankAccount.is_primary == True
            )
            if not acc:
                # Fallback to any active account
                acc = await WalletBankAccount.find_one(
                    WalletBankAccount.farmer_id == str(farmer.id),
                    WalletBankAccount.is_active == True
                )
            if acc:
                bank_name = acc.bank_name
                account_number = acc.account_number_masked
                ifsc_code = acc.ifsc_code
                account_holder_name = acc.account_holder_name
                is_verified = True
                added_at = acc.created_at
        except Exception as err:
            logger.warning(f"Error checking WalletBankAccount for farmer {farmer_id}: {err}")

        # 3. Check embedded bank_details on Farmer document if not found in WalletBankAccount
        if not bank_name:
            bd = farmer.bank_details
            if bd and (bd.bank_name or bd.account_number):
                bank_name = bd.bank_name
                account_number = bd.account_number
                ifsc_code = bd.ifsc_code
                account_holder_name = bd.account_holder_name
                is_verified = bd.is_verified
                added_at = bd.added_at

        # 4. Fetch all transactions (WalletTransaction + WithdrawalRequest) for this farmer
        transactions = []
        try:
            from app.models.wallet import WalletTransaction, WithdrawalRequest
            farmer_ids = [str(farmer.id), farmer.farmer_id, farmer.mobile]
            farmer_ids = [fid for fid in farmer_ids if fid]

            tx_list = await WalletTransaction.find({"farmer_id": {"$in": farmer_ids}}).sort("-created_at").to_list()
            for tx in tx_list:
                transactions.append({
                    "id": str(tx.id),
                    "amount": tx.amount,
                    "type": str(tx.type).upper(),
                    "status": str(tx.status).lower(),
                    "description": tx.description,
                    "category": getattr(tx, "category", None) or ("UPI DEBIT" if str(tx.type).lower() == "debit" else "CREDIT"),
                    "payment_method": getattr(tx, "payment_method", "UPI"),
                    "bank_name": getattr(tx, "bank_name", None) or (bank_name or "UPI Transfer"),
                    "upi_id": getattr(tx, "upi_id", None) or upi_id,
                    "payout_reference": tx.reference_id or getattr(tx, "utr", None) or f"TXN-{str(tx.id)[-6:].upper()}",
                    "utr": getattr(tx, "utr", None) or tx.reference_id,
                    "created_at": tx.created_at.isoformat() if tx.created_at else None,
                })

            withdrawals = await WithdrawalRequest.find({"farmer_id": {"$in": farmer_ids}}).sort("-created_at").to_list()
            for w in withdrawals:
                if not any(t["id"] == str(w.id) or t.get("payout_reference") == w.payout_reference for t in transactions):
                    transactions.append({
                        "id": str(w.id),
                        "amount": w.amount,
                        "type": "DEBIT",
                        "status": str(w.status).lower(),
                        "description": f"Withdrawal Payout ({w.payment_method})",
                        "category": "Withdrawal Payout",
                        "payment_method": w.payment_method,
                        "bank_name": w.bank_name or "Bank Account",
                        "upi_id": w.upi_id or upi_id,
                        "account_number_masked": w.account_number_masked,
                        "payout_reference": w.payout_reference or f"WTH-{str(w.id)[-6:].upper()}",
                        "created_at": w.created_at.isoformat() if w.created_at else None,
                    })

            transactions.sort(key=lambda x: x.get("created_at") or "", reverse=True)
        except Exception as tx_err:
            logger.warning(f"Error fetching transactions for farmer {farmer_id}: {tx_err}")

        return AdminBankResponse(
            bank_name=bank_name,
            account_number=account_number,
            ifsc_code=ifsc_code,
            account_holder_name=account_holder_name,
            upi_id=upi_id,
            is_verified=is_verified,
            added_at=added_at,
            transactions=transactions,
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
            await FarmerActivityLog(
                farmer_id=str(farmer.id),
                activity_type="APPROVED",
                title="Profile Verified by Admin ✅",
                description=f"KYC approved by admin {admin.name or admin.email}.",
                performed_by_id=str(admin.id),
                performed_by_role="admin",
                timestamp=now,
            ).insert()
        except Exception as e:
            logger.warning(f"Failed to log FarmerActivityLog for approve: {e}")

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
            await FarmerActivityLog(
                farmer_id=str(farmer.id),
                activity_type="REJECTED",
                title="KYC Rejected by Admin ❌",
                description=f"Reason: {kyc_remarks or 'Documents unreadable or incomplete'}",
                performed_by_id=str(admin.id),
                performed_by_role="admin",
                timestamp=now,
            ).insert()
        except Exception as e:
            logger.warning(f"Failed to log FarmerActivityLog for reject: {e}")

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
        now = datetime.now(timezone.utc)
        farmer.is_active = False
        farmer.updated_at = now
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
        try:
            await FarmerActivityLog(
                farmer_id=str(farmer.id),
                activity_type="ACCOUNT_SUSPENDED",
                title="Account Suspended by Admin 🛑",
                description=f"Farmer account blocked by admin {admin.name or admin.email}.",
                performed_by_id=str(admin.id),
                performed_by_role="admin",
                timestamp=now,
            ).insert()
        except Exception as e:
            logger.warning(f"Failed to log FarmerActivityLog for block: {e}")

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
        now = datetime.now(timezone.utc)
        farmer.is_active = True
        farmer.updated_at = now
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
        try:
            await FarmerActivityLog(
                farmer_id=str(farmer.id),
                activity_type="ACCOUNT_ACTIVATED",
                title="Account Reactivated by Admin ✅",
                description=f"Farmer account unblocked by admin {admin.name or admin.email}.",
                performed_by_id=str(admin.id),
                performed_by_role="admin",
                timestamp=now,
            ).insert()
        except Exception as e:
            logger.warning(f"Failed to log FarmerActivityLog for unblock: {e}")

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
        now = datetime.now(timezone.utc)
        try:
            await FarmerActivityLog(
                farmer_id=str(farmer.id),
                activity_type="PROJECT_ASSIGNED",
                title="Carbon Project Assigned 🌳",
                description=f"Assigned to Carbon Credit Project ID {project_id}.",
                timestamp=now,
            ).insert()
        except Exception as e:
            logger.warning(f"Failed to log FarmerActivityLog for project assignment: {e}")

        return {
            "farmer_id": str(farmer.id),
            "project_id": project_id,
            "assigned_at": now.isoformat(),
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

        # 1. Fetch land parcel IDs before deleting them
        land_parcels = await LandParcel.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).to_list()
        land_ids = [p.id for p in land_parcels]
        land_pydantic_ids = [PydanticObjectId(str(lid)) for lid in land_ids]
        all_land_identifiers = land_ids + land_pydantic_ids

        # 2. Delete land parcels (matches either string or PydanticObjectId)
        land_deleted = await LandParcel.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()

        # 3. Delete GIS land parcels
        gis_land_deleted = await GISLandParcel.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()

        # 4. Clean up MRV collections
        mrv_telemetry_deleted = await MRVIOTTelemetry.find({"land_id": {"$in": all_land_identifiers}}).delete()
        mrv_lidar_deleted = await MRVLidarScan.find({"land_id": {"$in": all_land_identifiers}}).delete()
        mrv_audit_deleted = await MRVAuditTrail.find({"land_id": {"$in": all_land_identifiers}}).delete()
        mrv_flight_deleted = await MRVDroneFlight.find({"land_id": {"$in": all_land_identifiers}}).delete()
        mrv_survey_deleted = await MRVDroneSurvey.find({"land_id": {"$in": all_land_identifiers}}).delete()
        mrv_sat_image_deleted = await MRVSatelliteImage.find({"land_id": {"$in": all_land_identifiers}}).delete()
        mrv_sat_mon_deleted = await MRVSatelliteMonitoring.find({"land_id": {"$in": all_land_identifiers}}).delete()
        mrv_tree_mon_deleted = await MRVTreeMonitoring.find({"land_id": {"$in": all_land_identifiers}}).delete()
        mrv_soil_rep_deleted = await MRVSoilReport.find({"land_id": {"$in": all_land_identifiers}}).delete()
        mrv_ai_det_deleted = await MRVAIDetection.find({"land_id": {"$in": all_land_identifiers}}).delete()
        mrv_dup_det_deleted = await MRVDuplicateDetection.find({"land_id": {"$in": all_land_identifiers}}).delete()
        mrv_queue_deleted = await MRVVerificationQueue.find({"land_id": {"$in": all_land_identifiers}}).delete()
        mrv_media_deleted = await MRVMediaEvidence.find(
            {"$or": [
                {"land_id": {"$in": all_land_identifiers}},
                {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}},
            ]}
        ).delete()

        # 5. Delete unmapped trees collection
        try:
            db = LandParcel.get_motor_collection().database
            trees_del_res = await db["trees"].delete_many(
                {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id, farmer_mobile]}}
            )
            trees_deleted_count = trees_del_res.deleted_count
        except Exception as te:
            logger.warning(f"Failed to delete from trees collection: {te}")
            trees_deleted_count = 0

        # 6. Delete family members
        family_deleted = await FamilyMember.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()

        # 7. Delete activity logs
        activity_deleted = await FarmerActivityLog.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()

        # 8. Delete OTP sessions tied to this mobile
        otp_deleted = await OTPSession.find(
            {"mobile": farmer_mobile, "role": "farmer"}
        ).delete()

        # 9. Delete active JWT refresh token sessions
        token_deleted = await RefreshTokenSession.find(
            {"owner_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()

        # 10. Delete registration records
        reg_deleted = await BhumiCredRegistration.find(
            {"$or": [
                {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}},
                {"mobile_number": farmer_mobile},
            ]}
        ).delete()

        # 11. Delete project enrollments
        proj_deleted = await ProjectEnrollment.find(
            {"$or": [
                {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}},
                {"farmer_id": farmer_mobile},
            ]}
        ).delete()

        # 12. Delete notifications
        notif_deleted = await Notification.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()

        # 13. Delete tree registrations
        tree_deleted = await TreeRegistration.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()

        # 14. Delete green family covers
        gf_deleted = await GreenFamilyCover.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()

        # 15. Delete wallet, transactions, bank accounts, withdrawal requests, and escrow
        wallet_deleted = await Wallet.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()
        tx_deleted = await WalletTransaction.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()
        bank_acc_deleted = await WalletBankAccount.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()
        withdraw_deleted = await WithdrawalRequest.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()
        escrow_deleted = await EscrowAccount.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()

        # 15b. Delete financial wallet collections (financial_wallets, financial_wallet_transactions, financial_wallet_withdrawals, financial_audit_logs)
        try:
            db = Farmer.get_motor_collection().database
            await db["financial_wallets"].delete_many({"$or": [{"user_id": {"$in": [farmer_object_id, farmer_pydantic_id, farmer_mobile]}}, {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id, farmer_mobile]}}]})
            await db["financial_wallet_transactions"].delete_many({"$or": [{"user_id": {"$in": [farmer_object_id, farmer_pydantic_id, farmer_mobile]}}, {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id, farmer_mobile]}}]})
            await db["financial_wallet_withdrawals"].delete_many({"$or": [{"user_id": {"$in": [farmer_object_id, farmer_pydantic_id, farmer_mobile]}}, {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id, farmer_mobile]}}]})
            await db["financial_audit_logs"].delete_many({"$or": [{"actor_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}, {"user_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}]})
        except Exception as fe:
            logger.warning(f"Error purging financial wallet raw collections: {fe}")

        # 16. Delete marketplace orders, cart items, wishlists, reviews, payments, shippings, returns, and subscriptions
        order_deleted = await Order.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()
        cart_deleted = await CartItem.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()
        wishlist_deleted = await Wishlist.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()
        carbon_sale_deleted = await CarbonCreditSale.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()
        market_sub_deleted = await MarketplaceSubscription.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()
        market_wish_deleted = await MarketplaceWishlist.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()
        market_ord_deleted = await MarketplaceOrder.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()
        market_rev_deleted = await MarketplaceReview.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()
        market_pay_deleted = await MarketplacePayment.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()
        market_ship_deleted = await MarketplaceShipping.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()
        market_ret_deleted = await MarketplaceReturn.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()

        # 17. Delete soil testing bookings
        soil_deleted = await SoilTestBooking.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()

        # 18. Delete gamification badges & referrals
        badge_deleted = await FarmerBadge.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()
        referral_deleted = await FarmerReferral.find(
            {"$or": [
                {"referrer_farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}},
                {"referred_farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}},
                {"referred_farmer_phone": farmer_mobile},
            ]}
        ).delete()

        # 19. Delete support tickets
        support_deleted = await SupportTicket.find(
            {"$or": [
                {"vendor_id": {"$in": [farmer_object_id, farmer_pydantic_id]}},
                {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}},
            ]}
        ).delete()

        # 20. Delete tree insurance policies, claims, premiums, renewals & settlements
        policy_deleted = await TreeInsurancePolicy.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()
        claim_deleted = await TreeInsuranceClaim.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()
        premium_deleted = await PolicyPremium.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()
        renewal_deleted = await PolicyRenewal.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()
        settlement_deleted = await ClaimSettlement.find(
            {"farmer_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}
        ).delete()

        # 21. Delete government scheme applications, documents, and timelines
        agri_apps = await AgriApplication.find({"user_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).to_list()
        app_ids = [str(a.id) for a in agri_apps] + [PydanticObjectId(str(a.id)) for a in agri_apps if PydanticObjectId.is_valid(str(a.id))]
        if app_ids:
            from app.models.agri_application_document import AgriApplicationDocument
            from app.models.agri_application_timeline import AgriApplicationTimeline
            await AgriApplicationDocument.find({"application_id": {"$in": app_ids}}).delete()
            await AgriApplicationTimeline.find({"application_id": {"$in": app_ids}}).delete()
        agri_app_deleted = await AgriApplication.find({"user_id": {"$in": [farmer_object_id, farmer_pydantic_id]}}).delete()

        # 22. Hard delete the farmer document last
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
            f"gis_land={getattr(gis_land_deleted, 'deleted_count', 0)} "
            f"family={getattr(family_deleted, 'deleted_count', 0)} "
            f"activity={getattr(activity_deleted, 'deleted_count', 0)} "
            f"otp={getattr(otp_deleted, 'deleted_count', 0)} "
            f"sessions={getattr(token_deleted, 'deleted_count', 0)} "
            f"reg={getattr(reg_deleted, 'deleted_count', 0)} "
            f"projects={getattr(proj_deleted, 'deleted_count', 0)} "
            f"notifications={getattr(notif_deleted, 'deleted_count', 0)} "
            f"tree_regs={getattr(tree_deleted, 'deleted_count', 0)} "
            f"green_families={getattr(gf_deleted, 'deleted_count', 0)} "
            f"wallet={getattr(wallet_deleted, 'deleted_count', 0)} "
            f"transactions={getattr(tx_deleted, 'deleted_count', 0)} "
            f"bank_accounts={getattr(bank_acc_deleted, 'deleted_count', 0)} "
            f"withdrawals={getattr(withdraw_deleted, 'deleted_count', 0)} "
            f"financial_wallets={getattr(fin_wallet_deleted, 'deleted_count', 0)} "
            f"financial_transactions={getattr(fin_tx_deleted, 'deleted_count', 0)} "
            f"financial_withdrawals={getattr(fin_wth_deleted, 'deleted_count', 0)} "
            f"orders={getattr(order_deleted, 'deleted_count', 0)} "
            f"cart={getattr(cart_deleted, 'deleted_count', 0)} "
            f"wishlist={getattr(wishlist_deleted, 'deleted_count', 0)} "
            f"soil_tests={getattr(soil_deleted, 'deleted_count', 0)} "
            f"badges={getattr(badge_deleted, 'deleted_count', 0)} "
            f"referrals={getattr(referral_deleted, 'deleted_count', 0)} "
            f"support={getattr(support_deleted, 'deleted_count', 0)} "
            f"insurance_policies={getattr(policy_deleted, 'deleted_count', 0)} "
            f"insurance_claims={getattr(claim_deleted, 'deleted_count', 0)} "
            f"agri_apps={getattr(agri_app_deleted, 'deleted_count', 0)}"
        )

        return {
            "deleted_farmer_id": farmer_object_id,
            "deleted_mobile": farmer_mobile,
            "message": f"Farmer '{farmer_display}' and all associated records permanently deleted. Mobile number {farmer_mobile} is now free for re-registration.",
            "deleted_counts": {
                "land_parcels": getattr(land_deleted, 'deleted_count', 0),
                "gis_land_parcels": getattr(gis_land_deleted, 'deleted_count', 0),
                "family_members": getattr(family_deleted, 'deleted_count', 0),
                "activity_logs": getattr(activity_deleted, 'deleted_count', 0),
                "otp_sessions": getattr(otp_deleted, 'deleted_count', 0),
                "refresh_token_sessions": getattr(token_deleted, 'deleted_count', 0),
                "registrations": getattr(reg_deleted, 'deleted_count', 0),
                "project_enrollments": getattr(proj_deleted, 'deleted_count', 0),
                "notifications": getattr(notif_deleted, 'deleted_count', 0),
                "tree_registrations": getattr(tree_deleted, 'deleted_count', 0),
                "green_families": getattr(gf_deleted, 'deleted_count', 0),
                "wallets": getattr(wallet_deleted, 'deleted_count', 0),
                "transactions": getattr(tx_deleted, 'deleted_count', 0),
                "bank_accounts": getattr(bank_acc_deleted, 'deleted_count', 0),
                "withdrawals": getattr(withdraw_deleted, 'deleted_count', 0),
                "financial_wallets": getattr(fin_wallet_deleted, 'deleted_count', 0),
                "financial_wallet_transactions": getattr(fin_tx_deleted, 'deleted_count', 0),
                "financial_wallet_withdrawals": getattr(fin_wth_deleted, 'deleted_count', 0),
                "financial_audit_logs": getattr(fin_audit_deleted, 'deleted_count', 0),
                "orders": getattr(order_deleted, 'deleted_count', 0),
                "cart_items": getattr(cart_deleted, 'deleted_count', 0),
                "wishlists": getattr(wishlist_deleted, 'deleted_count', 0),
                "soil_tests": getattr(soil_deleted, 'deleted_count', 0),
                "farmer_badges": getattr(badge_deleted, 'deleted_count', 0),
                "referrals": getattr(referral_deleted, 'deleted_count', 0),
                "support_tickets": getattr(support_deleted, 'deleted_count', 0),
                "insurance_policies": getattr(policy_deleted, 'deleted_count', 0),
                "insurance_claims": getattr(claim_deleted, 'deleted_count', 0),
                "agri_applications": getattr(agri_app_deleted, 'deleted_count', 0),
            }
        }
