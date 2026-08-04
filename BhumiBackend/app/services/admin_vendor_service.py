from typing import Optional

from app.models.vendor import Vendor
from app.repositories.vendor import VendorRepository
from app.schemas.vendor import VendorListResponse, VendorResponse


class AdminVendorService:
    def __init__(self, vendor_repo: VendorRepository):
        self._vendors = vendor_repo

    @staticmethod
    def _to_response(v: Vendor) -> VendorResponse:
        return VendorResponse(
            id=str(v.id),
            vendor_id=v.vendor_id,
            name=v.name,
            phone=v.phone,
            # The registration wizard (Step 2 "Business Details") only ever writes
            # business_name; store_name is a legacy field some older vendor records
            # still carry. Prefer business_name, fall back to store_name for those.
            store_name=v.business_name or v.store_name,
            gst_number=v.gst_number,
            address=v.address,
            state=v.state,
            district=v.district,
            tehsil=v.tehsil,
            village_city=v.village_city,
            status=v.status,
            wallet_balance=v.wallet_balance,
            created_at=v.created_at,
        )

    async def list_vendors(
        self,
        page: int,
        limit: int,
        search: Optional[str] = None,
    ) -> VendorListResponse:
        vendors, total = await self._vendors.list_paginated(page=page, limit=limit, search=search)
        total_pages = max(1, (total + limit - 1) // limit)
        return VendorListResponse(
            items=[self._to_response(v) for v in vendors],
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
            has_next=page < total_pages,
        )
