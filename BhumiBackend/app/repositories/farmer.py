from typing import Optional
from datetime import datetime, timezone

from app.models.farmer import Farmer, KYCStatus
from app.repositories.base import BaseRepository
from app.utils.id_generator import generate_public_id


class FarmerRepository(BaseRepository[Farmer]):
    def __init__(self):
        super().__init__(Farmer)

    async def get_by_mobile(self, mobile: str) -> Optional[Farmer]:
        return await Farmer.find_one(Farmer.mobile == mobile)

    async def get_by_email(self, email: str) -> Optional[Farmer]:
        return await Farmer.find_one(Farmer.email == email)

    async def find_or_create(self, mobile: str, role: str = "farmer") -> tuple[Farmer, bool]:
        """
        Return (farmer, is_new). Creates farmer with minimal data if not found.
        """
        farmer = await self.get_by_mobile(mobile)
        if farmer:
            return farmer, False
        
        prefix = "FAR"
        if role == "govt_body":
            prefix = "GOV"
        elif role == "partner":
            prefix = "PTR"

        farmer_id = await generate_public_id(prefix, "farmer_id")
        farmer = Farmer(mobile=mobile, farmer_id=farmer_id, role=role)
        await farmer.insert()
        return farmer, True

    async def update_kyc_status(
        self,
        farmer: Farmer,
        status: KYCStatus,
        remarks: Optional[str],
        reviewed_by: Optional[str],
    ) -> Farmer:
        farmer.kyc_status = status
        farmer.kyc_remarks = remarks
        farmer.kyc_reviewed_by = reviewed_by
        farmer.kyc_reviewed_at = datetime.now(timezone.utc)
        farmer.updated_at = datetime.now(timezone.utc)
        await farmer.save()
        return farmer

    async def update_fcm_token(self, farmer: Farmer, fcm_token: str) -> Farmer:
        farmer.fcm_token = fcm_token
        farmer.updated_at = datetime.now(timezone.utc)
        await farmer.save()
        return farmer

    async def set_sustainability_score(self, farmer: Farmer, score: int) -> Farmer:
        farmer.sustainability_score = max(0, min(100, score))
        farmer.updated_at = datetime.now(timezone.utc)
        await farmer.save()
        return farmer

    async def list_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        kyc_status: Optional[KYCStatus] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        village: Optional[str] = None,
    ) -> tuple[list[Farmer], int]:
        query: dict = {}
        role_filter = {"$or": [{"role": "farmer"}, {"role": {"$exists": False}}]}
        
        if kyc_status:
            query["kyc_status"] = kyc_status
        
        if is_active is not None:
            query["is_active"] = is_active
        if state:
            query["state"] = state
        if district:
            query["district"] = district
        if village:
            query["village"] = {"$regex": village, "$options": "i"}
            
        if search:
            search_filter = [
                {"full_name": {"$regex": search, "$options": "i"}},
                {"mobile": {"$regex": search, "$options": "i"}},
                {"farmer_id": {"$regex": search, "$options": "i"}},
                {"village": {"$regex": search, "$options": "i"}},
                {"district": {"$regex": search, "$options": "i"}},
                {"state": {"$regex": search, "$options": "i"}},
            ]
            query["$and"] = [
                role_filter,
                {"$or": search_filter}
            ]
        else:
            # Merge role_filter keys into query dictionary
            if "$or" in query:
                # In case any other field dynamically used $or, use $and to be safe
                query["$and"] = [role_filter]
            else:
                query.update(role_filter)

        results = await Farmer.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
        total = await Farmer.find(query).count()
        return results, total

    async def get_location_combinations(self) -> list[dict]:
        """Distinct real (state, district, block, village) tuples present on farmer records."""
        pipeline = [
            {"$match": {"state": {"$nin": [None, ""]}}},
            {
                "$group": {
                    "_id": {
                        "state": "$state",
                        "district": "$district",
                        "block": {"$ifNull": ["$tehsil", "$vikash_khand"]},
                        "village": "$village",
                    }
                }
            },
        ]
        results = await Farmer.aggregate(pipeline).to_list()
        return [r["_id"] for r in results]

    async def get_admin_vendor_stats(self, vendors_with_products: int) -> dict:
        pipeline = [
            {"$group": {
                "_id": None,
                "total": {"$sum": 1},
                "active": {"$sum": {"$cond": [{"$eq": ["$is_active", True]}, 1, 0]}},
                "inactive": {"$sum": {"$cond": [{"$eq": ["$is_active", False]}, 1, 0]}}
            }}
        ]
        results = await Farmer.aggregate(pipeline).to_list()
        stats = results[0] if results else {}
        
        total = stats.get("total", 0)
        return {
            "total_vendors": total,
            "active_vendors": stats.get("active", 0),
            "inactive_vendors": stats.get("inactive", 0),
            "vendors_with_products": vendors_with_products,
            "vendors_without_products": max(0, total - vendors_with_products)
        }
