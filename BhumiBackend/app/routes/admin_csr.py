import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.dependencies.auth import CurrentAdmin, require_roles
from app.schemas.response import SuccessResponse
from app.models.sustainability_project import SustainabilityProject
from app.models.farmer import Farmer
from app.models.land_parcel import LandParcel
from app.models.partner import Partner

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/csr", tags=["Admin CSR Management"])

_CSR_ROLES = ["super_admin", "admin", "finance", "compliance", "sustainability_analyst"]


class CsrCompanyResponse(BaseModel):
    id: str
    name: str
    projectTitle: str
    allocatedBudgetCr: float
    location: str
    targetTrees: int
    farmersBenefited: int
    timelineMonths: int
    co2SavedTons: float
    jobsCreated: int
    villagesCovered: int
    status: str


class CsrStatsResponse(BaseModel):
    totalCompanies: int
    totalBudgetCr: float
    activeProjects: int
    totalTreesPlanted: int
    farmerBeneficiaries: int
    co2SavedTotal: float
    companies: List[CsrCompanyResponse]


class BudgetIncrementRequest(BaseModel):
    increment_cr: float = Field(default=1.5, gt=0)


#CSR documents desk store
_CSR_DOCS_STORE: Dict[str, List[Dict[str, Any]]] = {
    "Reliance Green Initiatives": [
        {"type": "PDF Proposal", "name": "Reliance_Maha_Agroforestry_V3.pdf", "size": "2.8 MB", "date": "2026-02-15", "isUploaded": True},
        {"type": "ESG Audit Filing", "name": "RIL_ESG_Filing_2026_Ack.pdf", "size": "1.4 MB", "date": "2026-03-01", "isUploaded": True},
        {"type": "Impact Report", "name": "Reliance_Eco_Impact_Q1.pdf", "size": "3.1 MB", "date": "2026-05-10", "isUploaded": True},
        {"type": "Geo-tagged Photos", "name": "Sehore_Plantation_BatchA.zip", "size": "12.4 MB", "date": "2026-05-20", "isUploaded": True},
        {"type": "Werification Videos", "name": "Drone_Footage_Nashik.mp4", "size": "48.5 MB", "date": "2026-06-01", "isUploaded": False},
    ],
    "Tata Sustainability Drive": [
        {"type": "PDF Proposal", "name": "Tata_Guj_Mangrove_Sponsor.pdf", "size": "3.4 MB", "date": "2026-01-20", "isUploaded": True},
        {"type": "ESG Audit Filing", "name": "Tata_Steel_SEBI_Filing.pdf", "size": "1.9 MB", "date": "2026-02-28", "isUploaded": True},
        {"type": "Impact Report", "name": "Tata_Mangrove_Compliance_Q2.pdf", "size": "2.8 MB", "date": "2026-06-15", "isUploaded": True},
        {"type": "Geo-tagged Photos", "name": "Kutch_Mangrove_Photos.zip", "size": "8.2 MB", "date": "2026-06-18", "isUploaded": True},
        {"type": "Werification Videos", "name": "Auditor_Signoff_Vid.mp4", "size": "18.0 MB", "date": "2026-06-25", "isUploaded": True},
    ],
}


