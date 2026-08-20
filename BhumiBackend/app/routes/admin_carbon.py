from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import List, Optional
import logging
import bson

from app.dependencies.auth import CurrentAdmin
from app.models.carbon_registry import (
    RegistryProject,
    CreditIssuance,
    CreditRetirement,
    CreditTransfer,
    CarbonDeveloper,
    CarbonBuyer,
    RegistryType,
    RegistryStatus,
    TransferStatus,
)
from app.schemas.common import SuccessResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/carbon", tags=["Admin Carbon Registry"])

# ── Schemas ──────────────────────────────────────────────────────────────────

class CarbonStatsResponse(BaseModel):
    draftProjects: int
    submittedProjects: int
    underValidation: int
    underVerification: int
    registeredProjects: int
    creditsIssued: float
    creditsRetired: float
    creditsSold: float

class ProjectResponse(BaseModel):
    project_id: str
    project_name: str
    registry: str
    methodology: str
    country: str
    status: str
    developer: str
    submission_date: str

class CreateProjectRequest(BaseModel):
    project_id: str
    project_name: str
    registry: str
    methodology: str
    country: str = "India"
    developer_name: str = "BhumiCred Core"

class BatchResponse(BaseModel):
    id: str
    batch_id: str
    project_name: str
    project_code: str
    vintage_year: int
    species: str
    location: str
    volume_tco2: float
    credits_issued: float
    credits_sold: float
    credits_available: float
    buyer_name: str
    price_per_tco2_usd: float
    revenue_lakhs: float
    verification_standard: str
    status: str
    created_at: str

class MintBatchRequest(BaseModel):
    project_name: str
    vintage_year: int
    volume_tco2: float
    price_per_tco2_usd: float
    verification_standard: str
    buyer_name: str

class RetireBatchRequest(BaseModel):
    quantity_retired: float
    retirement_reason: str
    buyer_name: str

# ── Helper to format date ─────────────────────────────────────────────────────

def fmt_date(dt: datetime) -> str:
    return dt.strftime("%d %b %Y") if dt else "-"

# ── Stats endpoint ────────────────────────────────────────────────────────────

@router.get("/stats", response_model=SuccessResponse[CarbonStatsResponse])
async def get_carbon_stats(current_admin: CurrentAdmin) -> SuccessResponse[CarbonStatsResponse]:
    projects = await RegistryProject.find(RegistryProject.is_deleted == False).to_list()
    draft = len([p for p in projects if p.registry_status == RegistryStatus.LISTED])
    submitted = 0  # proposed/submitted
    under_val = len([p for p in projects if p.registry_status == RegistryStatus.UNDER_VALIDATION])
    under_ver = len([p for p in projects if p.registry_status == RegistryStatus.ACTIVE_MONITORING])
    registered = len([p for p in projects if p.registry_status == RegistryStatus.REGISTERED])

    issuances = await CreditIssuance.find(CreditIssuance.is_deleted == False).to_list()
    total_issued = sum(i.quantity_tco2e for i in issuances)
    
    retirements = await CreditRetirement.find_all().to_list()
    total_retired = sum(r.quantity_retired for r in retirements)

    transfers = await CreditTransfer.find(CreditTransfer.status == TransferStatus.COMPLETED).to_list()
    total_sold = sum(t.quantity_tco2e for t in transfers)

    data = CarbonStatsResponse(
        draftProjects=draft,
        submittedProjects=submitted,
        underValidation=under_val,
        underVerification=under_ver,
        registeredProjects=registered,
        creditsIssued=total_issued,
        creditsRetired=total_retired,
        creditsSold=total_sold
    )
    return SuccessResponse(message="Stats fetched successfully", data=data)

# ── Projects endpoints ─────────────────────────────────────────────────────────

@router.get("/projects", response_model=SuccessResponse[List[ProjectResponse]])
async def get_projects(current_admin: CurrentAdmin) -> SuccessResponse[List[ProjectResponse]]:
    projects = await RegistryProject.find(RegistryProject.is_deleted == False).to_list()
    res = []
    for p in projects:
        dev = await CarbonDeveloper.get(p.developer_id)
        dev_name = dev.developer_name if dev else "BhumiCred Core"
        
        reg_str = "Verra" if "Verra" in p.registry_type.value else p.registry_type.value
        reg_str = reg_str.replace("_", " ")

        status_str = "Registered" if p.registry_status == RegistryStatus.REGISTERED else \
                     "Under Validation" if p.registry_status == RegistryStatus.UNDER_VALIDATION else \
                     "Under Verification" if p.registry_status == RegistryStatus.ACTIVE_MONITORING else \
                     "Draft" if p.registry_status == RegistryStatus.LISTED else p.registry_status.value
        status_str = status_str.replace("_", " ").title()

        res.append(
            ProjectResponse(
                project_id=p.registry_project_id,
                project_name=p.project_name,
                registry=reg_str,
                methodology=p.methodology_code,
                country=p.host_country,
                status=status_str,
                developer=dev_name,
                submission_date=fmt_date(p.created_at)
            )
        )
    return SuccessResponse(message="Projects fetched successfully", data=res)

