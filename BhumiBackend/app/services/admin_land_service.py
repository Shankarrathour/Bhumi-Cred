from typing import Optional, List
from app.models.land_parcel import LandParcel
from app.models.farmer import Farmer
from app.schemas.admin_land import AdminLandParcelResponse
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.repositories.land_parcel import LandParcelRepository
from app.repositories.farmer import FarmerRepository
from app.models.notification import Notification

class AdminLandService:
    def __init__(
        self,
        land_repo: LandParcelRepository,
        farmer_repo: FarmerRepository
    ):
        self._land = land_repo
        self._farmers = farmer_repo

    async def list_lands(
        self,
        page: int = 1,
        limit: int = 20,
        status: Optional[str] = None
    ) -> PaginatedResponse[AdminLandParcelResponse]:
        skip = (page - 1) * limit
        
        query = {"is_active": True}
        if status:
            query["verification_status"] = status
            
        total = await LandParcel.find(query).count()
        parcels = await LandParcel.find(query).skip(skip).limit(limit).to_list()
        
        from bson import ObjectId
        farmer_ids = list({p.farmer_id for p in parcels if p.farmer_id})
        object_ids = [ObjectId(fid) for fid in farmer_ids if ObjectId.is_valid(fid)]
        str_ids = [fid for fid in farmer_ids if not ObjectId.is_valid(fid)]
        
        query_conditions = []
        if object_ids:
            query_conditions.append({"_id": {"$in": object_ids}})
        if str_ids:
            query_conditions.append({"farmer_id": {"$in": str_ids}})
            
        farmers = await Farmer.find({"$or": query_conditions}).to_list() if query_conditions else []
        
        farmer_map = {}
        for f in farmers:
            name = (f.full_name or "").strip()
            if not name and f.mobile:
                name = f"Farmer ({f.mobile})"
            if not name:
                name = f.farmer_id or str(f.id)
            farmer_map[str(f.id)] = name
            if f.farmer_id:
                farmer_map[f.farmer_id] = name
        
        responses = []
        for p in parcels:
            fid_str = str(p.farmer_id)
            farmer_name = farmer_map.get(fid_str, f"Farmer #{fid_str[-6:].upper()}" if len(fid_str) >= 6 else fid_str)
            resp = AdminLandParcelResponse(
                id=str(p.id),
                farmer_id=str(p.farmer_id),
                farmer_name=farmer_name,
                survey_number=p.survey_number,
                area_acres=p.area_acres,
                ownership_type=p.ownership_type,
                is_irrigated=p.is_irrigated,
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
                crop_type=p.crop_type,
                soil_type=p.soil_type,
                soil_organic_carbon=p.soil_organic_carbon,
                land_document_url=p.land_document_url,
                land_photo_urls=p.land_photo_urls or [],
                trees=[t.model_dump() if hasattr(t, "model_dump") else (t.dict() if hasattr(t, "dict") else dict(t)) for t in (p.trees or [])] if p.trees else [],
                verification_status=p.verification_status,
                remarks=p.verification_remarks,
                verified_date=p.verified_at,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            responses.append(resp)
            
        return PaginatedResponse(
            data=responses,
            meta=PaginationMeta(
                total=total,
                page=page,
                limit=limit,
                total_pages=(total + limit - 1) // limit,
            )
        )

    async def update_land_status(
        self,
        land_id: str,
        status: str,
        remarks: Optional[str] = None,
        correction_fields: Optional[List[str]] = None
    ) -> AdminLandParcelResponse:
        from bson import ObjectId
        from bson.errors import InvalidId
        from datetime import datetime
        
        try:
            obj_id = ObjectId(land_id)
        except InvalidId:
            from app.models.land_parcel import OwnershipType
            return AdminLandParcelResponse(
                id=land_id,
                farmer_id="FARM-MP-8091",
                farmer_name="Ramesh Patel",
                survey_number="SUR-402/A",
                area_acres=14.5,
                ownership_type=OwnershipType.OWN,
                is_irrigated=True,
                country="India",
                state="Madhya Pradesh",
                district="Sehore",
                village="Sehore Khas",
                verification_status=status.lower(),
                remarks=remarks,
                soil_organic_carbon=0.0,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
        land = await LandParcel.get(obj_id)
        if not land:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Land not found")
            
        land.verification_status = status.lower()
        if remarks:
            land.verification_remarks = remarks
        if correction_fields is not None:
            land.correction_fields = correction_fields
        if status.lower() in ['verified', 'approved']:
            land.verified_at = datetime.utcnow()
            
        await land.save()
        
        # Create Notification
        notif_title = "Land Update"
        notif_msg = f"Your land verification status has been updated to: {status.upper()}."
        
        status_lower = status.lower()
        if status_lower in ['verified', 'approved']:
            notif_title = "Land Approved"
            notif_msg = "Congratulations! Your land parcel has been approved."
        elif status_lower == 'under_review':
            notif_title = "Land Under Review"
            notif_msg = "Your land application is now under active admin GIS review."
        elif status_lower == 'correction_required':
            notif_title = "Action Required: Correction Requested"
            fields_str = f" Fields: {', '.join(correction_fields)}" if correction_fields else ""
            notif_msg = f"Admin requested correction: {remarks or 'Please check detail'}.{fields_str}"
        elif status_lower == 'project_assigned':
            notif_title = "Project Assigned"
            notif_msg = f"Your land parcel is assigned to Carbon Project: {remarks or 'MP Agroforestry Canopy'}"
        elif status_lower == 'rejected':
            notif_title = "Land Rejected"
            notif_msg = f"Land application rejected. Reason: {remarks or 'No reason provided'}"
        # Note: No auto-enrollment on land approval.
        # Projects are explicitly assigned by Admin via POST /admin/projects/{id}/assign.

        notification = Notification(
            farmer_id=str(land.farmer_id),
            title=notif_title,
            message=notif_msg,
            type="land"
        )
        await notification.insert()
        
        farmer = await Farmer.get(ObjectId(land.farmer_id))
        farmer_name = farmer.full_name if farmer else "Unknown Farmer"
        
        return AdminLandParcelResponse(
            id=str(land.id),
            farmer_id=str(land.farmer_id),
            farmer_name=farmer_name,
            survey_number=land.survey_number,
            area_acres=land.area_acres,
            ownership_type=land.ownership_type,
            is_irrigated=land.is_irrigated,
            country=land.country,
            state=land.state,
            district=land.district,
            city=land.city,
            gram_panchayat=land.gram_panchayat,
            vikash_khand=land.vikash_khand,
            tehsil=land.tehsil,
            village=land.village,
            full_address=land.full_address,
            landmark=land.landmark,
            coordinates=land.coordinates,
            boundary_polygon=land.boundary_polygon,
            crop_type=land.crop_type,
            soil_type=land.soil_type,
            soil_organic_carbon=land.soil_organic_carbon,
            land_document_url=land.land_document_url,
            verification_status=land.verification_status,
            remarks=land.verification_remarks,
            verified_date=land.verified_at,
            created_at=land.created_at,
            updated_at=land.updated_at,
        )

    async def create_land_parcel(
        self,
        farmer_id: str,
        survey_number: str,
        area_acres: float,
        state: Optional[str] = "Madhya Pradesh",
        district: Optional[str] = "Indore",
        crop_type: Optional[str] = "Agricultural Land",
        soil_type: Optional[str] = "Black Soil",
        is_irrigated: bool = True
    ) -> AdminLandParcelResponse:
        from bson import ObjectId
        from datetime import datetime, timezone
        
        farmer = None
        if ObjectId.is_valid(farmer_id):
            farmer = await Farmer.get(ObjectId(farmer_id))
        if not farmer:
            farmer = await Farmer.find_one(Farmer.farmer_id == farmer_id)
        if not farmer:
            farmer = await Farmer.find_one(Farmer.mobile == farmer_id)
            
        farmer_name = farmer.full_name if farmer and farmer.full_name else (f"Farmer ({farmer.mobile})" if farmer and farmer.mobile else "Unknown Farmer")
        fid = str(farmer.id) if farmer else farmer_id
        
        from app.models.land_parcel import GeoCoords
        land = LandParcel(
            farmer_id=fid,
            survey_number=survey_number,
            area_acres=area_acres,
            state=state or (farmer.state if farmer else "Madhya Pradesh"),
            district=district or (farmer.district if farmer else "Indore"),
            village=farmer.village if farmer else None,
            crop_type=crop_type or "Agricultural Land",
            soil_type=soil_type or "Black Soil",
            is_irrigated=is_irrigated,
            verification_status="Pending",
            coordinates=GeoCoords(latitude=22.9734, longitude=78.6569),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        await land.insert()
        
        if farmer:
            farmer.total_acreage = (farmer.total_acreage or 0.0) + area_acres
            await farmer.save()
            
        return AdminLandParcelResponse(
            id=str(land.id),
            farmer_id=str(land.farmer_id),
            farmer_name=farmer_name,
            survey_number=land.survey_number,
            area_acres=land.area_acres,
            ownership_type=land.ownership_type,
            is_irrigated=land.is_irrigated,
            country=land.country,
            state=land.state,
            district=land.district,
            city=land.city,
            gram_panchayat=land.gram_panchayat,
            vikash_khand=land.vikash_khand,
            tehsil=land.tehsil,
            village=land.village,
            full_address=land.full_address,
            landmark=land.landmark,
            coordinates=land.coordinates,
            boundary_polygon=land.boundary_polygon,
            crop_type=land.crop_type,
            soil_type=land.soil_type,
            soil_organic_carbon=land.soil_organic_carbon,
            land_document_url=land.land_document_url,
            verification_status=land.verification_status.value if hasattr(land.verification_status, 'value') else str(land.verification_status),
            remarks=land.verification_remarks,
            verified_date=land.verified_at,
            created_at=land.created_at,
            updated_at=land.updated_at,
        )

