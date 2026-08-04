from typing import List, Optional, Tuple
from datetime import datetime, timezone
from fastapi import HTTPException
from app.models.green_family import GreenFamilyCover
from app.models.farmer import Farmer
from beanie import PydanticObjectId
from app.models.notification import Notification
from app.schemas.green_family import GreenFamilyResponse

class AdminGreenFamilyService:
    async def list_all_covers(
        self,
        skip: int = 0,
        limit: int = 10,
        search: Optional[str] = None,
        status: Optional[str] = None,
    ) -> Tuple[List[GreenFamilyResponse], int]:
        match_stage: dict = {}
        if status:
            match_stage["status"] = status

        pipeline: list = []
        if match_stage:
            pipeline.append({"$match": match_stage})

        # Join with farmers collection so search can match farmer name/mobile
        pipeline.extend([
            {
                "$addFields": {
                    "farmer_obj_id": {
                        "$convert": {
                            "input": "$farmer_id",
                            "to": "objectId",
                            "onError": None,
                            "onNull": None,
                        }
                    }
                }
            },
            {
                "$lookup": {
                    "from": "farmers",
                    "localField": "farmer_obj_id",
                    "foreignField": "_id",
                    "as": "farmer_docs",
                }
            },
            {"$unwind": {"path": "$farmer_docs", "preserveNullAndEmptyArrays": True}},
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

        count_result = await GreenFamilyCover.aggregate(pipeline + [{"$count": "total"}]).to_list()
        total = count_result[0]["total"] if count_result else 0

        pipeline.extend([
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit},
        ])

        docs = await GreenFamilyCover.aggregate(pipeline).to_list()

        responses = []
        for doc in docs:
            farmer_doc = doc.get("farmer_docs") or {}
            cover = GreenFamilyCover(**doc)
            farmer_dict = {
                "full_name": farmer_doc.get("full_name", "Unknown"),
                "mobile": farmer_doc.get("mobile", ""),
            }
            responses.append(self._to_response(cover, farmer_dict))

        return responses, total

    async def update_cover_status(self, cover_id: str, status: str) -> GreenFamilyResponse:
        cover = await GreenFamilyCover.get(cover_id)
        if not cover:
            raise HTTPException(status_code=404, detail="Cover not found")
        
        if status not in ["Verified", "Rejected", "Pending"]:
            raise HTTPException(status_code=400, detail="Invalid status")

        cover.status = status
        cover.updated_at = datetime.now(timezone.utc)
        
        if status == "Verified":
            cover.certificate_url = f"/v1/admin/green-family/{cover.id}/certificate"
            
        await cover.save()
        
        # Create Notification
        if status == 'Verified':
            notification = Notification(
                farmer_id=str(cover.farmer_id),
                title="Green Family Cover Approved",
                message=f"Your Green Family Insurance for {cover.cluster_size} trees has been verified and approved by Admin. Your certificate is ready to download.",
                type="system"
            )
            await notification.insert()
        elif status == 'Rejected':
            notification = Notification(
                farmer_id=str(cover.farmer_id),
                title="Green Family Cover Rejected",
                message=f"Your Green Family Insurance for {cover.cluster_size} trees was rejected by Admin. Please contact support.",
                type="system"
            )
            await notification.insert()
            
        farmer = await Farmer.get(cover.farmer_id)
        farmer_dict = {"full_name": farmer.full_name if farmer else "Unknown", "mobile": farmer.mobile if farmer else ""}
        
        return self._to_response(cover, farmer_dict)

    async def generate_certificate_html(self, cover_id: str) -> str:
        cover = await GreenFamilyCover.get(cover_id)
        if not cover:
            raise HTTPException(status_code=404, detail="Cover not found")
        if cover.status != "Verified":
            raise HTTPException(status_code=400, detail="Certificate only available for verified covers")
            
        farmer = await Farmer.get(PydanticObjectId(cover.farmer_id))
        farmer_name = farmer.full_name if farmer and farmer.full_name else "Farmer"

        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; padding: 40px; text-align: center; color: #333; }}
                .cert-container {{ border: 10px solid #10B981; padding: 50px; border-radius: 20px; }}
                h1 {{ color: #059669; font-size: 40px; }}
                .cert-title {{ font-size: 30px; font-weight: bold; margin-bottom: 20px; }}
                .details {{ font-size: 20px; margin: 10px 0; }}
                .footer {{ margin-top: 50px; font-style: italic; color: #666; }}
            </style>
        </head>
        <body>
            <div class="cert-container">
                <h1>BhumiCred</h1>
                <div class="cert-title">Green Family Cover Certificate</div>
                <div class="details">This is to certify that</div>
                <div class="details" style="font-size: 24px; font-weight: bold; color: #000;">Farmer Name: {farmer_name}</div>
                <div class="details">has successfully insured a</div>
                <div class="details" style="font-size: 24px; font-weight: bold; color: #047857;">{cover.cluster_size} Trees Group Cluster</div>
                <div class="details">Plan: {cover.plan_name}</div>
                <div class="details">Coverage Amount: ₹{cover.cover_amount}</div>
                <div class="footer">Issued on {cover.updated_at.strftime("%Y-%m-%d")} | Certificate ID: GF-{cover.id}</div>
            </div>
            <script>window.onload = function() {{ window.print(); }}</script>
        </body>
        </html>
        """
        return html_content

    def _to_response(self, cover: GreenFamilyCover, farmer_details: dict = None) -> GreenFamilyResponse:
        return GreenFamilyResponse(
            id=str(cover.id),
            farmer_id=cover.farmer_id,
            cluster_size=cover.cluster_size,
            plantation_configuration=cover.plantation_configuration,
            geo_coords=cover.geo_coords.model_dump() if cover.geo_coords else None,
            trees_details=[t.model_dump() for t in cover.trees_details],
            plan_id=cover.plan_id,
            plan_name=cover.plan_name,
            premium_amount=cover.premium_amount,
            cover_amount=cover.cover_amount,
            status=cover.status,
            certificate_url=cover.certificate_url,
            created_at=cover.created_at,
            updated_at=cover.updated_at,
            farmer_details=farmer_details
        )

def get_admin_green_family_service() -> AdminGreenFamilyService:
    return AdminGreenFamilyService()