@router.post("/projects", response_model=SuccessResponse[ProjectResponse])
async def create_project(payload: CreateProjectRequest, current_admin: CurrentAdmin) -> SuccessResponse[ProjectResponse]:
    dev = await CarbonDeveloper.find_one(CarbonDeveloper.developer_name == payload.developer_name)
    if not dev:
        dev = CarbonDeveloper(
            developer_id=f"DEV-{datetime.now().year}-{str(bson.ObjectId())[:6]}",
            developer_name=payload.developer_name,
            registration_number="REG-NEW",
            contact_email="partner@bhumicred.com",
            contact_phone="9826011902"
        )
        await dev.create()

    p = RegistryProject(
        registry_project_id=payload.project_id,
        project_name=payload.project_name,
        registry_type=RegistryType.VERRA if "Verra" in payload.registry else RegistryType.GOLD_STANDARD,
        methodology_code=payload.methodology,
        developer_id=dev.id,
        host_country=payload.country,
        crediting_period_start=datetime.now(timezone.utc),
        crediting_period_end=datetime.now(timezone.utc),
        registry_status=RegistryStatus.LISTED,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    await p.create()

    reg_str = "Verra" if "Verra" in p.registry_type.value else p.registry_type.value
    reg_str = reg_str.replace("_", " ")

    return SuccessResponse(
        message="Project created successfully",
        data=ProjectResponse(
            project_id=p.registry_project_id,
            project_name=p.project_name,
            registry=reg_str,
            methodology=p.methodology_code,
            country=p.host_country,
            status="Draft",
            developer=payload.developer_name,
            submission_date=fmt_date(p.created_at)
        )
    )

# ── Batches endpoints ─────────────────────────────────────────────────────────

@router.get("/batches", response_model=SuccessResponse[List[BatchResponse]])
async def get_batches(current_admin: CurrentAdmin) -> SuccessResponse[List[BatchResponse]]:
    issuances = await CreditIssuance.find(CreditIssuance.is_deleted == False).to_list()
    res = []
    for i in issuances:
        p = await RegistryProject.get(i.registry_project_id)
        p_name = p.project_name if p else "MP Agroforestry Carbon Sink Drive"
        p_code = p.registry_project_id if p else "PRJ-1042"

        transfers = await CreditTransfer.find(CreditTransfer.issuance_id == i.id).to_list()
        sold = sum(t.quantity_tco2e for t in transfers)
        
        buyer_name = "AgriCorp Offtaker Solutions"
        price_per_tco2_usd = 18.5
        if transfers:
            tx = transfers[0]
            price_per_tco2_usd = tx.unit_price_usd
            buyer = await CarbonBuyer.get(tx.buyer_id)
            if buyer:
                buyer_name = buyer.buyer_name

        retirements = await CreditRetirement.find(CreditRetirement.issuance_id == i.id).to_list()
        status_str = "Issued"
        if retirements:
            status_str = "Retired"
            buyer_name = retirements[0].beneficiary_name
        elif sold >= i.quantity_tco2e:
            status_str = "Sold"

        revenue_lakhs = (sold * price_per_tco2_usd * 80) / 100000

        res.append(
            BatchResponse(
                id=str(i.id),
                batch_id=i.issuance_id,
                project_name=p_name,
                project_code=p_code,
                vintage_year=i.vintage_year,
                species="Teak & Bamboo" if "Mangrove" not in p_name else "Avicennia Mangroves",
                location="MP, India" if "Mangrove" not in p_name else "Kutch, Gujarat",
                volume_tco2=i.quantity_tco2e,
                credits_issued=i.quantity_tco2e,
                credits_sold=sold,
                credits_available=i.available_quantity_tco2e,
                buyer_name=buyer_name,
                price_per_tco2_usd=price_per_tco2_usd,
                revenue_lakhs=round(revenue_lakhs, 2),
                verification_standard=i.serial_number_range,
                status=status_str,
                created_at=fmt_date(i.issuance_date)
            )
        )
    return SuccessResponse(message="Batches fetched successfully", data=res)

@router.post("/batches", response_model=SuccessResponse[BatchResponse])
async def mint_batch(payload: MintBatchRequest, current_admin: CurrentAdmin) -> SuccessResponse[BatchResponse]:
    proj = await RegistryProject.find_one(RegistryProject.project_name == payload.project_name)
    if not proj:
        proj = RegistryProject(
            registry_project_id=f"PRJ-9999",
            project_name=payload.project_name,
            registry_type=RegistryType.VERRA,
            methodology_code="VM0042",
            developer_id=bson.ObjectId(),
            crediting_period_start=datetime.now(timezone.utc),
            crediting_period_end=datetime.now(timezone.utc)
        )
        await proj.create()

    buyer = await CarbonBuyer.find_one(CarbonBuyer.buyer_name == payload.buyer_name)
    if not buyer:
        buyer = CarbonBuyer(
            buyer_id=f"BUYER-{datetime.now().year}-999",
            buyer_name=payload.buyer_name,
            contact_email="buyer@offtaker.com"
        )
        await buyer.create()

    issuance_ref = f"BCH-CRD-{datetime.now().strftime('%M%S')}"
    i = CreditIssuance(
        issuance_id=issuance_ref,
        registry_project_id=proj.id,
        verification_report_id=bson.ObjectId(),
        vintage_year=payload.vintage_year,
        serial_number_range=payload.verification_standard,
        quantity_tco2e=payload.volume_tco2,
        buffer_pool_quantity_tco2e=payload.volume_tco2 * 0.10,
        available_quantity_tco2e=0.0,  # 0 available because it's sold
        issuance_date=datetime.now(timezone.utc),
        certificate_url="https://verra.org/certificates/" + issuance_ref
    )
    await i.create()

    tx = CreditTransfer(
        transfer_id=f"TRX-{datetime.now().strftime('%M%S')}",
        seller_id=proj.developer_id or bson.ObjectId(),
        buyer_id=buyer.id,
        issuance_id=i.id,
        quantity_tco2e=payload.volume_tco2,
        unit_price_usd=payload.price_per_tco2_usd,
        total_amount_usd=payload.volume_tco2 * payload.price_per_tco2_usd
    )
    await tx.create()

    revenue_lakhs = (payload.volume_tco2 * payload.price_per_tco2_usd * 80) / 100000

    return SuccessResponse(
        message="Credits minted successfully",
        data=BatchResponse(
            id=str(i.id),
            batch_id=i.issuance_id,
            project_name=proj.project_name,
            project_code=proj.registry_project_id,
            vintage_year=i.vintage_year,
            species="Mixed Forestry",
            location="India",
            volume_tco2=i.quantity_tco2e,
            credits_issued=i.quantity_tco2e,
            credits_sold=i.quantity_tco2e,
            credits_available=0.0,
            buyer_name=payload.buyer_name,
            price_per_tco2_usd=payload.price_per_tco2_usd,
            revenue_lakhs=round(revenue_lakhs, 2),
            verification_standard=i.serial_number_range,
            status="Sold",
            created_at=fmt_date(i.issuance_date)
        )
    )

@router.post("/batches/{issuance_id}/retire", response_model=SuccessResponse[BatchResponse])
async def retire_batch(issuance_id: str, payload: RetireBatchRequest, current_admin: CurrentAdmin) -> SuccessResponse[BatchResponse]:
    i = await CreditIssuance.get(issuance_id)
    if not i:
        raise HTTPException(status_code=404, detail="Batch issuance not found")

    buyer = await CarbonBuyer.find_one(CarbonBuyer.buyer_name == payload.buyer_name)
    if not buyer:
        buyer = CarbonBuyer(
            buyer_id=f"BUYER-{datetime.now().year}-999",
            buyer_name=payload.buyer_name,
            contact_email="buyer@offtaker.com"
        )
        await buyer.create()

    ret = CreditRetirement(
        retirement_id=f"RET-{datetime.now().strftime('%M%S')}",
        issuance_id=i.id,
        buyer_id=buyer.id,
        quantity_retired=payload.quantity_retired,
        serial_numbers_retired=[i.serial_number_range],
        retirement_reason=payload.retirement_reason,
        beneficiary_name=payload.buyer_name,
        retirement_certificate_url="https://verra.org/certificates/ret-new"
    )
    await ret.create()

    i.available_quantity_tco2e = max(0.0, i.available_quantity_tco2e - payload.quantity_retired)
    await i.save()

    p = await RegistryProject.get(i.registry_project_id)
    p_name = p.project_name if p else "MP Agroforestry Carbon Sink Drive"
    p_code = p.registry_project_id if p else "PRJ-1042"

    transfers = await CreditTransfer.find(CreditTransfer.issuance_id == i.id).to_list()
    sold = sum(t.quantity_tco2e for t in transfers)
    price_per_tco2_usd = transfers[0].unit_price_usd if transfers else 18.5
    revenue_lakhs = (sold * price_per_tco2_usd * 80) / 100000

    return SuccessResponse(
        message="Credits retired successfully",
        data=BatchResponse(
            id=str(i.id),
            batch_id=i.issuance_id,
            project_name=p_name,
            project_code=p_code,
            vintage_year=i.vintage_year,
            species="Mixed Forestry",
            location="India",
            volume_tco2=i.quantity_tco2e,
            credits_issued=i.quantity_tco2e,
            credits_sold=sold,
            credits_available=i.available_quantity_tco2e,
            buyer_name=payload.buyer_name,
            price_per_tco2_usd=price_per_tco2_usd,
            revenue_lakhs=round(revenue_lakhs, 2),
            verification_standard=i.serial_number_range,
            status="Retired",
            created_at=fmt_date(i.issuance_date)
        )
    )
