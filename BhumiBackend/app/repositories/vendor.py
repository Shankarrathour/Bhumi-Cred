from typing import Optional
from beanie import PydanticObjectId
from app.models.vendor import Vendor
from app.utils.id_generator import generate_public_id

class VendorRepository:
    async def create(self, vendor: Vendor) -> Vendor:
        await vendor.insert()
        return vendor

    async def get_by_email(self, email: str) -> Optional[Vendor]:
        return await Vendor.find_one(Vendor.email == email)

    async def get_by_phone(self, phone: str) -> Optional[Vendor]:
        return await Vendor.find_one(Vendor.phone == phone)

    async def get_by_id(self, vendor_id: str) -> Optional[Vendor]:
        try:
            return await Vendor.get(PydanticObjectId(vendor_id))
        except Exception:
            return None

    async def find_or_create(self, phone: str) -> tuple[Vendor, bool]:
        """
        Return (vendor, is_new). Creates a minimal vendor stub (no name/business
        details yet) if not found — mirrors FarmerRepository.find_or_create.
        The multi-step registration wizard fills in the remaining fields.
        """
        vendor = await self.get_by_phone(phone)
        if vendor:
            return vendor, False
        vendor_id = await generate_public_id("VEN", "vendor_id")
        vendor = Vendor(phone=phone, vendor_id=vendor_id)
        await vendor.insert()
        return vendor, True

    async def list_paginated(
        self,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
    ) -> tuple[list[Vendor], int]:
        skip = (page - 1) * limit
        # Exclude OTP-only stubs that never completed the registration wizard.
        # `name` is only ever set by VendorAuthService.update_vendor_profile()
        # (the wizard's Review-step submit) — mirrors FarmerRepository.list_paginated()
        # excluding kyc_status == "unverified" for the same reason.
        query: dict = {"name": {"$nin": [None, ""]}}
        if search:
            query["$or"] = [
                {"store_name": {"$regex": search, "$options": "i"}},
                {"business_name": {"$regex": search, "$options": "i"}},
                {"name": {"$regex": search, "$options": "i"}},
                {"phone": {"$regex": search, "$options": "i"}},
                {"vendor_id": {"$regex": search, "$options": "i"}},
            ]

        results = await Vendor.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
        total = await Vendor.find(query).count()
        return results, total
