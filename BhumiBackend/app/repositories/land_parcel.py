from typing import Optional
from bson import ObjectId

from app.models.land_parcel import LandParcel
from app.repositories.base import BaseRepository


class LandParcelRepository(BaseRepository[LandParcel]):
    def __init__(self):
        super().__init__(LandParcel)

    async def get_active_by_farmer(self, farmer_id: str) -> list[LandParcel]:
        return await (
            LandParcel.find(
                LandParcel.farmer_id == farmer_id,
                LandParcel.is_active == True,
            )
            .sort("created_at")
            .to_list()
        )

    async def get_by_id_and_farmer(
        self, parcel_id: str, farmer_id: str
    ) -> Optional[LandParcel]:
        try:
            doc = await LandParcel.get(ObjectId(parcel_id))
        except Exception:
            return None
        if doc is None or doc.farmer_id != farmer_id or not doc.is_active:
            return None
        return doc

    async def get_total_acreage(self, farmer_id: str) -> float:
        parcels = await self.get_active_by_farmer(farmer_id)
        return sum(p.area_acres for p in parcels)

    async def list_active(self) -> list[LandParcel]:
        return await (
            LandParcel.find(LandParcel.is_active == True)
            .sort("-created_at")
            .to_list()
        )
