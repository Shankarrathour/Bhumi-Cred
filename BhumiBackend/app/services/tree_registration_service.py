from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId

from app.config.settings import settings
from app.integrations.cloudinary_service import CloudinaryService
from app.models.tree_registration import TreeRegistration, TreeRegistrationStatus
from app.repositories.tree_registration import TreeRegistrationRepository
from fastapi import UploadFile
from app.utils.upload import upload_file, ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES
from app.repositories.farmer import FarmerRepository
from app.schemas.tree_registration import (
    RegisterTreeRequest,
    UpdateTreeRequest,
    TreeRegistrationResponse,
    AdminTreeRegistrationResponse,
    FarmerDetails,
)
from app.core.exceptions import NotFoundException


from app.services.notification_service import NotificationService

class TreeRegistrationService:
    def __init__(
        self,
        tree_repo: TreeRegistrationRepository,
        farmer_repo: FarmerRepository,
        notification_service: NotificationService = None,
        cloudinary_svc: Optional[CloudinaryService] = None,
    ):
        self.tree_repo = tree_repo
        self.farmer_repo = farmer_repo
        self.notification_service = notification_service
        self._cloudinary = cloudinary_svc

    # ── Farmer Methods ────────────────────────────────────────────────────────
    
    async def register_tree(self, farmer_id: str, payload: RegisterTreeRequest) -> TreeRegistrationResponse:
        tree_reg = TreeRegistration(
            farmer_id=farmer_id,
            **payload.model_dump()
        )
        await self.tree_repo.create(tree_reg)
        
        # Increment total trees for the farmer and update any active project enrollments
        try:
            farmer = await self.farmer_repo.get_by_id(ObjectId(farmer_id))
            if farmer:
                farmer.total_trees += payload.tree_count
                await farmer.save()
                
            from app.models.project_enrollment import ProjectEnrollment
            enrollments = await ProjectEnrollment.find(ProjectEnrollment.farmer_id == farmer_id).to_list()
            for enrollment in enrollments:
                enrollment.registered_trees += payload.tree_count
                await enrollment.save()
        except Exception as e:
            pass
            
        return self._to_response(tree_reg)

    async def get_farmer_registrations(self, farmer_id: str) -> list[TreeRegistrationResponse]:
        registrations = await self.tree_repo.get_by_farmer(farmer_id)
        return [self._to_response(reg) for reg in registrations]

    async def get_registration_details(self, registration_id: str, farmer_id: str) -> TreeRegistrationResponse:
        reg = await self.tree_repo.get_by_id_and_farmer(registration_id, farmer_id)
        if not reg:
            raise NotFoundException("Tree registration not found.")
        return self._to_response(reg)

    async def update_registration(self, registration_id: str, farmer_id: str, payload: UpdateTreeRequest) -> TreeRegistrationResponse:
        reg = await self.tree_repo.get_by_id_and_farmer(registration_id, farmer_id)
        if not reg:
            raise NotFoundException("Tree registration not found.")
            
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(reg, key, value)
            
        reg.updated_at = datetime.now(timezone.utc)
        await reg.save()
        
        return self._to_response(reg)

    async def upload_photos(self, registration_id: str, farmer_id: str, files: list[UploadFile], base_url: str = "") -> TreeRegistrationResponse:
        reg = await self.tree_repo.get_by_id_and_farmer(registration_id, farmer_id)
        if not reg:
            raise NotFoundException("Tree registration not found.")

        uploaded_urls = []
        uploaded_assets = []
        for file in files:
            if self._cloudinary and self._cloudinary.is_enabled:
                folder = f"bhumi/{settings.cloudinary_env}/tree_registrations/{registration_id}"
                asset = await self._cloudinary.upload(
                    file, folder=folder, allowed_types=ALLOWED_IMAGE_TYPES, max_bytes=MAX_PHOTO_BYTES
                )
                uploaded_urls.append(asset.secure_url)
                uploaded_assets.append(asset)
            else:
                url = await upload_file(
                    file, f"tree_photos/{registration_id}", ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES
                )
                if base_url and url.startswith("/"):
                    url = f"{base_url}{url}"
                uploaded_urls.append(url)

        if not reg.photos:
            reg.photos = []
        if not reg.photo_assets:
            reg.photo_assets = []

        reg.photos.extend(uploaded_urls)
        reg.photo_assets.extend(uploaded_assets)
        reg.updated_at = datetime.now(timezone.utc)
        await reg.save()

        return self._to_response(reg)

    # ── Admin Methods ─────────────────────────────────────────────────────────
    
    async def get_all_registrations(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[TreeRegistrationStatus] = None,
        search: Optional[str] = None,
    ) -> tuple[list[AdminTreeRegistrationResponse], int]:
        docs, total = await self.tree_repo.list_paginated_with_farmer_details(skip, limit, status, search)
        
        responses = []
        for doc in docs:
            farmer_doc = doc.get("farmer_docs", {})
            tree_reg = TreeRegistration(**doc)
            
            farmer_details = FarmerDetails(
                farmer_id=str(farmer_doc.get("_id", doc.get("farmer_id"))),
                full_name=farmer_doc.get("full_name"),
                mobile=farmer_doc.get("mobile", ""),
                village=farmer_doc.get("village"),
                district=farmer_doc.get("district")
            )
            
            responses.append(AdminTreeRegistrationResponse(
                id=str(doc.get("_id")),
                tree_details=self._to_response(tree_reg),
                farmer_details=farmer_details
            ))
            
        return responses, total

    async def get_registration_by_id(self, registration_id: str) -> AdminTreeRegistrationResponse:
        try:
            reg = await self.tree_repo.get_by_id(ObjectId(registration_id))
        except Exception:
            reg = None
            
        if not reg:
            raise NotFoundException("Tree registration not found.")
            
        farmer = await self.farmer_repo.get_by_id(ObjectId(reg.farmer_id))
        
        farmer_details = FarmerDetails(
            farmer_id=reg.farmer_id,
            full_name=farmer.full_name if farmer else None,
            mobile=farmer.mobile if farmer else "Unknown",
            village=farmer.village if farmer else None,
            district=farmer.district if farmer else None
        )
        
        return AdminTreeRegistrationResponse(
            id=str(reg.id),
            tree_details=self._to_response(reg),
            farmer_details=farmer_details
        )

    async def update_status(self, registration_id: str, status: TreeRegistrationStatus, remarks: Optional[str] = None) -> AdminTreeRegistrationResponse:
        try:
            reg = await self.tree_repo.get_by_id(ObjectId(registration_id))
        except Exception:
            reg = None
            
        if not reg:
            raise NotFoundException("Tree registration not found.")
            
        reg.status = status
        if remarks is not None:
            reg.remarks = remarks
        reg.updated_at = datetime.now(timezone.utc)
        await reg.save()
        
        # Emit notification if status changed to approved or rejected
        if self.notification_service:
            try:
                import logging
                if status == TreeRegistrationStatus.APPROVED:
                    title = "Tree Registration Approved"
                    message = f"Your tree '{reg.tree_name}' has been approved successfully."
                    await self.notification_service.create_notification(reg.farmer_id, title, message)
                elif status == TreeRegistrationStatus.REJECTED:
                    title = "Tree Registration Rejected"
                    message = f"Your tree '{reg.tree_name}' has been rejected."
                    if remarks:
                        message += f" Admin remarks: {remarks}"
                    await self.notification_service.create_notification(reg.farmer_id, title, message)
            except Exception as e:
                logging.getLogger(__name__).error(f"Failed to create notification: {e}")
        
        return await self.get_registration_by_id(registration_id)

    # ── Helpers ───────────────────────────────────────────────────────────────
    
    def _to_response(self, reg: TreeRegistration) -> TreeRegistrationResponse:
        return TreeRegistrationResponse(
            id=str(reg.id),
            farmer_id=reg.farmer_id,
            tree_name=reg.tree_name,
            tree_species=reg.tree_species,
            tree_count=reg.tree_count,
            tree_age=reg.tree_age,
            plantation_year=reg.plantation_year,
            land_id=reg.land_id,
            latitude=reg.latitude,
            longitude=reg.longitude,
            village=reg.village,
            district=reg.district,
            state=reg.state,
            photos=reg.photos,
            insurance_required=reg.insurance_required,
            remarks=reg.remarks,
            status=reg.status,
            created_at=reg.created_at,
            updated_at=reg.updated_at,
        )
