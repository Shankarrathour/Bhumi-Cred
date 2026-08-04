from typing import Optional, Any
from datetime import datetime, timezone
from bson import ObjectId

from app.models.tree_registration import TreeRegistration, TreeRegistrationStatus
from app.repositories.base import BaseRepository


class TreeRegistrationRepository(BaseRepository[TreeRegistration]):
    def __init__(self):
        super().__init__(TreeRegistration)

    async def get_by_farmer(self, farmer_id: str) -> list[TreeRegistration]:
        return await TreeRegistration.find(TreeRegistration.farmer_id == farmer_id).sort("-created_at").to_list()

    async def get_by_id_and_farmer(self, registration_id: str, farmer_id: str) -> Optional[TreeRegistration]:
        try:
            return await TreeRegistration.find_one(
                TreeRegistration.id == ObjectId(registration_id),
                TreeRegistration.farmer_id == farmer_id
            )
        except Exception:
            return None

    async def list_paginated_with_farmer_details(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[TreeRegistrationStatus] = None,
        search: Optional[str] = None,
    ) -> tuple[list[dict[str, Any]], int]:

        match_stage = {}
        if status:
            match_stage["status"] = status

        pipeline = []
        if match_stage:
            pipeline.append({"$match": match_stage})

        # Join with farmers collection
        pipeline.extend([
            {
                "$addFields": {
                    "farmer_obj_id": {
                        "$convert": {
                            "input": "$farmer_id",
                            "to": "objectId",
                            "onError": None,
                            "onNull": None
                        }
                    }
                }
            },
            {
                "$lookup": {
                    "from": "farmers",
                    "localField": "farmer_obj_id",
                    "foreignField": "_id",
                    "as": "farmer_docs"
                }
            },
            {
                "$unwind": {
                    "path": "$farmer_docs",
                    "preserveNullAndEmptyArrays": True
                }
            },
        ])

        if search:
            pipeline.append({
                "$match": {
                    "$or": [
                        {"farmer_docs.full_name": {"$regex": search, "$options": "i"}},
                        {"farmer_docs.mobile": {"$regex": search, "$options": "i"}},
                        {"status": {"$regex": search, "$options": "i"}},
                    ]
                }
            })

        # Count total matching the same filters (status + search) before paginating
        count_result = await TreeRegistration.aggregate(pipeline + [{"$count": "total"}]).to_list()
        total = count_result[0]["total"] if count_result else 0

        pipeline.extend([
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit}
        ])

        # Execute aggregation
        cursor = TreeRegistration.aggregate(pipeline)
        results = await cursor.to_list(length=limit)

        return results, total
