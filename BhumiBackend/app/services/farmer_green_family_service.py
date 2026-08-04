from typing import List
from datetime import datetime, timezone
from fastapi import HTTPException
from app.models.green_family import GreenFamilyCover, GeoCoords, TreeDetail
from app.models.farmer import Farmer
from beanie import PydanticObjectId
from app.schemas.green_family import CreateGreenFamilyRequest, GreenFamilyResponse

class FarmerGreenFamilyService:
    async def apply_for_cover(self, farmer_id: str, request_data: CreateGreenFamilyRequest) -> GreenFamilyResponse:
        cover = GreenFamilyCover(
            farmer_id=farmer_id,
            cluster_size=request_data.cluster_size,
            plantation_configuration=request_data.plantation_configuration,
            geo_coords=request_data.geo_coords.model_dump() if request_data.geo_coords else None,
            trees_details=[t.model_dump() for t in request_data.trees_details],
            plan_id=request_data.plan_id,
            plan_name=request_data.plan_name,
            premium_amount=request_data.premium_amount,
            cover_amount=request_data.cover_amount,
            status="Pending"
        )
        await cover.insert()
        return self._to_response(cover)

    async def list_covers(self, farmer_id: str) -> List[GreenFamilyResponse]:
        covers = await GreenFamilyCover.find(GreenFamilyCover.farmer_id == farmer_id).to_list()
        return [self._to_response(c) for c in covers]

    async def generate_certificate_html(self, farmer_id: str, cover_id: str) -> str:
        cover = await GreenFamilyCover.get(cover_id)
        if not cover or cover.farmer_id != farmer_id:
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
                <div class="details">This certifies that</div>
                <div class="details" style="font-weight: bold; font-size: 28px;">Farmer Name: {farmer_name}</div>
                <div class="details">has successfully registered and insured a</div>
                <div class="details" style="font-weight: bold;">{cover.cluster_size} Tree Green Family Unit</div>
                <div class="details">Plan: {cover.plan_name}</div>
                <div class="details">Coverage Amount: ₹{cover.cover_amount}</div>
                <div class="details">Date Issued: {datetime.now().strftime('%d %B %Y')}</div>
                <div class="footer">Verified by Satellite MRV & Blockchain Integrity</div>
            </div>
        </body>
        </html>
        """
        return html_content

    def _to_response(self, cover: GreenFamilyCover) -> GreenFamilyResponse:
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
            updated_at=cover.updated_at
        )

def get_farmer_green_family_service() -> FarmerGreenFamilyService:
    return FarmerGreenFamilyService()