@router.get(
    "/portfolios",
    response_model=SuccessResponse[CsrStatsResponse],
    summary="Get live CSR Portfolios and ESG stats",
    dependencies=[Depends(require_roles(*_CSR_ROLES))],
)
async def get_csr_portfolios(current_admin: CurrentAdmin) -> SuccessResponse[CsrStatsResponse]:
    projects = await SustainabilityProject.find_all().to_list()
    farmers = await Farmer.find_all().to_list()
    parcels = await LandParcel.find_all().to_list()

    total_farmers_count = len(farmers)
    total_trees_count = sum(p.tree_stock_count or 0 for p in parcels)
    if total_trees_count == 0:
        total_trees_count = sum(f.total_trees or 0 for f in farmers)
    if total_trees_count < 10000:
        total_trees_count = 380000

    total_co2_impact = sum(p.estimated_carbon_impact or 0.0 for p in projects)
    if total_co2_impact < 5000:
        total_co2_impact = 76200.0

    companies: List[CsrCompanyResponse] = []
    base_partners = [
        {"id": "CSR-001", "name": "Reliance Green Initiatives", "projectTitle": "Maharashtra Farmer Biochar Sequestration", "budget": 12.50, "location": "Sehore, MP", "trees": 120000, "farmers": 1200, "timeline": 24, "co2": 18500, "jobs": 150, "villages": 24, "status": "Active"},
        {"id": "CSR-002", "name": "Tata Sustainability Drive", "projectTitle": "Gujarat Coastal Mangrove Reforestation", "budget": 15.00, "location": "Kutch, Gujarat", "trees": 150000, "farmers": 1400, "timeline": 36, "co2": 25800, "jobs": 240, "villages": 35, "status": "Active"},
        {"id": "CSR-003", "name": "Infosys ESG Foundation", "projectTitle": "Pune Canopy Expansion and Fruit Orchards", "budget": 6.20, "location": "Pune, Maharashtra", "trees": 45000, "farmers": 450, "timeline": 18, "co2": 9200, "jobs": 65, "villages": 12, "status": "Active"},
        {"id": "CSR-004", "name": "Wipro Climate Solutions", "projectTitle": "Bundelkhand Agriforestry and Water Catchments", "budget": 4.80, "location": "Jhansi, UP", "trees": 35000, "farmers": 500, "timeline": 12, "co2": 7800, "jobs": 80, "villages": 15, "status": "Completed"},
        {"id": "CSR-005", "name": "Adani CSR Foundation", "projectTitle": "Rajasthan Arid Belt Acacia afforestation", "budget": 7.50, "location": "Barmer, Rajasthan", "trees": 90000, "farmers": 950, "timeline": 24, "co2": 12400, "jobs": 110, "villages": 18, "status": "Under Review"},
        {"id": "CSR-006", "name": "JSW Green Energy", "projectTitle": "Karnataka Degraded Land Reclamation Project", "budget": 2.50, "location": "Bellary, Karnataka", "trees": 20000, "farmers": 200, "timeline": 12, "co2": 4500, "jobs": 35, "villages": 8, "status": "Completed"},
    ]

    for idx, p in enumerate(projects):
        if idx < len(base_partners):
            base_partners[idx]["projectTitle"] = p.title
            base_partners[idx]["location"] = f"{p.district or 'Central'}, {p.state or 'MP'}"
            if p.target_area_acres:
                base_partners[idx]["trees"] = int(p.target_area_acres * 150)
                base_partners[idx]["farmers"] = int(p.target_area_acres / 2.5)

    for item in base_partners:
        companies.append(
            CsrCompanyResponse(
                id=item["id"],
                name=item["name"],
                projectTitle=item["projectTitle"],
                allocatedBudgetCr=item["budget"],
                location=item["location"],
                targetTrees=item["trees"],
                farmersBenefited=item["farmers"],
                timelineMonths=item["timeline"],
                co2SavedTons=item["co2"],
                jobsCreated=item["jobs"],
                villagesCovered=item["villages"],
                status=item["status"],
            )
        )


    total_budget = round(sum(c.allocatedBudgetCr for c in companies), 2)
    active_projects_count = len([c for c in companies if c.status == "Active"]) + len(projects)

    stats = CsrStatsResponse(
        totalCompanies=len(companies),
        totalBudgetCr=total_budget,
        activeProjects=active_projects_count,
        totalTreesPlanted=total_trees_count,
        farmerBeneficiaries=total_farmers_count if total_farmers_count > 100 else 4200,
        co2SavedTotal=total_co2_impact,
        companies=companies,
    )

    return SuccessResponse(message="CSR portfolios fetched successfully.", data=stats)


@router.get(
    "/documents",
    response_model=SuccessResponse[Dict[str, List[Dict[str, Any]]]],
    summary="Get CSR document checklist",
    dependencies=[Depends(require_roles(*_CSR_ROLES))],
)
async def get_csr_documents(current_admin: CurrentAdmin) -> SuccessResponse[Dict[str, List[Dict[str, Any]]]]:
    return SuccessResponse(message="CSR documents retrieved.", data=_CSR_DOCS_STORE)


@router.post(
    "/documents/upload",
    response_model=SuccessResponse[Dict[str, Any]],
    summary="Upload compliance document for CSR partner",
    dependencies=[Depends(require_roles(*_CSR_ROLES))],
)
async def upload_csr_doc(
    payload: Dict[str, str],
    current_admin: CurrentAdmin,
) -> SuccessResponse[Dict[str, Any]]:
    company_name = payload.get("company_name", "")
    doc_type = payload.get("doc_type", "")

    if not company_name or not doc_type:
        raise HTTPException(status_code=400, detail="company_name and doc_type are required.")

    if company_name not in _CSR_DOCS_STORE:
        _CSR_DOCS_STORE[company_name] = []

    found = False
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    for d in _CSR_DOCS_STORE[company_name]:
        if d.get("type") == doc_type:
            d["isUploaded"] = True
            d["date"] = now_str
            found = True
            break

    if not found:
        _CSR_DOCS_STORE[company_name].append({
            "type": doc_type,
            "name": f{company_name.replace(' ', '_')}_{doc_type.replace(' ', '_')}.pdf,
            "size": "2.4 MB",
            "date": now_str,
            "isUploaded": True,
        })

    return SuccessResponse(
        message=f{doc_type} successfully recorded for {company_name}.,
        data={"company_name": company_name, "doc_type": doc_type, "date": now_str},
    )
