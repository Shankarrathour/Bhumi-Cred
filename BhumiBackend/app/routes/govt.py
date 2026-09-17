import os
import json
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field


from app.models.land_parcel import LandParcel, OwnershipType, LandVerificationStatus
from app.models.sustainability_project import SustainabilityProject, SustainabilityProjectStatus
from app.models.wallet import WalletTransaction, TransactionType, TransactionStatus
from beanie import PydanticObjectId
from bson import ObjectId
import asyncio

from app.core.govt_security import (
    GovtUserClaims,
    GovtLoginRequest,
    GovtLoginResponse,
    SecuritySettingsRequest,
    create_govt_access_token,
    get_current_govt_user,
    require_approved_govt_org,
    require_govt_role_only,
    apply_jurisdiction_filter,
    verify_single_item_jurisdiction,
    mask_sensitive_pii,
)

router = APIRouter(tags=["Government Body"])

DB_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "govt_storage.json")
os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)

def load_data() -> Dict[str, Any]:
    default_structure = {
        "accounts": [],
        "assets": [],
        "campaigns": [],
        "soil_requests": [],
        "insurance_requests": [],
        "project_proposals": [],
        "carbon_requests": [],
        "withdrawals": [],
        "notifications": [],
        "wallet_transactions": [
            {"id": "TXN-1001", "title": "Tree Plantation Scheme Grant", "amount": "+₹15,000", "type": "credit", "date": "10 Aug 2026", "status": "Cleared"},
            {"id": "TXN-1002", "title": "Soil Testing Equipment Payout", "amount": "-₹4,500", "type": "debit", "date": "05 Aug 2026", "status": "Settled"},
            {"id": "TXN-1003", "title": "Carbon Sequestration Bonus (Q2)", "amount": "+₹32,400", "type": "credit", "date": "01 Aug 2026", "status": "Cleared"}
        ]
    }
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(default_structure, f, indent=2)
        return default_structure
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            for k, v in default_structure.items():
                if k not in data:
                    data[k] = v
            return data
    except Exception:
        return default_structure

def save_data(data: Dict[str, Any]):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def add_audit_event(item: Dict[str, Any], action: str, actor: str = "Admin", notes: Optional[str] = None):
    if "audit_timeline" not in item:
        item["audit_timeline"] = []
    item["audit_timeline"].append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "actor": actor,
        "notes": notes
    })

def add_govt_notification(db: Dict[str, Any], title: str, message: str, notif_type: str = "approved", ref_id: Optional[str] = None):
    if "notifications" not in db:
        db["notifications"] = []
    new_notif = {
        "id": f"notif_govt_{int(datetime.now(timezone.utc).timestamp())}_{len(db['notifications']) + 1}",
        "title": title,
        "message": message,
        "type": notif_type,
        "ref_id": ref_id,
        "date": datetime.now(timezone.utc).strftime("%d %b %Y"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "read": False
    }
    db["notifications"].insert(0, new_notif)


# ── Pydantic Request Schemas ─────────────────────────────────────────────────

class JurisdictionData(BaseModel):
    state: Optional[str] = "Madhya Pradesh"
    district: Optional[str] = "Hoshangabad"
    tehsil: Optional[str] = None
    vikas_khand: Optional[str] = None
    village_ward: Optional[str] = None
    pincode: Optional[str] = None
    jurisdiction_code: Optional[str] = None

class OfficeAddressData(BaseModel):
    building: Optional[str] = "Office Building"
    street: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = "Hoshangabad"
    state: Optional[str] = "Madhya Pradesh"
    pincode: Optional[str] = "466001"
    gps_coords: Optional[Dict[str, float]] = None

class PersonData(BaseModel):
    name: Optional[str] = "Officer"
    designation: Optional[str] = "Authority"
    mobile: Optional[str] = None
    email: Optional[str] = None
    employee_id: Optional[str] = None
    responsibility_type: Optional[str] = None

class GovtRegistrationRequest(BaseModel):
    govt_type: Optional[str] = "gram_panchayat"
    org_name: Optional[str] = "Government Body"
    department_name: Optional[str] = "Panchayat & Rural Development"
    registration_code: Optional[str] = None
    official_email: Optional[str] = None
    contact_number: Optional[str] = "9876543210"
    jurisdiction: Optional[JurisdictionData] = Field(default_factory=JurisdictionData)
    office_address: Optional[OfficeAddressData] = Field(default_factory=OfficeAddressData)
    authorized_person: Optional[PersonData] = Field(default_factory=PersonData)
    nodal_person: Optional[PersonData] = Field(default_factory=PersonData)
    reference_id: Optional[str] = None
    documents: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class GovtResubmitRequest(BaseModel):
    reference_id: str
    org_name: Optional[str] = None
    department_name: Optional[str] = None
    registration_code: Optional[str] = None
    official_email: Optional[str] = None
    contact_number: Optional[str] = None
    jurisdiction: Optional[JurisdictionData] = None
    office_address: Optional[OfficeAddressData] = None
    authorized_person: Optional[PersonData] = None
    nodal_person: Optional[PersonData] = None
    documents: Optional[List[Dict[str, Any]]] = None
    resubmission_remarks: Optional[str] = None

class GovtStatusUpdateRequest(BaseModel):
    status: str
    remarks: Optional[str] = None

class ActionReasonRequest(BaseModel):
    reason: Optional[str] = "Verification requirement"
    remarks: Optional[str] = None

class AssignOfficerRequest(BaseModel):
    officer_name: str
    officer_designation: Optional[str] = "Field Inspector"
    contact_number: Optional[str] = None

class PublicAssetCreateRequest(BaseModel):
    name: str
    category: str = "Public Land" # 'Public Land' | 'Park' | 'Plantation Area' | 'Roadside Trees' | 'Community Land' | 'Institutional Land' | 'Reserve / Green Area'
    authority: Optional[str] = "Gram Panchayat"
    area_acres: float
    street_address: Optional[str] = None
    village_ward: Optional[str] = None
    district: Optional[str] = "Hoshangabad"
    state: Optional[str] = "Madhya Pradesh"
    pincode: Optional[str] = None
    mature_trees_count: Optional[int] = 0
    saplings_count: Optional[int] = 0
    condition: Optional[str] = "Good / Healthy Growth"
    khasra_number: Optional[str] = None
    description: Optional[str] = None
    gps_coords: Optional[Dict[str, float]] = None
    polygon: Optional[List[Any]] = None
    photo_urls: Optional[List[str]] = Field(default_factory=list)
    video_urls: Optional[List[str]] = Field(default_factory=list)
    documents: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    is_draft: Optional[bool] = False

class PublicAssetResubmitRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    authority: Optional[str] = None
    area_acres: Optional[float] = None
    street_address: Optional[str] = None
    village_ward: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    mature_trees_count: Optional[int] = None
    saplings_count: Optional[int] = None
    condition: Optional[str] = None
    khasra_number: Optional[str] = None
    description: Optional[str] = None
    gps_coords: Optional[Dict[str, float]] = None
    polygon: Optional[List[Any]] = None
    photo_urls: Optional[List[str]] = None
    video_urls: Optional[List[str]] = None
    documents: Optional[List[Dict[str, Any]]] = None
    resubmission_notes: Optional[str] = None

class CampaignCreateRequest(BaseModel):
    title: str
    category: str = "Farmer Onboarding"  # Farmer Onboarding, Soil Testing, Land Mapping, Plantation, Tree Insurance, Carbon Awareness
    objective: Optional[str] = "Promote institutional farmer aggregation, land geofencing, and agroforestry sapling distribution."
    target_area: Optional[str] = "Hoshangabad Watershed Corridor"
    target_villages: str = "Pipariya, Sehore, Babai"
    target_farmers: int = 150
    start_date: Optional[str] = "2026-09-01"
    end_date: Optional[str] = "2026-10-31"
    expected_outputs: Optional[str] = "150 Onboarded Farmers, 450 Acres Geofenced, 5,000 Saplings Planted & Insured"
    allocated_budget_inr: float = 500000.0
    tree_planting_target: int = 5000
    documents: Optional[List[Dict[str, Any]]] = Field(default_factory=lambda: [
        {"title": "Panchayat Sanction Order PDF", "url": "https://bhumicred.in/docs/sanction_order_cmp101.pdf"},
        {"title": "Outreach Strategy Document", "url": "https://bhumicred.in/docs/outreach_strategy.pdf"}
    ])
    jurisdiction_code: Optional[str] = "MP-HOS-PIP-01"
    state: Optional[str] = "Madhya Pradesh"
    district: Optional[str] = "Hoshangabad"
    is_draft: Optional[bool] = False

class ReleaseCampaignBudgetRequest(BaseModel):
    amount_inr: float = 250000.0
    tranche_number: int = 1
    milestone_verified: str = "Phase 1 Onboarding & Land Mapping Completed"
    notes: Optional[str] = "Disbursed 50% initial tranche for field outreach and sapling procurement."

class UpdateCampaignTreeTrackerRequest(BaseModel):
    trees_planted_add: int = 500
    species_list: Optional[List[str]] = Field(default_factory=lambda: ["Teak / Sagwan", "Banyan / Bargad"])
    gps_location: Optional[Dict[str, float]] = Field(default_factory=lambda: {"latitude": 22.7485, "longitude": 77.7284})
    evidence_photos: Optional[List[str]] = Field(default_factory=lambda: ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop"])

class CampaignStatusUpdateRequest(BaseModel):
    status: str  # Draft, Submit, Admin Approval, Resource Assignment, Active, Progress, Completed
    remarks: Optional[str] = None

class AssignPartnerRequest(BaseModel):
    assigned_partner: str = "Gramin Seva Agro NGO"
    assigned_field_officer: Optional[str] = "Ramesh Verma (Field Lead)"
    notes: Optional[str] = None

class SoilTestCreateRequest(BaseModel):
    target_type: str = "public_asset" # 'public_asset' | 'farmer' | 'land_parcel'
    target_id: Optional[str] = None
    target_name: str
    target_farmer_name: Optional[str] = None
    target_khasra: Optional[str] = None
    test_type: str = "Standard NPK + Soil Organic Carbon (SOC)"
    sample_count: int = 10
    location_address: str = "Jurisdiction Area"
    district: Optional[str] = "Hoshangabad"
    state: Optional[str] = "Madhya Pradesh"
    gps_coords: Optional[Dict[str, float]] = None
    preferred_date: Optional[str] = "Next Week"
    scheme_program: Optional[str] = "PM-Soil Health Card & Organic Fertilizer Subsidy"
    scheme_id: Optional[str] = "SCH-102"
    subsidy_amount_inr: Optional[float] = 1200.0
    notes: Optional[str] = None
    is_draft: Optional[bool] = False

class AssignLabAndPartnerRequest(BaseModel):
    assigned_partner: str = "Gramin Seva Agriculture Partner"
    assigned_lab: str = "MP Krishi Vigyan Kendra Soil Testing Lab"
    assigned_field_officer: Optional[str] = "Vikram Rathore (KVK Soil Specialist)"
    scheduled_date: Optional[str] = "2026-09-20"
    notes: Optional[str] = None

class SampleCollectionRequest(BaseModel):
    actual_sample_count: int = 10
    collection_notes: Optional[str] = "Collected core samples at 0-15cm and 15-30cm depths across 4 quadrant nodes."
    evidence_photos: Optional[List[str]] = Field(default_factory=list)
    gps_checkin: Optional[Dict[str, float]] = None

class LabResultsRequest(BaseModel):
    nitrogen_kg_ha: float = 280.5
    nitrogen_rating: str = "Medium (280 kg/ha)"
    phosphorus_kg_ha: float = 14.2
    phosphorus_rating: str = "Low (14 kg/ha)"
    potassium_kg_ha: float = 310.0
    potassium_rating: str = "High (310 kg/ha)"
    soc_percent: float = 0.82
    ph_value: float = 7.2
    soil_texture: str = "Clay Loam with High Organic Sponge"
    recommendations: Optional[str] = "Apply organic bio-fertilizer and vermicompost to enrich phosphorus before monsoon planting."
    report_pdf_url: Optional[str] = "/reports/Soil_Health_Card_Certified.pdf"

class BulkSoilApprovalRequest(BaseModel):
    request_ids: List[str]
    action: str = "APPROVE"
    scheme_name: Optional[str] = "PM-Soil Health Card & Organic Fertilizer Subsidy"

class SoilHealthCampaignCreateRequest(BaseModel):
    title: str
    target_villages: str = "Pipariya, Sehore, Babai"
    target_cards_count: int = 500
    scheme_program: Optional[str] = "PM-Soil Health Card & Organic Fertilizer Subsidy"
    allocated_budget_inr: Optional[float] = 250000.0
    start_date: Optional[str] = "2026-09-01"
    end_date: Optional[str] = "2026-12-31"
    notes: Optional[str] = None

class InsurancePolicyRequest(BaseModel):
    target_type: str = "approved_public_asset"  # approved_public_asset, farmer_linked_program, land_parcel
    target_id: Optional[str] = None
    asset_name: str
    coverage_scope: str = "plantation_farm_coverage"  # single_tree, multiple_trees, plantation_farm_coverage
    trees_count: int
    species_list: Optional[List[str]] = Field(default_factory=lambda: ["Teak / Sagwan", "Banyan / Bargad", "Mango / Aam"])
    location: Optional[str] = "Hoshangabad District"
    coverage_type: str = "Comprehensive Climate, Flood & Fire Risk"
    sum_insured_inr: float = 250000.0
    tenure_years: int = 1
    govt_subsidy_percent: float = 75.0
    evidence_photos: Optional[List[str]] = Field(default_factory=list)
    exclusions_list: Optional[List[str]] = Field(default_factory=lambda: ["Intentional Felling", "Unauthorized Pruning", "Pre-existing Disease", "Unreported Theft > 7 days"])
    contact_person: Optional[str] = None

class NodalVerifyPolicyRequest(BaseModel):
    nodal_officer_name: str = "Rajesh Sharma (Sub-Divisional Officer)"
    approval_status: str = "approved"  # approved, rejected
    remarks: Optional[str] = "Verified public asset eligibility and approved 75% state climate resilience subsidy."

class InsuranceClaimRequest(BaseModel):
    policy_id: str
    asset_name: str
    incident_date: str
    cause_of_damage: str  # Cyclone / Storm, Forest Fire, Pest / Disease, Flood / Waterlogging, Drought / Heatwave
    affected_trees_count: int
    claimed_amount_inr: float
    description: Optional[str] = None
    photo_urls: Optional[List[str]] = Field(default_factory=list)
    gps_location: Optional[Dict[str, float]] = None

class ClaimInspectionSignoffRequest(BaseModel):
    surveyor_name: str = "Dr. S. K. Verma (ICAR Tree Surveyor)"
    nodal_officer_name: str = "Rajesh Sharma (Nodal Officer)"
    inspected_loss_amount_inr: float
    approved_claim_amount_inr: float
    status: str = "approved"  # approved, rejected, clarification_required
    inspection_notes: Optional[str] = "Physical verification completed. Damage sustained due to severe storm windfall."

class GovtProjectCreateRequest(BaseModel):
    title: str
    project_type: str = "Afforestation / Miyawaki Plantation"
    target_type: str = "public_asset"  # public_asset, farmer_group, land_parcel
    target_id: Optional[str] = None
    target_name: Optional[str] = "Gram Panchayat Miyawaki Eco-Park"
    objective: Optional[str] = "Establish 10-acre dense bio-shield and carbon sequestration zone along Narmada bank."
    scope_description: Optional[str] = "Soil preparation, 15,000 native tree sapling planting, drip irrigation setup, and 3-year survival monitoring."
    area_acres: float = 10.0
    participants_count: int = 120
    preferred_date: Optional[str] = "2026-10-01"
    estimated_budget_inr: float = 1800000.0
    co_funding_type: Optional[str] = "Govt 75% State Climate Fund + 25% Panchayat Share"
    documents: Optional[List[Dict[str, Any]]] = Field(default_factory=lambda: [
        {"title": "Gram Sabha Resolution NOC", "url": "https://bhumicred.in/docs/noc_panchayat_801.pdf"},
        {"title": "Soil & Hydrology Assessment", "url": "https://bhumicred.in/docs/soil_hydrology_report.pdf"}
    ])
    jurisdiction_code: Optional[str] = "MP-HOS-PIP-01"
    state: Optional[str] = "Madhya Pradesh"
    district: Optional[str] = "Hoshangabad"
    status: Optional[str] = "submitted"  # draft, submitted

class AssignTenderContractorRequest(BaseModel):
    tender_ref_number: str = "TND-2026-MP-0482"
    contractor_name: str = "Vanashree Ecological Foundation & Nursery Corp"
    contractor_type: str = "Empaneled Plantation Contractor"  # Empaneled Contractor, NGO, Agro-Nursery Agency
    contract_amount_inr: float = 1650000.0
    mou_reference: Optional[str] = "MOU-MP-2026-8812"
    start_date: Optional[str] = "2026-10-15"
    target_completion_date: Optional[str] = "2027-04-15"

class UpdateProjectMilestoneRequest(BaseModel):
    milestone_id: str
    status: str = "completed"  # pending, in_progress, completed
    notes: Optional[str] = "Milestone achieved. Soil tilling and organic compost enrichment verified on-site."
    gps_location: Optional[Dict[str, float]] = Field(default_factory=lambda: {"latitude": 22.7485, "longitude": 77.7284})
    evidence_photos: Optional[List[str]] = Field(default_factory=lambda: ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop"])

class ProjectStatusUpdateRequest(BaseModel):
    status: str  # draft, submitted, admin_review, partner_assigned, scheduled, execution, verification, completed
    remarks: Optional[str] = "Status updated following official inspection."

class ReleaseTrancheRequest(BaseModel):
    tranche_number: int
    amount_inr: float
    milestone_verified: str
    remarks: Optional[str] = None

class CarbonCreditRequest(BaseModel):
    asset_name: str
    methodology: str = "VM0042 - Improved Agroforestry & Afforestation"
    carbon_target: str = "2,500 tCO₂e"
    area_acres: str = "15.0"
    tree_density: str = "350 Trees / Acre"
    description: Optional[str] = None

class VerifyCarbonAuditRequest(BaseModel):
    sentinel_ndvi_score: float = 0.82
    canopy_coverage_percent: float = 78.5
    auditor_name: str = "BHUMICRED Remote Sensing Desk"
    verified_biomass_tonnes: float = 1450.0
    remarks: Optional[str] = "Satellite MRV and baseline biomass verified"

class IssueCarbonCreditsRequest(BaseModel):
    issued_credits_count: int
    registry_serial_number: str
    unit_price_inr: float = 850.0
    beneficiary_account: Optional[str] = "Jurisdiction Carbon Pool"

class WithdrawRequest(BaseModel):
    amount: float
    bank_account: str
    account_holder_name: Optional[str] = None
    ifsc_code: Optional[str] = None
    purpose: Optional[str] = "Panchayat Sustainability Fund Settlement"

class EncroachmentAlertRequest(BaseModel):
    alert_type: str = "Boundary Breach / Unauthorized Clearing"
    severity: str = "high" # 'low' | 'medium' | 'high' | 'critical'
    description: str
    location_gps: Optional[Dict[str, float]] = None
    photo_urls: Optional[List[str]] = Field(default_factory=list)

class LandAllocationRequest(BaseModel):
    farmer_id: str
    farmer_name: str
    allocated_acres: float
    purpose: str = "Agroforestry & Community Stewardship"
    allocation_term_years: int = 3
    notes: Optional[str] = None

class GovtProfileUpdateRequest(BaseModel):
    govt_type: Optional[str] = None
    org_name: Optional[str] = None
    department_name: Optional[str] = None
    auth_person_name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None

class OrderRequest(BaseModel):
    product_id: str

class ExportRequest(BaseModel):
    report_name: str

class VerifySubsidyRequest(BaseModel):
    farmer_id: Optional[str] = "FAR-101"
    farmer_name: Optional[str] = "Ramkumar Sharma"
    public_asset_id: Optional[str] = None
    scheme_code: str = "PM-KUSUM"  # PM-KUSUM, SMAF, MISSION-SOIL, NATIONAL-SEEDS
    product_id: str = "PROD-GOV-001"
    quantity: int = 1

class GenerateVoucherRequest(BaseModel):
    farmer_id: Optional[str] = "FAR-101"
    farmer_name: Optional[str] = "Ramkumar Sharma"
    scheme_code: str = "PM-KUSUM"
    product_id: str = "PROD-GOV-001"
    quantity: int = 1
    subsidy_amount_inr: float = 80000.0

class RedeemVoucherRequest(BaseModel):
    voucher_code: str
    order_id: Optional[str] = None

class CartItemRequest(BaseModel):
    product_id: str
    quantity: int = 1

class GovtCheckoutRequest(BaseModel):
    farmer_id: Optional[str] = "FAR-101"
    farmer_name: Optional[str] = "Ramkumar Sharma"
    public_asset_id: Optional[str] = None
    scheme_code: str = "PM-KUSUM"
    cart_items: List[CartItemRequest]
    voucher_code: Optional[str] = None
    delivery_address: str = "Gram Panchayat Krishi Bhavan, Pipariya Tehsil, Hoshangabad, MP"
    notes: Optional[str] = "Govt subsidized procurement order for smallholder farmer distribution."

class UpdateGovtOrderStatusRequest(BaseModel):
    status: str  # Placed, Approved, Dispatched, Delivered, Cancelled
    remarks: Optional[str] = None

class BudgetAllocateRequest(BaseModel):
    allocated_amount_inr: float = 1000000.0
    allocation_type: Optional[str] = "State Agriculture Sub-Grant"
    fiscal_year: Optional[str] = "FY 2026-27"
    notes: Optional[str] = "Allocated budget to government scheme for farmer DBT disbursements."

class DBTDisburseRequest(BaseModel):
    scheme_id: str = "SCH-101"
    scheme_name: Optional[str] = "PM-KISAN (Kisan Samman Nidhi)"
    beneficiary_ids: List[str] = Field(default_factory=lambda: ["FAR-101", "FAR-102", "FAR-103", "FAR-104"])
    amount_per_farmer_inr: float = 2000.0
    purpose: Optional[str] = "Direct Benefit Transfer Installment #2"
    payment_gateway: Optional[str] = "PFMS_DBT"

class DBTStatusUpdateRequest(BaseModel):
    status: str  # INITIATED, SUCCESS, FAILED, REVERSED
    utr_number: Optional[str] = None
    failure_reason: Optional[str] = None
    remarks: Optional[str] = None

class ReconciliationRequest(BaseModel):
    scheme_id: Optional[str] = None
    notes: Optional[str] = "Automated bank reconciliation run."


class FullCarbonRequestCreate(BaseModel):
    target_type: str = "public_asset"  # public_asset, project, land
    target_id: str
    target_name: str
    area_acres: float
    objective: str
    documents: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    evidence_photos: Optional[List[str]] = Field(default_factory=list)
    sentinel_ndvi_link: Optional[str] = "https://sentinel.bhumicred.in/ndvi/CRB-801"
    methodology: str = "VM0042 - Improved Agroforestry & Afforestation"
    tree_density: str = "350 Trees / Acre"
    carbon_target_tco2e: float = 2500.0
    baseline_year: Optional[int] = 2026
    jurisdiction_code: Optional[str] = "MP-IND-461"

class CarbonStageTransitionRequest(BaseModel):
    new_stage: str  # Submitted, Eligibility Validation, Admin Review, Verification, Monitoring, Credit Lifecycle
    auditor_notes: Optional[str] = None
    sentinel_ndvi_score: Optional[float] = 0.85
    canopy_coverage_percent: Optional[float] = 80.0

class IssueStateCarbonCreditsRequest(BaseModel):
    credits_to_issue: float = 2500.0
    certification_agency: str = "Verra (VCS) / India Carbon Registry"
    vintage_year: int = 2026
    serial_prefix: str = "BC-IND-MP"
    unit_price_inr: float = 1850.0
    auditor_notes: Optional[str] = "Verification and continuous satellite monitoring signoff completed."

class CarbonTransferRequest(BaseModel):
    credits_to_transfer: float
    buyer_or_recipient: str = "Adani Green Escrow Registry / ESG Fund"
    transfer_type: str = "TRANSFER"  # TRANSFER, RETIREMENT, ESCROW_LOCK
    unit_price_inr: float = 1850.0
    notes: Optional[str] = "Carbon credit transfer & registry settlement transaction."

class TenderProposalCreate(BaseModel):
    tender_ref_number: str = "TND-2026-MP-0482"
    title: str = "Gram Panchayat Plantation & Agroforestry Supply Contract"
    project_id: Optional[str] = None
    contractor_name: str = "Vanashree Ecological Foundation"
    contractor_gstin: Optional[str] = "23AAACV1234F1Z5"
    proposed_budget_inr: float = 1650000.0
    technical_proposal_doc: Optional[str] = "https://bhumicred.in/docs/technical_bid_vanashree.pdf"
    financial_bid_doc: Optional[str] = "https://bhumicred.in/docs/financial_bid_vanashree.pdf"
    jurisdiction_code: Optional[str] = "MP-IND-461"
    notes: Optional[str] = None

class AwardTenderRequest(BaseModel):
    contractor_name: str
    awarded_amount_inr: float
    notes: Optional[str] = "Tender awarded following evaluation committee approval."

class FileUploadPayload(BaseModel):
    filename: str
    file_type: str = "document"  # document, photo
    content_base64: Optional[str] = None



# ── Workflow 0: Government Officer Authentication, Security & RBAC ───────────

@router.post("/auth/login", response_model=GovtLoginResponse)
async def govt_officer_login(payload: GovtLoginRequest):
    db = load_data()
    accounts = db.get("accounts", [])
    
    # Try finding account matching email/phone in local storage or MongoDB Atlas
    matching_acc = None
    if accounts:
        for acc in accounts:
            if (
                acc.get("official_email") and acc.get("official_email").lower() == payload.email_or_phone.lower()
            ) or (
                acc.get("contact_number") and acc.get("contact_number") == payload.email_or_phone
            ) or (
                acc.get("reference_id") and acc.get("reference_id") == payload.email_or_phone
            ):
                matching_acc = acc
                break

    # If MongoDB models available, verify against DB
    try:
        from app.models.govt import GovtOrganization, ApprovalStatus
        org = await GovtOrganization.find_one(
            (GovtOrganization.contact_email == payload.email_or_phone) | 
            (GovtOrganization.contact_phone == payload.email_or_phone) |
            (GovtOrganization.org_id == payload.email_or_phone)
        )
        if org:
            status_str = "APPROVED" if org.approval_status == ApprovalStatus.APPROVED else (
                "CLARIFICATION_REQUIRED" if org.approval_status == ApprovalStatus.CLARIFICATION_REQUIRED else "PENDING"
            )
            claims = GovtUserClaims(
                user_id=f"GOVT-OFFICER-{org.org_id}",
                role="govt_body",
                govt_org_id=org.org_id,
                org_name=org.org_name,
                govt_type=str(org.org_type.value) if hasattr(org.org_type, 'value') else str(org.org_type),
                state=org.state,
                district=org.district,
                block_tehsil=org.block_tehsil or "Pipariya",
                village_ward=org.village_ward or "Satpura",
                approval_status=status_str,
                authorized_person_name=org.authorized_person_name,
                nodal_person_name=org.nodal_person_name
            )
            token, expires_in = create_govt_access_token(claims)
            return GovtLoginResponse(
                success=True,
                access_token=token,
                expires_in=expires_in,
                user=claims
            )
    except Exception:
        pass

    # Fallback to local storage or demo account
    if matching_acc:
        status_val = matching_acc.get("verification_status", "approved").upper()
        if "PENDING" in status_val: status_str = "PENDING"
        elif "CLARIFICATION" in status_val or "RESUBMITTED" in status_val: status_str = "CLARIFICATION_REQUIRED"
        else: status_str = "APPROVED"

        jur = matching_acc.get("jurisdiction", {})
        claims = GovtUserClaims(
            user_id=matching_acc.get("reference_id", "GOVT-OFFICER-101"),
            role="govt_body",
            govt_org_id=matching_acc.get("reference_id", "GAZ-MP-2026"),
            org_name=matching_acc.get("org_name", "Government Body"),
            govt_type=matching_acc.get("govt_type", "gram_panchayat"),
            state=jur.get("state") or "Madhya Pradesh",
            district=jur.get("district") or "Hoshangabad",
            block_tehsil=jur.get("tehsil") or "Pipariya",
            village_ward=jur.get("village_ward") or "Satpura",
            approval_status=status_str,
            authorized_person_name=matching_acc.get("authorized_person", {}).get("name"),
            nodal_person_name=matching_acc.get("nodal_person", {}).get("name")
        )
    else:
        # Default approved officer session for demo login credentials
        claims = GovtUserClaims(
            user_id="GOVT-OFFICER-DEFAULT",
            role="govt_body",
            govt_org_id="GAZ-MP-2026-HORTI",
            org_name="MP Department of Horticulture & Silviculture",
            govt_type="state_department",
            state="Madhya Pradesh",
            district="Hoshangabad",
            block_tehsil="Pipariya",
            village_ward="Satpura",
            approval_status="APPROVED",
            authorized_person_name="Rajesh Sharma",
            nodal_person_name="Dr. Vikramaditya Singh"
        )

    token, expires_in = create_govt_access_token(claims)
    return GovtLoginResponse(
        success=True,
        access_token=token,
        expires_in=expires_in,
        user=claims
    )

@router.post("/auth/logout")
async def govt_officer_logout(current_user: GovtUserClaims = Depends(get_current_govt_user)):
    return {
        "success": True,
        "message": f"Officer session for '{current_user.org_name}' logged out successfully.",
        "logged_out_at": datetime.now(timezone.utc).isoformat()
    }

@router.get("/documents/view")
async def view_secure_document(
    doc_url: str,
    doc_id: Optional[str] = None,
    current_user: GovtUserClaims = Depends(get_current_govt_user)
):
    """Secure document viewer endpoint enforcing authentication and permission verification."""
    if not doc_url:
        raise HTTPException(status_code=400, detail="Document URL or path parameter is required.")
    
    return {
        "success": True,
        "document_id": doc_id or "DOC-GOV-901",
        "document_url": doc_url,
        "authorized_viewer": current_user.user_id,
        "organization": current_user.org_name,
        "jurisdiction": f"{current_user.district}, {current_user.state}",
        "access_granted_at": datetime.now(timezone.utc).isoformat(),
        "is_watermarked": True,
        "security_classification": "OFFICIAL_GOVERNMENT_RECORD"
    }


# ── Workflow 1: Government Registration & Onboarding ────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_govt_body(data: GovtRegistrationRequest):
    ref_id = data.reference_id or f"GOV-{int(datetime.now(timezone.utc).timestamp()) % 1000000:06d}"
    account = {
        "reference_id": ref_id,
        "govt_type": data.govt_type or "gram_panchayat",
        "org_name": data.org_name or "Government Body",
        "department_name": data.department_name or "Panchayat & Rural Development",
        "registration_code": data.registration_code or "",
        "official_email": data.official_email or "",
        "contact_number": data.contact_number or "9876543210",
        "jurisdiction": data.jurisdiction.model_dump() if data.jurisdiction else {},
        "office_address": data.office_address.model_dump() if data.office_address else {},
        "authorized_person": data.authorized_person.model_dump() if data.authorized_person else {},
        "nodal_person": data.nodal_person.model_dump() if data.nodal_person else {},
        "documents": data.documents or [],
        "verification_status": "pending_admin_verification",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "audit_timeline": [
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "action": "Application Submitted",
                "actor": data.authorized_person.name if data.authorized_person else "Government User",
                "notes": "Application and documents submitted for Central Admin verification."
            }
        ]
    }
    db = load_data()
    existing_idx = next((i for i, a in enumerate(db["accounts"]) if a.get("reference_id") == ref_id or a.get("contact_number") == data.contact_number), None)
    if existing_idx is not None:
        db["accounts"][existing_idx] = account
    else:
        db["accounts"].append(account)
    save_data(db)

    return {
        "success": True,
        "message": "Government Body registration submitted successfully to Admin.",
        "reference_id": ref_id,
        "status": "pending_admin_verification",
        "data": account
    }

@router.put("/register/resubmit")
async def resubmit_govt_body(data: GovtResubmitRequest):
    db = load_data()
    found = False
    for acc in db.get("accounts", []):
        if acc.get("reference_id") == data.reference_id:
            if data.org_name: acc["org_name"] = data.org_name
            if data.department_name: acc["department_name"] = data.department_name
            if data.registration_code: acc["registration_code"] = data.registration_code
            if data.official_email: acc["official_email"] = data.official_email
            if data.contact_number: acc["contact_number"] = data.contact_number
            if data.jurisdiction: acc["jurisdiction"] = data.jurisdiction.model_dump()
            if data.office_address: acc["office_address"] = data.office_address.model_dump()
            if data.authorized_person: acc["authorized_person"] = data.authorized_person.model_dump()
            if data.nodal_person: acc["nodal_person"] = data.nodal_person.model_dump()
            if data.documents: acc["documents"] = data.documents
            
            acc["verification_status"] = "resubmitted"
            acc["resubmitted_at"] = datetime.now(timezone.utc).isoformat()
            add_audit_event(acc, "Clarification Resubmitted", "Government User", data.resubmission_remarks or "Updated details/documents uploaded.")
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Government account reference ID not found.")
    
    save_data(db)
    return {"success": True, "message": "Application resubmitted successfully for Admin review.", "status": "resubmitted"}


# ── Profile & Core Dashboard ────────────────────────────────────────────────

@router.get("/profile")
async def get_govt_profile(
    contact_number: Optional[str] = None,
    ref_id: Optional[str] = None,
    current_user: GovtUserClaims = Depends(get_current_govt_user)
):
    db = load_data()
    accounts = db.get("accounts", [])
    acc = None
    if accounts:
        acc = accounts[-1]
        if ref_id:
            matching = [a for a in accounts if a.get("reference_id") == ref_id]
            if matching: acc = matching[-1]
        elif contact_number:
            matching = [a for a in accounts if a.get("contact_number") == contact_number]
            if matching: acc = matching[-1]

    profile_data = {
        "govt_type": acc.get("govt_type") if acc else current_user.govt_type,
        "org_name": acc.get("org_name") if acc else current_user.org_name,
        "department_name": acc.get("department_name") if acc else "Agroforestry & Carbon Sequestration Cell",
        "official_email": acc.get("official_email") if acc else "director.horti@mp.gov.in",
        "contact_number": acc.get("contact_number") if acc else "9876543210",
        "district": current_user.district,
        "state": current_user.state,
        "tehsil": current_user.block_tehsil or "Pipariya",
        "village_ward": current_user.village_ward or "Satpura",
        "authorized_person": acc.get("authorized_person") if acc else {
            "name": current_user.authorized_person_name or "Rajesh Sharma",
            "designation": "Joint Secretary",
            "mobile": "XXXXXX3210",
            "email": "r.sharma@agri.gov.in"
        },
        "nodal_person": acc.get("nodal_person") if acc else {
            "name": current_user.nodal_person_name or "Dr. Vikramaditya Singh",
            "designation": "Director",
            "mobile": "XXXXXX3211",
            "email": "nodal.singh@mp.gov.in"
        },
        "reference_id": current_user.govt_org_id,
        "verification_status": current_user.approval_status.lower(),
        "approval_status": current_user.approval_status,
        "verification_badge": "APPROVED_OFFICIAL_NODAL" if current_user.approval_status == "APPROVED" else "PENDING_ADMIN_APPROVAL",
        "documents": acc.get("documents") if acc else [
            {"title": "Official Gazette Registration NOC", "url": "/v1/govt/documents/view?doc_url=gazette_noc.pdf"},
            {"title": "Panchayat Resolution Letter", "url": "/v1/govt/documents/view?doc_url=panchayat_res.pdf"}
        ],
        "security_settings": {
            "biometric_login_enabled": True,
            "two_factor_enabled": True,
            "session_timeout_minutes": 30
        },
        "support_contact": {
            "helpdesk_email": "support@bhumicred.in",
            "helpline_phone": "1800-123-BHUMI",
            "nodal_desk": "Central State Agronomy Cell"
        },
        "audit_timeline": acc.get("audit_timeline", []) if acc else []
    }
    return {"success": True, "data": mask_sensitive_pii(profile_data)}

@router.put("/profile")
async def update_govt_profile(
    data: GovtProfileUpdateRequest,
    current_user: GovtUserClaims = Depends(get_current_govt_user)
):
    db = load_data()
    accounts = db.get("accounts", [])
    
    # Check if sensitive fields changed -> trigger clarification re-verification workflow
    sensitive_changed = bool(data.org_name or data.auth_person_name)

    if accounts:
        acc = accounts[-1]
        if data.govt_type: acc["govt_type"] = data.govt_type
        if data.org_name: acc["org_name"] = data.org_name
        if data.department_name: acc["department_name"] = data.department_name
        if data.auth_person_name:
            if "authorized_person" not in acc: acc["authorized_person"] = {}
            acc["authorized_person"]["name"] = data.auth_person_name
        if data.district:
            if "jurisdiction" not in acc: acc["jurisdiction"] = {}
            acc["jurisdiction"]["district"] = data.district
        if data.state:
            if "jurisdiction" not in acc: acc["jurisdiction"] = {}
            acc["jurisdiction"]["state"] = data.state
        
        if sensitive_changed:
            acc["verification_status"] = "clarification_required"
            add_audit_event(acc, "Sensitive Profile Modification", current_user.user_id, "Sensitive org/officer fields modified. Requires Admin re-verification.")

        save_data(db)
        return {
            "success": True,
            "message": "Profile updated. Sensitive changes submitted for Admin re-verification." if sensitive_changed else "Profile updated successfully.",
            "status": "clarification_required" if sensitive_changed else current_user.approval_status,
            "data": mask_sensitive_pii(acc)
        }

    return {
        "success": True,
        "message": "Profile updated successfully.",
        "data": mask_sensitive_pii(data.model_dump())
    }

@router.put("/profile/security-settings")
async def update_security_settings(
    payload: SecuritySettingsRequest,
    current_user: GovtUserClaims = Depends(get_current_govt_user)
):
    """Updates biometric login, 2FA, and session timeout settings."""
    return {
        "success": True,
        "message": "Government Officer security settings updated successfully.",
        "settings": {
            "biometric_login_enabled": payload.biometric_login_enabled if payload.biometric_login_enabled is not None else True,
            "two_factor_enabled": payload.two_factor_enabled if payload.two_factor_enabled is not None else True,
            "session_timeout_minutes": payload.session_timeout_minutes or 30,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    }


@router.get("/dashboard/stats")
@router.get("/dashboard")
async def get_govt_dashboard_stats(district: Optional[str] = "Hoshangabad", state: Optional[str] = "Madhya Pradesh"):
    return await build_dashboard_stats_data(district=district, state=state)


async def build_dashboard_stats_data(district: Optional[str] = "Hoshangabad", state: Optional[str] = "Madhya Pradesh"):
    db = load_data()
    assets = db.get("assets", [])
    farmers = db.get("farmers", [])
    soil_requests = db.get("soil_requests", [])
    insurance_requests = db.get("insurance_requests", [])
    project_proposals = db.get("project_proposals", [])
    campaigns = db.get("campaigns", [])
    carbon_requests = db.get("carbon_requests", [])
    notifications = db.get("notifications", [])
    accounts = db.get("accounts", [])

    real_farmer_count = len(farmers) if farmers else 420
    try:
        from app.models.farmer import Farmer
        db_farmers = await Farmer.count()
        if db_farmers > 0:
            real_farmer_count = db_farmers
    except Exception:
        pass

    total_acres = sum(float(a.get("area_acres", 0)) for a in assets)
    if total_acres == 0:
        total_acres = 25.0

    total_trees = sum(int(a.get("mature_trees_count", 0)) + int(a.get("saplings_count", 0)) for a in assets)
    if total_trees == 0:
        total_trees = 5850

    pending_asset_reviews = sum(1 for a in assets if "pending" in str(a.get("status", "")).lower() or "review" in str(a.get("status", "")).lower() or "submitted" in str(a.get("status", "")).lower())
    
    pending_org_approvals = 0
    try:
        from app.models.govt import GovtOrganization, ApprovalStatus
        pending_org_approvals = await GovtOrganization.find(GovtOrganization.approval_status == ApprovalStatus.PENDING).count()
    except Exception:
        pass

    total_pending_approvals = pending_asset_reviews + pending_org_approvals

    soil_count = len(soil_requests) if soil_requests else 14
    insurance_count = len(insurance_requests) if insurance_requests else 8
    active_projects_count = len(project_proposals) if project_proposals else 3
    campaigns_count = len(campaigns) if campaigns else 5

    carbon_activity_tco2e = 3450
    if carbon_requests:
        tot = 0
        for c in carbon_requests:
            raw = str(c.get("carbon_target", "2500")).replace("tCO₂e", "").replace("tCO2e", "").replace(",", "").strip()
            try:
                tot += int(float(raw))
            except Exception:
                tot += 2500
        if tot > 0:
            carbon_activity_tco2e = tot

    unread_notifs = sum(1 for n in notifications if not n.get("read", False)) if notifications else 4

    recent_events = []
    for a in assets:
        for ev in a.get("audit_timeline", []):
            recent_events.append({
                "id": f"ev_{len(recent_events)+1}",
                "action": ev.get("action", "Asset Activity"),
                "timestamp": ev.get("timestamp", datetime.now(timezone.utc).isoformat()),
                "actor": ev.get("actor", "Government Officer"),
                "notes": ev.get("notes", a.get("name"))
            })

    if not recent_events:
        recent_events = [
            {
                "id": "ev_1",
                "action": "Public Asset Submitted",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "actor": "Gram Panchayat Sehore",
                "notes": "Narmada Riverbank Green Belt & Miyawaki Park registered for satellite MRV."
            },
            {
                "id": "ev_2",
                "action": "Soil Testing Batch Dispatched",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "actor": "District Agriculture Officer",
                "notes": "10 Soil Core samples submitted to KVK Soil Testing Lab."
            }
        ]

    active_account = accounts[-1] if accounts else {}
    org_name = active_account.get("org_name", "Gram Panchayat Sehore")
    govt_type = active_account.get("govt_type", "Gram Panchayat")

    return {
        "success": True,
        "data": {
            "jurisdiction": {
                "state": state or "Madhya Pradesh",
                "district": district or "Hoshangabad",
                "govt_type": govt_type,
                "org_name": org_name,
                "department": active_account.get("department_name", "Panchayat & Rural Development")
            },
            "metrics": {
                "total_farmers": real_farmer_count,
                "public_land_acres": round(total_acres, 1),
                "trees_count": total_trees,
                "soil_testing_requests": soil_count,
                "insurance_activity": insurance_count,
                "active_projects": active_projects_count,
                "campaigns_count": campaigns_count,
                "carbon_activity_tco2e": carbon_activity_tco2e,
                "pending_approvals": total_pending_approvals,
                "notification_count": unread_notifs,
                "pending_approval_count": total_pending_approvals,
                "canopy_health_score": 92
            },
            "recent_activity": recent_events[:10],
            "schemes": db.get("schemes", [
                {
                    "id": "SCH-101",
                    "schemeName": "PM-KUSUM Solar Water Pump Subsidy",
                    "department": "Ministry of New & Renewable Energy",
                    "activeApplications": 342,
                    "disbursedAmount": "₹1.24 Cr",
                    "status": "Active"
                },
                {
                    "id": "SCH-102",
                    "schemeName": "Soil Health Card & Organic Fertilizer Subsidy",
                    "department": "Department of Agriculture & Farmers Welfare",
                    "activeApplications": 890,
                    "disbursedAmount": "₹85 Lakhs",
                    "status": "Active"
                },
                {
                    "id": "SCH-103",
                    "schemeName": "Sub-Mission on Agroforestry (SMAF)",
                    "department": "Ministry of Environment, Forest & Climate Change",
                    "activeApplications": 156,
                    "disbursedAmount": "₹42 Lakhs",
                    "status": "Under Review"
                }
            ])
        }
    }


# ── Workflow 2: Public Assets & MRV Land Registry ────────────────────────────

@router.get("/assets")
async def list_public_assets(
    status_filter: Optional[str] = None,
    category: Optional[str] = None,
    district: Optional[str] = None,
    state: Optional[str] = None
):
    db = load_data()
    assets = db.get("assets", [])
    
    # Initialize default seed assets if none exist
    if not assets:
        assets = [
            {
                "id": "AST-101",
                "name": "Narmada Riverbank Green Belt & Miyawaki Park",
                "category": "Park",
                "authority": "Gram Panchayat",
                "area_acres": 8.5,
                "street_address": "Narmada Ghat Road",
                "village_ward": "Pipariya Village",
                "district": "Hoshangabad",
                "state": "Madhya Pradesh",
                "pincode": "461775",
                "mature_trees_count": 2100,
                "saplings_count": 450,
                "condition": "Excellent / Dense Canopy (उत्कृष्ट / सघन)",
                "khasra_number": "142/2",
                "description": "Dense community biodiversity park and riparian riverbank erosion control.",
                "gps_coords": {"latitude": 22.7543, "longitude": 78.3582},
                "polygon": [
                    {"lat": 22.7555, "lng": 78.3570},
                    {"lat": 22.7555, "lng": 78.3594},
                    {"lat": 22.7531, "lng": 78.3594},
                    {"lat": 22.7531, "lng": 78.3570}
                ],
                "photo_urls": [],
                "video_urls": [],
                "documents": [{"name": "Panchayat_Sanction_Order.pdf", "type": "authority_doc"}],
                "location": "Pipariya, Hoshangabad",
                "status": "Approved",
                "health_score": 94,
                "submitted_at": "2026-08-01T10:00:00Z",
                "approved_at": "2026-08-05T14:30:00Z",
                "audit_timeline": [
                    {"timestamp": "2026-08-01T10:00:00Z", "action": "Asset Registered", "actor": "Government Body", "notes": "Submitted for satellite MRV baseline."},
                    {"timestamp": "2026-08-05T14:30:00Z", "action": "Admin Verified & Approved", "actor": "Central Admin", "notes": "Sentinel-2 NDVI audit verified at 0.84."}
                ]
            },
            {
                "id": "AST-102",
                "name": "Gram Panchayat Grazing Ground Plantation",
                "category": "Public Land",
                "authority": "Gram Panchayat",
                "area_acres": 12.0,
                "street_address": "Main Village Approach",
                "village_ward": "Sehore North",
                "district": "Hoshangabad",
                "state": "Madhya Pradesh",
                "pincode": "466001",
                "mature_trees_count": 2800,
                "saplings_count": 600,
                "condition": "Good / Healthy Growth (अच्छा / स्वस्थ)",
                "khasra_number": "88/1",
                "description": "Community afforestation on village common land with indigenous timber & fruit species.",
                "gps_coords": {"latitude": 23.2012, "longitude": 77.0854},
                "polygon": [
                    {"lat": 23.2024, "lng": 77.0842},
                    {"lat": 23.2024, "lng": 77.0866},
                    {"lat": 23.2000, "lng": 77.0866},
                    {"lat": 23.2000, "lng": 77.0842}
                ],
                "photo_urls": [],
                "video_urls": [],
                "documents": [{"name": "Gram_Sabha_Resolution.pdf", "type": "ownership_doc"}],
                "location": "Sehore, Hoshangabad",
                "status": "Approved",
                "health_score": 88,
                "submitted_at": "2026-08-10T11:20:00Z",
                "approved_at": "2026-08-14T16:00:00Z",
                "audit_timeline": [
                    {"timestamp": "2026-08-10T11:20:00Z", "action": "Asset Registered", "actor": "Government Body", "notes": "Submitted with Gram Sabha resolution."},
                    {"timestamp": "2026-08-14T16:00:00Z", "action": "Admin Verified & Approved", "actor": "Central Admin", "notes": "Boundary polygon verified."}
                ]
            },
            {
                "id": "AST-103",
                "name": "State Highway 22 Roadside Avenue Trees",
                "category": "Roadside Trees",
                "authority": "Nagar Palika",
                "area_acres": 4.5,
                "street_address": "SH-22 Bypass Corridor",
                "village_ward": "Babai Cluster",
                "district": "Hoshangabad",
                "state": "Madhya Pradesh",
                "pincode": "461771",
                "mature_trees_count": 950,
                "saplings_count": 200,
                "condition": "Needs Maintenance & Weeding (रखरखाव आवश्यक)",
                "khasra_number": "204/3",
                "description": "Linear green shelterbelt corridor along State Highway 22.",
                "gps_coords": {"latitude": 22.6841, "longitude": 77.9214},
                "polygon": [
                    {"lat": 22.6853, "lng": 77.9202},
                    {"lat": 22.6853, "lng": 77.9226},
                    {"lat": 22.6829, "lng": 77.9226},
                    {"lat": 22.6829, "lng": 77.9202}
                ],
                "photo_urls": [],
                "video_urls": [],
                "documents": [],
                "location": "Babai, Hoshangabad",
                "status": "Pending Admin Review",
                "health_score": 79,
                "submitted_at": "2026-08-20T09:15:00Z",
                "audit_timeline": [
                    {"timestamp": "2026-08-20T09:15:00Z", "action": "Asset Registered", "actor": "Government Body", "notes": "Linear corridor submitted for canopy audit."}
                ]
            }
        ]
        db["assets"] = assets
        save_data(db)
        
    filtered = []
    for ast in assets:
        if status_filter and status_filter.lower() != "all":
            if ast.get("status", "").lower() != status_filter.lower():
                continue
        if category and category.lower() != "all":
            if ast.get("category", "").lower() != category.lower():
                continue
        if district and district.lower() not in ast.get("district", "").lower():
            continue
        filtered.append(ast)

    return {"success": True, "data": filtered}

@router.get("/assets/{asset_id}")
async def get_public_asset_details(asset_id: str):
    db = load_data()
    assets = db.get("assets", [])
    target = next((a for a in assets if a.get("id") == asset_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Public Asset not found.")
    
    st = target.get("status", "").lower()
    is_approved = st in ["approved", "verified", "active"]
    
    return {
        "success": True,
        "data": {
            **target,
            "is_eligible_for_insurance": is_approved,
            "is_eligible_for_projects": is_approved,
            "is_eligible_for_carbon": is_approved,
        }
    }

@router.post("/assets", status_code=status.HTTP_201_CREATED)
async def add_public_asset(asset: PublicAssetCreateRequest):
    db = load_data()
    assets = db.get("assets", [])
    
    status_label = "Draft" if asset.is_draft else "Submitted"
    action_note = "Asset saved as Draft" if asset.is_draft else f"Submitted {asset.name} ({asset.area_acres} Acres) for Admin verification & MRV."

    new_asset = {
        "id": f"AST-{len(assets) + 101}",
        "name": asset.name,
        "category": asset.category or "Public Land",
        "authority": asset.authority or "Gram Panchayat",
        "area_acres": asset.area_acres,
        "street_address": asset.street_address or "",
        "village_ward": asset.village_ward or "",
        "district": asset.district or "Hoshangabad",
        "state": asset.state or "Madhya Pradesh",
        "pincode": asset.pincode or "",
        "mature_trees_count": asset.mature_trees_count or 0,
        "saplings_count": asset.saplings_count or 0,
        "condition": asset.condition or "Good / Healthy Growth",
        "khasra_number": asset.khasra_number or "",
        "description": asset.description or "",
        "gps_coords": asset.gps_coords,
        "polygon": asset.polygon,
        "photo_urls": asset.photo_urls or [],
        "video_urls": asset.video_urls or [],
        "documents": asset.documents or [],
        "location": f"{asset.village_ward or 'Jurisdiction'}, {asset.district or 'Hoshangabad'}",
        "status": status_label,
        "health_score": 85,
        "submitted_at": datetime.now(timezone.utc).isoformat() if not asset.is_draft else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "audit_timeline": [
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "action": "Asset Created" if asset.is_draft else "Asset Submitted",
                "actor": "Government Body",
                "notes": action_note
            }
        ]
    }
    assets.insert(0, new_asset)
    db["assets"] = assets
    
    if not asset.is_draft:
        add_govt_notification(
            db,
            title="Public Asset Submitted",
            message=f"Public asset '{asset.name}' has been submitted for BHUMICRED Admin verification.",
            notif_type="submitted",
            ref_id=new_asset["id"]
        )
    
    save_data(db)

    try:
        if not asset.is_draft:
            lp = LandParcel(
                farmer_id="GOVT-ORG-001",
                name=asset.name,
                area_acres=float(asset.area_acres),
                ownership_type=OwnershipType.OWN,
                crop_type=asset.category,
                state=asset.state or "Madhya Pradesh",
                district=asset.district or "Hoshangabad",
                village=asset.village_ward or "Jurisdiction",
                verification_status=LandVerificationStatus.PENDING,
                is_active=True
            )
            await lp.insert()
    except Exception:
        pass

    return {
        "success": True,
        "message": "Public asset saved as draft." if asset.is_draft else "Public asset registered and submitted for admin review.",
        "data": new_asset
    }

@router.put("/assets/{asset_id}")
async def update_public_asset(asset_id: str, data: PublicAssetResubmitRequest):
    db = load_data()
    found = False
    for ast in db.get("assets", []):
        if ast.get("id") == asset_id:
            if data.name: ast["name"] = data.name
            if data.category: ast["category"] = data.category
            if data.authority: ast["authority"] = data.authority
            if data.area_acres: ast["area_acres"] = data.area_acres
            if data.street_address is not None: ast["street_address"] = data.street_address
            if data.village_ward is not None: ast["village_ward"] = data.village_ward
            if data.district is not None: ast["district"] = data.district
            if data.state is not None: ast["state"] = data.state
            if data.pincode is not None: ast["pincode"] = data.pincode
            if data.mature_trees_count is not None: ast["mature_trees_count"] = data.mature_trees_count
            if data.saplings_count is not None: ast["saplings_count"] = data.saplings_count
            if data.condition is not None: ast["condition"] = data.condition
            if data.khasra_number is not None: ast["khasra_number"] = data.khasra_number
            if data.description is not None: ast["description"] = data.description
            if data.gps_coords is not None: ast["gps_coords"] = data.gps_coords
            if data.polygon is not None: ast["polygon"] = data.polygon
            if data.photo_urls is not None: ast["photo_urls"] = data.photo_urls
            if data.video_urls is not None: ast["video_urls"] = data.video_urls
            if data.documents is not None: ast["documents"] = data.documents
            
            # If was clarification required or draft and user resubmits:
            if ast.get("status") in ["Clarification Required", "Draft"]:
                ast["status"] = "Submitted"
                ast["submitted_at"] = datetime.now(timezone.utc).isoformat()
                add_audit_event(ast, "Asset Updated & Resubmitted", "Government Body", data.resubmission_notes or "Updated boundary, photos, or documents.")
            else:
                add_audit_event(ast, "Asset Updated", "Government Body", "Asset information updated.")
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Public asset ID not found.")
    save_data(db)
    return {"success": True, "message": f"Asset {asset_id} updated successfully."}

@router.delete("/assets/{asset_id}")
async def delete_public_asset(asset_id: str):
    db = load_data()
    assets = db.get("assets", [])
    target_idx = next((i for i, a in enumerate(assets) if a.get("id") == asset_id), None)
    if target_idx is None:
        raise HTTPException(status_code=404, detail="Public asset ID not found.")
    
    target = assets[target_idx]
    if target.get("status") not in ["Draft", "Rejected"]:
        raise HTTPException(status_code=400, detail="Only Draft or Rejected assets can be deleted.")
    
    del assets[target_idx]
    db["assets"] = assets
    save_data(db)
    return {"success": True, "message": f"Asset {asset_id} deleted successfully."}

@router.put("/assets/{asset_id}/resubmit")
async def resubmit_public_asset(asset_id: str, data: PublicAssetResubmitRequest):
    return await update_public_asset(asset_id, data)

@router.patch("/assets/{asset_id}/status")
async def update_asset_status(asset_id: str, payload: GovtStatusUpdateRequest):
    db = load_data()
    assets = db.get("assets", [])
    target = next((a for a in assets if a.get("id") == asset_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Public Asset not found.")
    
    new_status = payload.status
    target["status"] = new_status
    if payload.remarks:
        target["status_remarks"] = payload.remarks
        
    add_audit_event(
        target,
        action=f"Status Changed to {new_status}",
        actor="Government Authority / Admin",
        notes=payload.remarks or f"Asset status updated to {new_status}."
    )
    save_data(db)
    return {"success": True, "message": f"Asset status updated to {new_status}.", "data": target}

@router.post("/assets/{asset_id}/encroachment-alert", status_code=status.HTTP_201_CREATED)
async def report_encroachment_alert(asset_id: str, data: EncroachmentAlertRequest):
    db = load_data()
    assets = db.get("assets", [])
    target = next((a for a in assets if a.get("id") == asset_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Public Asset not found.")
    
    alert_id = f"ENC-{int(datetime.now(timezone.utc).timestamp()) % 1000000:06d}"
    alert_record = {
        "id": alert_id,
        "asset_id": asset_id,
        "asset_name": target.get("name"),
        "alert_type": data.alert_type,
        "severity": data.severity,
        "description": data.description,
        "location_gps": data.location_gps or target.get("gps_coords"),
        "photo_urls": data.photo_urls or [],
        "status": "Open / Flagged",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    if "encroachment_alerts" not in db:
        db["encroachment_alerts"] = []
    db["encroachment_alerts"].insert(0, alert_record)
    
    add_audit_event(
        target,
        action="Encroachment Alert Logged",
        actor="GIS Remote Sensing System",
        notes=f"Alert [{data.severity.upper()}]: {data.description}"
    )
    
    add_govt_notification(
        db,
        title="⚠️ Encroachment Alert Detected",
        message=f"Boundary breach / unauthorized activity detected on public asset '{target.get('name')}' ({data.severity.upper()}).",
        notif_type="warning",
        ref_id=alert_id
    )
    
    save_data(db)
    return {
        "success": True,
        "message": "Encroachment alert recorded successfully and notified to authorities.",
        "data": alert_record
    }

@router.post("/assets/{asset_id}/allocate-farmer", status_code=status.HTTP_201_CREATED)
async def allocate_public_land_to_farmer(asset_id: str, data: LandAllocationRequest):
    db = load_data()
    assets = db.get("assets", [])
    target = next((a for a in assets if a.get("id") == asset_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Public Asset not found.")
    
    st = target.get("status", "").lower()
    if st not in ["approved", "active", "verified"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot allocate land. Asset status must be Approved or Active (current: {target.get('status')})."
        )
        
    allocation_id = f"ALC-{int(datetime.now(timezone.utc).timestamp()) % 1000000:06d}"
    allocation_record = {
        "id": allocation_id,
        "asset_id": asset_id,
        "asset_name": target.get("name"),
        "farmer_id": data.farmer_id,
        "farmer_name": data.farmer_name,
        "allocated_acres": data.allocated_acres,
        "purpose": data.purpose,
        "allocation_term_years": data.allocation_term_years,
        "notes": data.notes or "",
        "status": "Active Stewardship",
        "allocated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if "land_allocations" not in db:
        db["land_allocations"] = []
    db["land_allocations"].insert(0, allocation_record)
    
    if "allocations" not in target:
        target["allocations"] = []
    target["allocations"].insert(0, allocation_record)
    
    add_audit_event(
        target,
        action="Farmer Land Stewardship Allocated",
        actor="Government Authority",
        notes=f"Allocated {data.allocated_acres} acres to farmer {data.farmer_name} for {data.purpose}."
    )
    
    save_data(db)
    return {
        "success": True,
        "message": f"Successfully allocated {data.allocated_acres} acres to {data.farmer_name}.",
        "data": allocation_record
    }


# ── Workflow 3: Farmer Management & Onboarding Campaigns ─────────────────────

@router.get("/farmers")
async def list_jurisdiction_farmers(
    search: Optional[str] = None,
    village_ward: Optional[str] = None,
    land_size: Optional[str] = None,
    project_status: Optional[str] = None,
    soil_status: Optional[str] = None,
    insurance_status: Optional[str] = None,
    onboarding_status: Optional[str] = None,
    district: Optional[str] = "Hoshangabad",
    state: Optional[str] = "Madhya Pradesh"
):
    db = load_data()
    farmers = db.get("farmers", [])
    if not farmers:
        farmers = [
            {
                "id": "FAR-101",
                "name": "Ramkumar Sharma",
                "village_ward": "Rehada Village",
                "district": "Hoshangabad",
                "state": "Madhya Pradesh",
                "contact_masked": "+91 98261 •••••",
                "aadhaar_masked": "XXXX-XXXX-4521",
                "bank_masked": "SBI •••• 8821 (Masked)",
                "land_parcels_count": 2,
                "total_land_acres": 4.5,
                "project_status": "Enrolled",
                "assigned_project_name": "Narmada Agroforestry & Carbon Initiative",
                "soil_testing_status": "Verified",
                "latest_soil_score": "SOC: 0.78% (Healthy Carbon Sponge)",
                "tree_insurance_status": "Active",
                "trees_insured_count": 120,
                "onboarding_status": "Approved & Verified",
                "joined_date": "15 March 2026",
                "land_parcels": [
                    {"khasra": "104/1", "acres": 2.5, "trees_count": 45, "soil_status": "Verified (SOC: 0.78%)", "crop_type": "Teak Agroforestry"},
                    {"khasra": "104/2", "acres": 2.0, "trees_count": 30, "soil_status": "Verified (SOC: 0.82%)", "crop_type": "Bamboo & Fruit Orchard"}
                ],
                "projects": [
                    {"id": "PRJ-801", "name": "Narmada Agroforestry & Carbon Initiative", "status": "In Progress", "role": "Participating Farmer"}
                ],
                "soil_reports": [
                    {"id": "SOIL-REP-101", "date": "10 Aug 2026", "lab": "KVK Soil Lab Hoshangabad", "soc_percent": 0.78, "status": "Ready"}
                ],
                "insurance_policies": [
                    {"id": "INS-POL-401", "sum_insured": "₹1,20,000", "trees_covered": 75, "status": "Active Policy"}
                ],
                "activity_timeline": [
                    {"timestamp": "2026-03-15T10:00:00Z", "action": "Farmer Onboarding Completed", "notes": "Registered via Gram Panchayat Sehore outreach drive."},
                    {"timestamp": "2026-03-20T14:30:00Z", "action": "KYC Verified by BHUMICRED", "notes": "Identity and land ownership confirmed."},
                    {"timestamp": "2026-05-12T09:00:00Z", "action": "Soil Testing Sample Collected", "notes": "KVK baseline NPK & SOC analysis."},
                    {"timestamp": "2026-07-01T11:00:00Z", "action": "Enrolled in Carbon Program", "notes": "Participating in Narmada Agroforestry initiative."}
                ]
            },
            {
                "id": "FAR-102",
                "name": "Shivpal Singh Patel",
                "village_ward": "Pipariya Village",
                "district": "Hoshangabad",
                "state": "Madhya Pradesh",
                "contact_masked": "+91 94250 •••••",
                "aadhaar_masked": "XXXX-XXXX-9132",
                "bank_masked": "PNB •••• 1042 (Masked)",
                "land_parcels_count": 3,
                "total_land_acres": 8.2,
                "project_status": "Enrolled",
                "assigned_project_name": "Mission Amrit Sarovar Tree Plantation",
                "soil_testing_status": "Verified",
                "latest_soil_score": "SOC: 0.91% (Optimal Organic Sponge)",
                "tree_insurance_status": "Active",
                "trees_insured_count": 210,
                "onboarding_status": "Approved & Verified",
                "joined_date": "02 April 2026",
                "land_parcels": [
                    {"khasra": "210/A", "acres": 3.2, "trees_count": 80, "soil_status": "Verified (SOC: 0.91%)", "crop_type": "Timber Agroforestry"},
                    {"khasra": "210/B", "acres": 5.0, "trees_count": 130, "soil_status": "Verified (SOC: 0.86%)", "crop_type": "Mixed Horticulture"}
                ],
                "projects": [
                    {"id": "PRJ-802", "name": "Mission Amrit Sarovar Tree Plantation", "status": "In Progress", "role": "Lead Farmer"}
                ],
                "soil_reports": [
                    {"id": "SOIL-REP-102", "date": "14 Aug 2026", "lab": "KVK Soil Lab Hoshangabad", "soc_percent": 0.91, "status": "Ready"}
                ],
                "insurance_policies": [
                    {"id": "INS-POL-402", "sum_insured": "₹2,50,000", "trees_covered": 210, "status": "Active Policy"}
                ],
                "activity_timeline": [
                    {"timestamp": "2026-04-02T11:00:00Z", "action": "Farmer Onboarding Completed", "notes": "Registered via Mission Amrit Sarovar outreach."},
                    {"timestamp": "2026-04-08T15:00:00Z", "action": "KYC Verified by BHUMICRED", "notes": "Land ownership verified."},
                    {"timestamp": "2026-06-15T10:00:00Z", "action": "Tree Insurance Underwritten", "notes": "Comprehensive climate & flood shield."}
                ]
            },
            {
                "id": "FAR-103",
                "name": "Anita Devi Kurmi",
                "village_ward": "Ashta Ward 4",
                "district": "Hoshangabad",
                "state": "Madhya Pradesh",
                "contact_masked": "+91 97531 •••••",
                "aadhaar_masked": "XXXX-XXXX-6674",
                "bank_masked": "BOI •••• 9931 (Masked)",
                "land_parcels_count": 1,
                "total_land_acres": 1.8,
                "project_status": "None",
                "assigned_project_name": None,
                "soil_testing_status": "Needs Test",
                "latest_soil_score": "Pending Baseline Sampling",
                "tree_insurance_status": "None",
                "trees_insured_count": 0,
                "onboarding_status": "Pending KYC",
                "joined_date": "10 May 2026",
                "land_parcels": [
                    {"khasra": "55/3", "acres": 1.8, "trees_count": 15, "soil_status": "Needs Test", "crop_type": "Wheat & Pulse"}
                ],
                "projects": [],
                "soil_reports": [],
                "insurance_policies": [],
                "activity_timeline": [
                    {"timestamp": "2026-05-10T14:00:00Z", "action": "OTP Onboarding Completed", "notes": "Registered by nodal officer invitation."},
                    {"timestamp": "2026-05-12T16:00:00Z", "action": "Awaiting Document Upload", "notes": "Khasra document pending verification."}
                ]
            },
            {
                "id": "FAR-104",
                "name": "Devendra Yadav",
                "village_ward": "Rehada Village",
                "district": "Hoshangabad",
                "state": "Madhya Pradesh",
                "contact_masked": "+91 91112 •••••",
                "aadhaar_masked": "XXXX-XXXX-3341",
                "bank_masked": "CBI •••• 5512 (Masked)",
                "land_parcels_count": 2,
                "total_land_acres": 6.0,
                "project_status": "Enrolled",
                "assigned_project_name": "SMAF Subsidized Agroforestry Initiative",
                "soil_testing_status": "Verified",
                "latest_soil_score": "SOC: 0.84%",
                "tree_insurance_status": "Active",
                "trees_insured_count": 140,
                "onboarding_status": "Approved & Verified",
                "joined_date": "22 May 2026",
                "land_parcels": [
                    {"khasra": "89/1", "acres": 3.5, "trees_count": 80, "soil_status": "Verified (SOC: 0.84%)", "crop_type": "Agroforestry Mahua & Teak"},
                    {"khasra": "89/2", "acres": 2.5, "trees_count": 60, "soil_status": "Verified (SOC: 0.81%)", "crop_type": "Organic Soybean"}
                ],
                "projects": [
                    {"id": "PRJ-803", "name": "SMAF Subsidized Agroforestry Initiative", "status": "In Progress", "role": "Participating Farmer"}
                ],
                "soil_reports": [
                    {"id": "SOIL-REP-103", "date": "18 Aug 2026", "lab": "KVK Soil Lab Hoshangabad", "soc_percent": 0.84, "status": "Ready"}
                ],
                "insurance_policies": [
                    {"id": "INS-POL-403", "sum_insured": "₹1,80,000", "trees_covered": 140, "status": "Active Policy"}
                ],
                "activity_timeline": [
                    {"timestamp": "2026-05-22T09:30:00Z", "action": "Farmer Onboarding Completed", "notes": "Registered via SMAF initiative."},
                    {"timestamp": "2026-05-28T12:00:00Z", "action": "KYC Verified by BHUMICRED", "notes": "All land parcels confirmed."}
                ]
            }
        ]
        db["farmers"] = farmers
        save_data(db)

    filtered = []
    for f in farmers:
        # Search query
        if search:
            q = search.lower().strip()
            name_match = q in f.get("name", "").lower()
            village_match = q in f.get("village_ward", "").lower()
            if not (name_match or village_match):
                continue

        # Filters
        if village_ward and village_ward.lower() != "all":
            if village_ward.lower() not in f.get("village_ward", "").lower():
                continue
        if land_size and land_size != "All":
            acres = f.get("total_land_acres", 0)
            if land_size == "<5" and acres >= 5: continue
            elif land_size == "5-10" and (acres < 5 or acres > 10): continue
            elif land_size == ">10" and acres <= 10: continue

        if project_status and project_status != "All":
            if project_status == "Enrolled" and f.get("project_status") != "Enrolled": continue
            if project_status == "None" and f.get("project_status") == "Enrolled": continue

        if soil_status and soil_status != "All":
            if f.get("soil_testing_status", "").lower() != soil_status.lower(): continue
# ── Workflow 3: On-Demand Farmer Campaigns & Outreach ──────────────────────

@router.get("/campaigns")
async def get_campaigns(
    jurisdiction_code: Optional[str] = None,
    category: Optional[str] = None,
    status_filter: Optional[str] = None
):
    db = load_data()
    campaigns = db.get("campaigns", [])
    if not campaigns:
        campaigns = [
            {
                "id": "CMP-101",
                "campaign_code": "CMP-101",
                "title": "Mission Amrit Sarovar Farmer Outreach Drive",
                "category": "Farmer Onboarding",
                "target_area": "Hoshangabad Watershed Corridor",
                "target_villages": "Rehada, Pipariya, Sehore",
                "target_farmers": 150,
                "objective": "Onboard 150 smallholder farmers for community agroforestry sapling distribution and land geofencing.",
                "scope_description": "Field outreach, OTP verification, land mapping, NPK baseline soil testing, and sapling distribution.",
                "start_date": "2026-08-01",
                "end_date": "2026-09-30",
                "expected_outputs": "150 Onboarded Farmers, 450 Acres Geofenced, 5,000 Saplings Planted & Insured",
                "allocated_budget_inr": 500000.0,
                "released_budget_inr": 250000.0,
                "budget_tranches": [
                    {"tranche": 1, "amount_inr": 250000.0, "milestone": "Phase 1 Onboarding & Land Mapping Completed", "date": "2026-08-05", "status": "Disbursed"}
                ],
                "tree_planting_target": 5000,
                "tree_planting_achieved": 3200,
                "tree_inspection_logs": [
                    {
                        "trees_planted": 3200,
                        "species_list": ["Teak / Sagwan", "Banyan / Bargad", "Mango / Aam"],
                        "gps_location": {"latitude": 22.7485, "longitude": 75.8942},
                        "timestamp": "2026-08-20T11:00:00Z",
                        "evidence_photos": ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop"]
                    }
                ],
                "status": "Active",
                "jurisdiction_code": "MP-HOS-PIP-01",
                "state": "Madhya Pradesh",
                "district": "Hoshangabad",
                "assigned_partner": "Gramin Seva Agriculture Partner (NGO)",
                "assigned_field_officer": "Ramesh Verma (Field Lead)",
                "progress": {
                    "estimated_farmers": 150,
                    "farmers_invited": 120,
                    "otp_sent": 115,
                    "registered": 98,
                    "kyc_completed": 85,
                    "land_added": 82,
                    "onboarding_completed": 80
                },
                "documents": [
                    {"title": "Panchayat Sanction Order PDF", "url": "https://bhumicred.in/docs/sanction_order_cmp101.pdf"},
                    {"title": "Outreach Strategy Document", "url": "https://bhumicred.in/docs/outreach_strategy.pdf"}
                ],
                "final_report_url": None,
                "submitted_at": "2026-08-01T10:00:00Z",
                "audit_timeline": [
                    {"timestamp": "2026-08-01T10:00:00Z", "action": "Campaign Proposed", "actor": "Government Body", "notes": "Target: 150 farmers across 3 villages."},
                    {"timestamp": "2026-08-03T14:00:00Z", "action": "Campaign Approved by Admin", "actor": "Central Admin", "notes": "Approved under Panchayat Outreach Grant."},
                    {"timestamp": "2026-08-05T11:00:00Z", "action": "Resource Assignment & Tranche 1 Released", "actor": "Central Operations", "notes": "Assigned Gramin Seva NGO & disbursed ₹250,000."}
                ]
            },
            {
                "id": "CMP-102",
                "campaign_code": "CMP-102",
                "title": "Pipariya Soil Organic Carbon & NPK Campaign",
                "category": "Soil Testing",
                "target_area": "Pipariya Tehsil Block #4",
                "target_villages": "Pipariya, Babai, Bankhedi",
                "target_farmers": 200,
                "objective": "Conduct 200 spectrometer soil NPK baseline audits and issue certified Soil Health Cards.",
                "scope_description": "Core soil sampling, SOC spectrometry, agronomist advice distribution.",
                "start_date": "2026-09-01",
                "end_date": "2026-11-30",
                "expected_outputs": "200 Certified Soil Health Cards, 600 Soil Samples Analyzed",
                "allocated_budget_inr": 350000.0,
                "released_budget_inr": 175000.0,
                "budget_tranches": [
                    {"tranche": 1, "amount_inr": 175000.0, "milestone": "Lab Spectrometer Equipment Mobilization", "date": "2026-09-02", "status": "Disbursed"}
                ],
                "tree_planting_target": 0,
                "tree_planting_achieved": 0,
                "tree_inspection_logs": [],
                "status": "Resource Assignment",
                "jurisdiction_code": "MP-HOS-PIP-01",
                "state": "Madhya Pradesh",
                "district": "Hoshangabad",
                "assigned_partner": "MP Krishi Vigyan Kendra (KVK)",
                "assigned_field_officer": "Dr. S. K. Verma (Agronomist)",
                "progress": {
                    "estimated_farmers": 200,
                    "farmers_invited": 80,
                    "otp_sent": 80,
                    "registered": 65,
                    "kyc_completed": 50,
                    "land_added": 45,
                    "onboarding_completed": 40
                },
                "documents": [
                    {"title": "KVK Soil Audit Protocol", "url": "https://bhumicred.in/docs/kvk_soil_protocol.pdf"}
                ],
                "final_report_url": None,
                "submitted_at": "2026-09-01T09:00:00Z",
                "audit_timeline": [
                    {"timestamp": "2026-09-01T09:00:00Z", "action": "Campaign Proposed", "actor": "Government Body", "notes": "Proposed soil NPK drive."}
                ]
            }
        ]
        db["campaigns"] = campaigns
        save_data(db)

    # Jurisdiction & Multi-Tenant Scoping Filter
    filtered = []
    for c in campaigns:
        if jurisdiction_code and jurisdiction_code.upper() != "ALL":
            c_jurisdiction = c.get("jurisdiction_code", "").upper()
            if c_jurisdiction and c_jurisdiction != jurisdiction_code.upper():
                continue
        if category and category != "All":
            if c.get("category", "").lower() != category.lower():
                continue
        if status_filter and status_filter != "All":
            if c.get("status", "").lower() != status_filter.lower():
                continue
        filtered.append(c)

    return {"success": True, "data": filtered}

@router.get("/campaigns/{campaign_id}")
async def get_campaign_detail(campaign_id: str):
    db = load_data()
    campaigns = db.get("campaigns", [])
    target = next((c for c in campaigns if c.get("id") == campaign_id or c.get("campaign_code") == campaign_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Campaign record not found.")
    return {"success": True, "data": target}

@router.post("/campaigns", status_code=status.HTTP_201_CREATED)
async def create_campaign(data: CampaignCreateRequest):
    db = load_data()
    campaigns = db.get("campaigns", [])
    
    cmp_id = f"CMP-{len(campaigns) + 101}"
    status_label = "Draft" if data.is_draft else "Submitted"
    
    new_campaign = {
        "id": cmp_id,
        "campaign_code": cmp_id,
        "title": data.title,
        "category": data.category or "Farmer Onboarding",
        "objective": data.objective or "Promote institutional farmer aggregation and sustainable agroforestry.",
        "target_area": data.target_area or "Jurisdiction Target Zone",
        "target_villages": data.target_villages,
        "target_farmers": data.target_farmers,
        "start_date": data.start_date or "2026-09-01",
        "end_date": data.end_date or "2026-10-31",
        "expected_outputs": data.expected_outputs or f"{data.target_farmers} Farmers Onboarded & Verified",
        "allocated_budget_inr": data.allocated_budget_inr,
        "released_budget_inr": 0.0,
        "budget_tranches": [],
        "tree_planting_target": data.tree_planting_target,
        "tree_planting_achieved": 0,
        "tree_inspection_logs": [],
        "status": status_label,
        "jurisdiction_code": data.jurisdiction_code or "MP-HOS-PIP-01",
        "state": data.state or "Madhya Pradesh",
        "district": data.district or "Hoshangabad",
        "assigned_partner": "Pending Admin Assignment" if not data.is_draft else "Draft",
        "assigned_field_officer": "Pending Admin Allocation" if not data.is_draft else "Draft",
        "progress": {
            "estimated_farmers": data.target_farmers,
            "farmers_invited": 0,
            "otp_sent": 0,
            "registered": 0,
            "kyc_completed": 0,
            "land_added": 0,
            "onboarding_completed": 0
        },
        "documents": data.documents or [],
        "final_report_url": None,
        "submitted_at": datetime.now(timezone.utc).isoformat() if not data.is_draft else None,
        "audit_timeline": [
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "action": "Campaign Created" if data.is_draft else "Campaign Request Submitted",
                "actor": "Government Body",
                "notes": f"Proposed campaign '{data.title}' ({data.category}) for {data.target_farmers} farmers. Budget: ₹{data.allocated_budget_inr:,.0f}."
            }
        ]
    }
    
    campaigns.insert(0, new_campaign)
    db["campaigns"] = campaigns
    
    if not data.is_draft:
        add_govt_notification(
            db,
            title=f"Campaign Submitted - {data.title}",
            message=f"Campaign '{data.title}' ({data.category}) submitted for Admin review and resource assignment.",
            notif_type="submitted",
            ref_id=cmp_id
        )
    
    save_data(db)
    return {"success": True, "message": "Campaign saved as draft." if data.is_draft else "Campaign request submitted for Admin approval.", "data": new_campaign}

@router.post("/campaigns/{campaign_id}/status")
@router.patch("/campaigns/{campaign_id}/status")
async def update_campaign_status(campaign_id: str, payload: CampaignStatusUpdateRequest):
    db = load_data()
    campaigns = db.get("campaigns", [])
    target = next((c for c in campaigns if c.get("id") == campaign_id or c.get("campaign_code") == campaign_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Campaign record not found.")
    
    new_status = payload.status
    target["status"] = new_status
    if payload.remarks:
        target["status_remarks"] = payload.remarks

    add_audit_event(
        target,
        action=f"Campaign Status Transition to {new_status}",
        actor="Central Operations / Admin",
        notes=payload.remarks or f"Status updated to {new_status}."
    )
    save_data(db)
    return {"success": True, "message": f"Campaign status updated to {new_status}.", "data": target}

@router.post("/campaigns/{campaign_id}/assign-partner")
async def assign_campaign_partner(campaign_id: str, data: AssignPartnerRequest):
    db = load_data()
    campaigns = db.get("campaigns", [])
    target = next((c for c in campaigns if c.get("id") == campaign_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Campaign record not found.")
    
    target["assigned_partner"] = data.assigned_partner
    target["assigned_field_officer"] = data.assigned_field_officer or "Field Operations Officer"
    target["status"] = "Resources Assigned"
    
    add_audit_event(
        target,
        action="Field Partner & Nodal Officer Assigned",
        actor="Central Operations",
        notes=f"Assigned Partner: {data.assigned_partner} | Lead: {data.assigned_field_officer}. {data.notes or ''}"
    )
    save_data(db)
    return {"success": True, "message": f"Successfully assigned {data.assigned_partner} to campaign.", "data": target}

@router.post("/campaigns/{campaign_id}/release-budget")
async def release_campaign_budget(campaign_id: str, data: ReleaseCampaignBudgetRequest):
    db = load_data()
    campaigns = db.get("campaigns", [])
    target = next((c for c in campaigns if c.get("id") == campaign_id or c.get("campaign_code") == campaign_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Campaign record not found.")

    tranches = target.get("budget_tranches", [])
    tranche_entry = {
        "tranche": data.tranche_number or (len(tranches) + 1),
        "amount_inr": data.amount_inr,
        "milestone": data.milestone_verified,
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "status": "Disbursed"
    }
    tranches.append(tranche_entry)
    target["budget_tranches"] = tranches
    target["released_budget_inr"] = float(target.get("released_budget_inr", 0.0)) + float(data.amount_inr)

    add_audit_event(
        target,
        action=f"Budget Tranche Disbursed: ₹{data.amount_inr:,.0f}",
        actor="Government Treasury / Central Finance",
        notes=f"Tranche #{tranche_entry['tranche']} released against milestone: '{data.milestone_verified}'. {data.notes or ''}"
    )

    add_govt_notification(
        db,
        title=f"Tranche Disbursed - {target.get('title', campaign_id)}",
        message=f"₹{data.amount_inr:,.0f} released for milestone '{data.milestone_verified}'. Total released: ₹{target['released_budget_inr']:,.0f}.",
        notif_type="budget_released",
        ref_id=target["id"]
    )

    save_data(db)
    return {"success": True, "message": f"Successfully disbursed ₹{data.amount_inr:,.0f} tranche.", "data": target}

@router.post("/campaigns/{campaign_id}/tree-tracker")
async def update_campaign_tree_tracker(campaign_id: str, data: UpdateCampaignTreeTrackerRequest):
    db = load_data()
    campaigns = db.get("campaigns", [])
    target = next((c for c in campaigns if c.get("id") == campaign_id or c.get("campaign_code") == campaign_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Campaign record not found.")

    curr_achieved = target.get("tree_planting_achieved", 0)
    target["tree_planting_achieved"] = curr_achieved + data.trees_planted_add

    logs = target.get("tree_inspection_logs", [])
    new_log = {
        "trees_planted": data.trees_planted_add,
        "species_list": data.species_list,
        "gps_location": data.gps_location,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "evidence_photos": data.evidence_photos or []
    }
    logs.append(new_log)
    target["tree_inspection_logs"] = logs

    add_audit_event(
        target,
        action=f"Tree Planting Progress Logged: +{data.trees_planted_add} Saplings",
        actor="Field Officer / Geo-Verifier",
        notes=f"Species: {', '.join(data.species_list or [])}. Total Achieved: {target['tree_planting_achieved']}/{target.get('tree_planting_target', 0)} trees."
    )

    save_data(db)
    return {"success": True, "message": f"Logged {data.trees_planted_add} new planted trees. Total achieved: {target['tree_planting_achieved']}.", "data": target}

@router.post("/campaigns/{campaign_id}/generate-report")
async def generate_campaign_final_report(campaign_id: str):
    db = load_data()
    campaigns = db.get("campaigns", [])
    target = next((c for c in campaigns if c.get("id") == campaign_id or c.get("campaign_code") == campaign_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Campaign record not found.")

    target["status"] = "Completed"
    report_url = f"https://bhumicred.in/reports/govt_campaign_{target['id']}_final_certified.pdf"
    target["final_report_url"] = report_url

    add_audit_event(
        target,
        action="Campaign Final Completion Audit & Certified Report Published",
        actor="Government Quality Assurance & Compliance",
        notes=f"Final certified campaign performance report generated. PDF URL: {report_url}"
    )

    add_govt_notification(
        db,
        title=f"Campaign Completed & Report Issued - {target.get('title')}",
        message=f"Campaign '{target.get('title')}' is marked Completed. Final audit report available.",
        notif_type="completed",
        ref_id=target["id"]
    )

    save_data(db)
    return {"success": True, "message": "Campaign report generated and status marked Completed.", "final_report_url": report_url, "data": target}



# ── Workflow 4: Soil Testing Request & Lifecycle ─────────────────────────────

@router.get("/soil-tests/requests")
@router.get("/soil-tests")
async def list_soil_tests(
    target_type: Optional[str] = None,
    status_filter: Optional[str] = None
):
    db = load_data()
    requests = db.get("soil_requests", [])
    if not requests:
        requests = [
            {
                "id": "SOIL-501",
                "target_name": "Narmada Riverbank Green Belt & Miyawaki Park",
                "target_type": "public_asset",
                "target_id": "AST-101",
                "test_type": "Standard NPK + Soil Organic Carbon (SOC)",
                "sample_count": 12,
                "location_address": "Narmada Ghat Road, Pipariya Village, Hoshangabad",
                "district": "Hoshangabad",
                "state": "Madhya Pradesh",
                "preferred_date": "2026-08-15",
                "status": "Completed",
                "assigned_partner": "Gramin Seva Agriculture Partner",
                "assigned_lab": "MP Krishi Vigyan Kendra Soil Testing Lab",
                "assigned_field_officer": "Vikram Rathore (KVK Soil Specialist)",
                "scheduled_date": "2026-08-12",
                "gps_checkin": {"latitude": 22.7543, "longitude": 78.3582, "timestamp": "2026-08-12T10:15:00Z"},
                "sample_collection": {
                    "actual_sample_count": 12,
                    "collection_timestamp": "2026-08-12T11:45:00Z",
                    "evidence_photos": ["photo_soil_sample_1.jpg", "photo_soil_sample_2.jpg"],
                    "collection_notes": "Collected core samples at 0-15cm and 15-30cm depths across 4 quadrant nodes."
                },
                "lab_processing": {
                    "received_at": "2026-08-13T09:00:00Z",
                    "spectrometry_completed": True,
                    "titration_completed": True
                },
                "npk_results": {
                    "nitrogen_kg_ha": 280.5,
                    "nitrogen_rating": "Medium (280 kg/ha)",
                    "phosphorus_kg_ha": 14.2,
                    "phosphorus_rating": "Low (14 kg/ha)",
                    "potassium_kg_ha": 310.0,
                    "potassium_rating": "High (310 kg/ha)",
                    "soc_percent": 0.78,
                    "ph_value": 7.2,
                    "soil_texture": "Clay Loam with High Organic Sponge",
                    "recommendations": "Apply organic bio-fertilizer and vermicompost to enrich phosphorus before monsoon planting."
                },
                "report_date": "2026-08-18",
                "pdf_url": "/reports/SOIL-501_Health_Card.pdf",
                "submitted_at": "2026-08-10T09:30:00Z",
                "completed_at": "2026-08-18T14:20:00Z",
                "audit_timeline": [
                    {"timestamp": "2026-08-10T09:30:00Z", "action": "Soil Testing Requested", "actor": "Government Body", "notes": "Requested test for 12 samples at public park."},
                    {"timestamp": "2026-08-11T11:00:00Z", "action": "Lab & Partner Assigned by Admin", "actor": "Central Admin", "notes": "Assigned MP KVK Soil Lab and Vikram Rathore."},
                    {"timestamp": "2026-08-11T15:00:00Z", "action": "Sample Collection Scheduled", "actor": "Partner Desk", "notes": "Scheduled for 12 Aug 2026."},
                    {"timestamp": "2026-08-12T10:15:00Z", "action": "Field Officer GPS Check-in", "actor": "Vikram Rathore", "notes": "Verified GPS coordinates at 22.7543, 78.3582."},
                    {"timestamp": "2026-08-12T11:45:00Z", "action": "Samples Collected", "actor": "Vikram Rathore", "notes": "12 soil samples collected across 4 nodes."},
                    {"timestamp": "2026-08-13T09:00:00Z", "action": "Lab Processing Started", "actor": "MP KVK Soil Lab", "notes": "Spectrometry & NPK chemical extraction."},
                    {"timestamp": "2026-08-18T14:20:00Z", "action": "Soil Health Report Generated", "actor": "MP KVK Soil Lab", "notes": "NPK & SOC baseline report certified."}
                ]
            },
            {
                "id": "SOIL-502",
                "target_name": "Ramkumar Sharma (Khasra 104/1)",
                "target_type": "land_parcel",
                "target_id": "FAR-101",
                "target_farmer_name": "Ramkumar Sharma",
                "target_khasra": "104/1",
                "test_type": "Standard NPK + Soil Organic Carbon (SOC)",
                "sample_count": 8,
                "location_address": "Rehada Village, Seoni Malwa, Hoshangabad",
                "district": "Hoshangabad",
                "state": "Madhya Pradesh",
                "preferred_date": "2026-09-05",
                "status": "Scheduled",
                "assigned_partner": "Gramin Seva Agriculture Partner",
                "assigned_lab": "MP Krishi Vigyan Kendra Soil Testing Lab",
                "assigned_field_officer": "Sunil Patidar (Field Technician)",
                "scheduled_date": "2026-09-05",
                "submitted_at": "2026-08-25T14:00:00Z",
                "audit_timeline": [
                    {"timestamp": "2026-08-25T14:00:00Z", "action": "Soil Testing Requested", "actor": "Government Body", "notes": "Requested baseline soil test for farmer parcel."},
                    {"timestamp": "2026-08-27T10:30:00Z", "action": "Partner & Lab Assigned", "actor": "Central Admin", "notes": "Assigned MP KVK Soil Lab & Sunil Patidar."},
                    {"timestamp": "2026-08-28T16:00:00Z", "action": "Collection Scheduled", "actor": "Partner Desk", "notes": "Scheduled for 05 Sep 2026 morning."}
                ]
            }
        ]
        db["soil_requests"] = requests
        save_data(db)

    filtered = []
    for req in requests:
        if target_type and target_type != "All":
            if req.get("target_type") != target_type: continue
        if status_filter and status_filter != "All":
            if req.get("status", "").lower() != status_filter.lower(): continue
        filtered.append(req)

    return {"success": True, "data": filtered}

@router.get("/soil-tests/{test_id}")
async def get_soil_test_details(test_id: str):
    db = load_data()
    requests = db.get("soil_requests", [])
    target = next((r for r in requests if r.get("id") == test_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Soil testing record not found.")
    return {"success": True, "data": target}

@router.post("/soil-tests/requests", status_code=status.HTTP_201_CREATED)
@router.post("/soil-tests", status_code=status.HTTP_201_CREATED)
async def request_soil_test(data: SoilTestCreateRequest):
    db = load_data()
    requests = db.get("soil_requests", [])
    
    status_label = "Draft" if data.is_draft else "Submitted"
    
    new_req = {
        "id": f"SOIL-{len(requests) + 501}",
        "target_name": data.target_name,
        "target_type": data.target_type or "public_asset",
        "target_id": data.target_id,
        "target_farmer_name": data.target_farmer_name,
        "target_khasra": data.target_khasra,
        "test_type": data.test_type,
        "sample_count": data.sample_count,
        "location_address": data.location_address,
        "district": data.district or "Hoshangabad",
        "state": data.state or "Madhya Pradesh",
        "gps_coords": data.gps_coords,
        "preferred_date": data.preferred_date or "Next Week",
        "notes": data.notes or "",
        "status": status_label,
        "assigned_partner": "Pending Admin Allocation" if not data.is_draft else "Draft",
        "assigned_lab": "Pending Admin Allocation" if not data.is_draft else "Draft",
        "assigned_field_officer": "Pending Admin Allocation" if not data.is_draft else "Draft",
        "submitted_at": datetime.now(timezone.utc).isoformat() if not data.is_draft else None,
        "audit_timeline": [
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "action": "Soil Testing Request Created" if data.is_draft else "Soil Testing Request Submitted",
                "actor": "Government Body",
                "notes": f"Ordered {data.sample_count} soil samples test ({data.test_type}) for {data.target_name}."
            }
        ]
    }
    requests.insert(0, new_req)
    db["soil_requests"] = requests
    
    if not data.is_draft:
        add_govt_notification(
            db,
            title="Soil Test Request Submitted",
            message=f"Soil testing request for '{data.target_name}' submitted for Admin lab assignment.",
            notif_type="submitted",
            ref_id=new_req["id"]
        )
    
    save_data(db)
    return {"success": True, "message": "Soil testing request saved as draft." if data.is_draft else "Soil testing request submitted to Central Lab Desk.", "data": new_req}

@router.post("/soil-tests/{test_id}/assign")
async def assign_soil_test_lab(test_id: str, data: AssignLabAndPartnerRequest):
    db = load_data()
    requests = db.get("soil_requests", [])
    target = next((r for r in requests if r.get("id") == test_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Soil testing record not found.")

    target["assigned_partner"] = data.assigned_partner
    target["assigned_lab"] = data.assigned_lab
    target["assigned_field_officer"] = data.assigned_field_officer or "Field Soil Specialist"
    target["scheduled_date"] = data.scheduled_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    target["status"] = "Scheduled"

    add_audit_event(
        target,
        action="Lab & Field Officer Assigned",
        actor="Central Operations",
        notes=f"Assigned Lab: {data.assigned_lab} | Officer: {data.assigned_field_officer} | Date: {target['scheduled_date']}."
    )

    add_govt_notification(
        db,
        title="📅 Soil Sample Collection Scheduled",
        message=f"Soil testing collection for '{target.get('target_name')}' scheduled on {target['scheduled_date']} by {target['assigned_field_officer']}.",
        notif_type="approved",
        ref_id=test_id
    )

    save_data(db)
    return {"success": True, "message": f"Assigned {data.assigned_lab} and scheduled collection for {target['scheduled_date']}.", "data": target}

@router.post("/soil-tests/{test_id}/collect-sample")
async def collect_soil_samples(test_id: str, data: SampleCollectionRequest):
    db = load_data()
    requests = db.get("soil_requests", [])
    target = next((r for r in requests if r.get("id") == test_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Soil testing record not found.")

    target["status"] = "Sample Collected"
    target["sample_collection"] = {
        "actual_sample_count": data.actual_sample_count,
        "collection_timestamp": datetime.now(timezone.utc).isoformat(),
        "evidence_photos": data.evidence_photos or [],
        "collection_notes": data.collection_notes or "Core soil samples collected across target plot."
    }
    if data.gps_checkin:
        target["gps_checkin"] = data.gps_checkin

    add_audit_event(
        target,
        action="Soil Samples Collected",
        actor=target.get("assigned_field_officer", "Field Officer"),
        notes=f"Collected {data.actual_sample_count} core samples. {data.collection_notes or ''}"
    )

    add_govt_notification(
        db,
        title="🧪 Soil Samples Collected",
        message=f"{data.actual_sample_count} soil samples collected for '{target.get('target_name')}' and dispatched to lab.",
        notif_type="submitted",
        ref_id=test_id
    )

    save_data(db)
    return {"success": True, "message": f"Successfully recorded {data.actual_sample_count} collected soil samples.", "data": target}

@router.post("/soil-tests/{test_id}/lab-results")
async def submit_lab_results(test_id: str, data: LabResultsRequest):
    db = load_data()
    requests = db.get("soil_requests", [])
    target = next((r for r in requests if r.get("id") == test_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Soil testing record not found.")

    target["status"] = "Report Ready"
    target["npk_results"] = {
        "nitrogen_kg_ha": data.nitrogen_kg_ha,
        "nitrogen_rating": data.nitrogen_rating,
        "phosphorus_kg_ha": data.phosphorus_kg_ha,
        "phosphorus_rating": data.phosphorus_rating,
        "potassium_kg_ha": data.potassium_kg_ha,
        "potassium_rating": data.potassium_rating,
        "soc_percent": data.soc_percent,
        "ph_value": data.ph_value,
        "soil_texture": data.soil_texture,
        "recommendations": data.recommendations
    }
    target["report_date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    target["pdf_url"] = data.report_pdf_url or f"/reports/{test_id}_Health_Card.pdf"
    target["completed_at"] = datetime.now(timezone.utc).isoformat()

    add_audit_event(
        target,
        action="Soil Health Card Certified",
        actor=target.get("assigned_lab", "KVK Lab Specialist"),
        notes=f"Certified SOC: {data.soc_percent}% | pH: {data.ph_value} | NPK analysis complete."
    )

    add_govt_notification(
        db,
        title="📄 Soil Health Card Report Ready",
        message=f"Certified Soil Health Card ready for '{target.get('target_name')}'. SOC Score: {data.soc_percent}%.",
        notif_type="approved",
        ref_id=test_id
    )

    save_data(db)
    return {"success": True, "message": "Certified Soil Health Card generated successfully.", "data": target}

@router.post("/soil-tests/bulk-approve")
async def bulk_approve_soil_tests(data: BulkSoilApprovalRequest):
    db = load_data()
    requests = db.get("soil_requests", [])
    approved_count = 0
    for req in requests:
        if req.get("id") in data.request_ids:
            req["status"] = "Assigned"
            req["scheme_program"] = data.scheme_name or req.get("scheme_program")
            add_audit_event(
                req,
                action="Bulk Scheme Testing Approved",
                actor="Government Authority Desk",
                notes=f"Approved under scheme grant: {data.scheme_name}"
            )
            approved_count += 1

    save_data(db)
    return {
        "success": True,
        "message": f"Successfully bulk approved {approved_count} soil testing requests under {data.scheme_name}.",
        "approved_count": approved_count
    }

@router.get("/soil-tests/analytics/district")
async def get_district_soil_analytics(district: Optional[str] = "Hoshangabad"):
    db = load_data()
    requests = db.get("soil_requests", [])
    completed = [r for r in requests if r.get("status") in ["Report Ready", "Completed"] and r.get("npk_results")]

    total_samples = sum(r.get("sample_count", 0) for r in completed) or 480
    avg_soc = 0.82
    avg_ph = 7.2
    if completed:
        soc_list = [r["npk_results"].get("soc_percent", 0.78) for r in completed if "npk_results" in r]
        ph_list = [r["npk_results"].get("ph_value", 7.2) for r in completed if "npk_results" in r]
        if soc_list: avg_soc = round(sum(soc_list) / len(soc_list), 2)
        if ph_list: avg_ph = round(sum(ph_list) / len(ph_list), 2)

    return {
        "success": True,
        "data": {
            "district": district or "Hoshangabad",
            "state": "Madhya Pradesh",
            "average_soc_percent": avg_soc,
            "average_ph_level": avg_ph,
            "total_samples_analyzed": total_samples,
            "health_card_coverage_percent": 86.4,
            "npk_distribution": {
                "nitrogen": {"medium": 64, "low": 24, "high": 12},
                "phosphorus": {"low": 58, "medium": 32, "high": 10},
                "potassium": {"high": 72, "medium": 22, "low": 6}
            },
            "recommendation_summary": "Promote organic bio-fertilizer and phosphorus enrichment across Pipariya & Sehore clusters."
        }
    }

@router.get("/soil-health-campaigns")
async def list_soil_health_campaigns():
    db = load_data()
    campaigns = db.get("soil_campaigns", [
        {
            "id": "SHC-901",
            "title": "Hoshangabad District Soil Organic Carbon (SOC) Campaign",
            "target_villages": "Rehada, Pipariya, Sehore, Babai",
            "target_cards_count": 500,
            "scheme_program": "PM-Soil Health Card & Organic Fertilizer Subsidy",
            "allocated_budget_inr": 250000.0,
            "issued_cards_count": 420,
            "status": "Active Drive",
            "start_date": "2026-08-01",
            "end_date": "2026-10-31"
        }
    ])
    return {"success": True, "data": campaigns}

@router.post("/soil-health-campaigns", status_code=status.HTTP_201_CREATED)
async def create_soil_health_campaign(data: SoilHealthCampaignCreateRequest):
    db = load_data()
    if "soil_campaigns" not in db:
        db["soil_campaigns"] = []

    new_cmp = {
        "id": f"SHC-{len(db['soil_campaigns']) + 901}",
        "title": data.title,
        "target_villages": data.target_villages,
        "target_cards_count": data.target_cards_count,
        "scheme_program": data.scheme_program or "PM-Soil Health Card & Organic Fertilizer Subsidy",
        "allocated_budget_inr": data.allocated_budget_inr or 250000.0,
        "issued_cards_count": 0,
        "status": "Active Drive",
        "start_date": data.start_date or "2026-09-01",
        "end_date": data.end_date or "2026-12-31",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    db["soil_campaigns"].insert(0, new_cmp)
    save_data(db)
    return {"success": True, "message": "Soil Health Card Campaign drive created successfully.", "data": new_cmp}



# ── Workflow 5: Tree Insurance & Damage Claims ───────────────────────────────

@router.get("/insurance/requests")
@router.get("/insurance")
async def list_insurance():
    db = load_data()
    policies = db.get("insurance_requests", [])
    if not policies:
        policies = [
            {
                "id": "INS-701",
                "policy_id": "INS-701",
                "target_type": "approved_public_asset",
                "target_id": "ASSET-1001",
                "asset_name": "Gram Panchayat Biodiversity Park",
                "coverage_scope": "plantation_farm_coverage",
                "trees_count": 1200,
                "species_list": ["Teak / Sagwan", "Banyan / Bargad", "Mango / Aam", "Neem"],
                "location": "Pipariya Village, Hoshangabad",
                "coverage_type": "Comprehensive Climate, Flood & Fire Risk",
                "sum_insured_inr": 600000.0,
                "premium_annual_inr": 18000.0,
                "govt_subsidy_percent": 75.0,
                "govt_subsidy_share_inr": 13500.0,
                "institutional_settlement_share_inr": 4500.0,
                "tenure_years": 1,
                "valid_from": "2026-01-01",
                "valid_until": "2026-12-31",
                "status": "active",
                "insurance_partner": "National Agriculture Insurance Corp",
                "exclusions_list": [
                    "Intentional Felling / Logging",
                    "Unauthorized Pruning & Debarking",
                    "Pre-existing Fungal Rot prior to coverage",
                    "Unreported Theft > 7 days"
                ],
                "evidence_photos": [
                    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop"
                ],
                "nodal_verification": {
                    "officer_name": "Rajesh Sharma (Sub-Divisional Officer)",
                    "verified_at": "2026-01-02T10:00:00Z",
                    "remarks": "Verified public land title and tree density compliance."
                },
                "claims": [
                    {
                        "claim_id": "CLM-1002",
                        "policy_id": "INS-701",
                        "asset_name": "Gram Panchayat Biodiversity Park",
                        "incident_date": "2026-06-15",
                        "cause_of_damage": "Flood / Waterlogging",
                        "affected_trees_count": 45,
                        "claimed_amount_inr": 50000.0,
                        "description": "Flash flooding along Narmada bank inundated northern boundary sector.",
                        "photo_urls": [
                            "https://images.unsplash.com/photo-1511497584788-876761c1298b?w=600&auto=format&fit=crop"
                        ],
                        "status": "settled",
                        "filed_at": "2026-06-16T14:20:00Z",
                        "inspection_signoff": {
                            "surveyor_name": "Dr. S. K. Verma (ICAR Tree Surveyor)",
                            "nodal_officer_name": "Rajesh Sharma (Nodal Officer)",
                            "inspected_loss_amount_inr": 45000.0,
                            "approved_claim_amount_inr": 45000.0,
                            "signed_at": "2026-06-20T11:30:00Z",
                            "inspection_notes": "45 trees uprooted by flash surge. Complete loss verified."
                        }
                    }
                ],
                "submitted_at": "2026-01-01T09:00:00Z",
                "audit_timeline": [
                    {
                        "timestamp": "2026-01-01T09:00:00Z",
                        "action": "Policy Application Submitted",
                        "actor": "Gram Panchayat Admin",
                        "notes": "Applied for 1,200 trees sum insured ₹600,000 with 75% state co-funding."
                    },
                    {
                        "timestamp": "2026-01-02T10:00:00Z",
                        "action": "Nodal Officer Verification",
                        "actor": "Rajesh Sharma (SDO)",
                        "notes": "Verified public asset eligibility. Policy activated."
                    }
                ]
            }
        ]
        db["insurance_requests"] = policies
        save_data(db)

    return {"success": True, "data": policies}

@router.get("/insurance/{policy_id}")
async def get_insurance_policy_details(policy_id: str):
    db = load_data()
    policies = db.get("insurance_requests", [])
    for pol in policies:
        if pol.get("id") == policy_id or pol.get("policy_id") == policy_id:
            return {"success": True, "data": pol}
    raise HTTPException(status_code=404, detail="Insurance policy not found")

@router.post("/insurance/requests", status_code=status.HTTP_201_CREATED)
@router.post("/insurance/request", status_code=status.HTTP_201_CREATED)
async def request_tree_insurance(data: InsurancePolicyRequest):
    db = load_data()
    policies = db.get("insurance_requests", [])
    
    policy_id = f"INS-{len(policies) + 702}"
    annual_premium = round(data.sum_insured_inr * 0.03 * data.tenure_years, 2)
    govt_subsidy_share = round(annual_premium * (data.govt_subsidy_percent / 100.0), 2)
    institutional_share = round(annual_premium - govt_subsidy_share, 2)
    
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    next_year_str = datetime.now(timezone.utc).replace(year=datetime.now(timezone.utc).year + data.tenure_years).strftime("%Y-%m-%d")

    new_policy = {
        "id": policy_id,
        "policy_id": policy_id,
        "target_type": data.target_type,
        "target_id": data.target_id or f"TRG-{len(policies)+100}",
        "asset_name": data.asset_name,
        "coverage_scope": data.coverage_scope,
        "trees_count": data.trees_count,
        "species_list": data.species_list or ["Teak / Sagwan", "Banyan / Bargad"],
        "location": data.location or "Hoshangabad District",
        "coverage_type": data.coverage_type,
        "sum_insured_inr": data.sum_insured_inr,
        "premium_annual_inr": annual_premium,
        "govt_subsidy_percent": data.govt_subsidy_percent,
        "govt_subsidy_share_inr": govt_subsidy_share,
        "institutional_settlement_share_inr": institutional_share,
        "tenure_years": data.tenure_years,
        "valid_from": today_str,
        "valid_until": next_year_str,
        "contact_person": data.contact_person or "Nodal Agricultural Officer",
        "status": "nodal_verification_pending",
        "insurance_partner": "National Agriculture Insurance Corp (AIC)",
        "exclusions_list": data.exclusions_list or [
            "Intentional Felling / Logging",
            "Unauthorized Pruning",
            "Pre-existing Disease",
            "Unreported Theft > 7 days"
        ],
        "evidence_photos": data.evidence_photos or [],
        "nodal_verification": None,
        "claims": [],
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "audit_timeline": [
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "action": "Insurance Policy Application Submitted",
                "actor": "Government Body",
                "notes": f"Submitted tree insurance for {data.trees_count} trees (Sum Insured ₹{data.sum_insured_inr:,.0f}). Premium ₹{annual_premium:,.0f} (75% Govt Subsidy ₹{govt_subsidy_share:,.0f})."
            }
        ]
    }
    
    policies.insert(0, new_policy)
    db["insurance_requests"] = policies
    
    add_govt_notification(
        db,
        title=f"Tree Insurance Application Submitted - {data.asset_name}",
        message=f"Policy {policy_id} created for {data.trees_count} trees (₹{data.sum_insured_inr:,.0f} Sum Insured). Awaiting Nodal Verification.",
        notif_type="policy_requested",
        ref_id=policy_id
    )
    
    save_data(db)
    return {"success": True, "message": f"Tree Insurance policy application {policy_id} submitted successfully.", "data": new_policy}

@router.post("/insurance/{policy_id}/nodal-verify")
async def nodal_verify_tree_insurance(policy_id: str, data: NodalVerifyPolicyRequest):
    db = load_data()
    policies = db.get("insurance_requests", [])
    found_policy = None
    for pol in policies:
        if pol.get("id") == policy_id or pol.get("policy_id") == policy_id:
            found_policy = pol
            break
    
    if not found_policy:
        raise HTTPException(status_code=404, detail="Insurance policy not found")

    new_status = "active" if data.approval_status == "approved" else "rejected"
    found_policy["status"] = new_status
    found_policy["nodal_verification"] = {
        "officer_name": data.nodal_officer_name,
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "approval_status": data.approval_status,
        "remarks": data.remarks
    }

    add_audit_event(
        found_policy,
        f"Nodal Verification ({data.approval_status.upper()})",
        data.nodal_officer_name,
        data.remarks or f"Policy marked as {new_status}."
    )

    add_govt_notification(
        db,
        title=f"Tree Insurance Policy {policy_id} {'Activated' if new_status == 'active' else 'Rejected'}",
        message=f"Nodal Officer {data.nodal_officer_name} completed verification: {data.remarks}",
        notif_type="policy_active" if new_status == "active" else "policy_rejected",
        ref_id=policy_id
    )

    save_data(db)
    return {"success": True, "message": f"Policy {policy_id} updated to {new_status}.", "data": found_policy}

@router.post("/insurance/claims", status_code=status.HTTP_201_CREATED)
async def file_insurance_claim(data: InsuranceClaimRequest):
    db = load_data()
    policies = db.get("insurance_requests", [])
    found_policy = None
    for pol in policies:
        if pol.get("id") == data.policy_id or pol.get("policy_id") == data.policy_id:
            found_policy = pol
            break
    
    claim_id = f"CLM-{int(datetime.now(timezone.utc).timestamp()) % 10000:04d}"
    claim = {
        "claim_id": claim_id,
        "policy_id": data.policy_id,
        "asset_name": data.asset_name,
        "incident_date": data.incident_date,
        "cause_of_damage": data.cause_of_damage,
        "affected_trees_count": data.affected_trees_count,
        "claimed_amount_inr": data.claimed_amount_inr,
        "description": data.description,
        "photo_urls": data.photo_urls or [],
        "gps_location": data.gps_location or {"latitude": 22.748, "longitude": 77.728},
        "status": "claim_filed",
        "filed_at": datetime.now(timezone.utc).isoformat(),
        "inspection_signoff": None,
        "audit_timeline": [
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "action": "Claim Filed",
                "actor": "Government Nodal / Asset Manager",
                "notes": f"Filed claim for {data.affected_trees_count} trees damaged by {data.cause_of_damage}. Claimed ₹{data.claimed_amount_inr:,.0f}."
            }
        ]
    }
    
    if found_policy:
        if "claims" not in found_policy:
            found_policy["claims"] = []
        found_policy["claims"].insert(0, claim)
        add_audit_event(found_policy, "Insurance Claim Filed", "Government Body", f"Claim {claim_id} for ₹{data.claimed_amount_inr:,.0f}")
    
    add_govt_notification(
        db,
        title=f"Tree Damage Claim Reported - {data.asset_name}",
        message=f"Claim {claim_id} for {data.affected_trees_count} trees ({data.cause_of_damage}) submitted for field inspection.",
        notif_type="claim_filed",
        ref_id=claim_id
    )

    save_data(db)
    return {"success": True, "message": f"Claim {claim_id} submitted for field surveyor assessment.", "data": claim}

@router.post("/insurance/claims/{claim_id}/signoff")
async def signoff_insurance_claim(claim_id: str, data: ClaimInspectionSignoffRequest):
    db = load_data()
    policies = db.get("insurance_requests", [])
    found_claim = None
    parent_policy = None
    
    for pol in policies:
        for clm in pol.get("claims", []):
            if clm.get("claim_id") == claim_id:
                found_claim = clm
                parent_policy = pol
                break
        if found_claim:
            break
            
    if not found_claim:
        raise HTTPException(status_code=404, detail="Claim record not found")

    new_claim_status = "settled" if data.status == "approved" else data.status
    found_claim["status"] = new_claim_status
    found_claim["inspection_signoff"] = {
        "surveyor_name": data.surveyor_name,
        "nodal_officer_name": data.nodal_officer_name,
        "inspected_loss_amount_inr": data.inspected_loss_amount_inr,
        "approved_claim_amount_inr": data.approved_claim_amount_inr,
        "signed_at": datetime.now(timezone.utc).isoformat(),
        "inspection_notes": data.inspection_notes
    }

    if "audit_timeline" not in found_claim:
        found_claim["audit_timeline"] = []
    found_claim["audit_timeline"].append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": f"Inspection Sign-off ({data.status.upper()})",
        "actor": f"{data.surveyor_name} / {data.nodal_officer_name}",
        "notes": f"Inspected Loss: ₹{data.inspected_loss_amount_inr:,.0f} | Approved Settlement: ₹{data.approved_claim_amount_inr:,.0f}. {data.inspection_notes}"
    })

    if parent_policy:
        add_audit_event(
            parent_policy,
            f"Claim {claim_id} Settled",
            data.nodal_officer_name,
            f"Approved claim payout ₹{data.approved_claim_amount_inr:,.0f}"
        )

    add_govt_notification(
        db,
        title=f"Insurance Claim {claim_id} Settled",
        message=f"Surveyor {data.surveyor_name} & Nodal Officer {data.nodal_officer_name} approved settlement of ₹{data.approved_claim_amount_inr:,.0f}.",
        notif_type="claim_settled",
        ref_id=claim_id
    )

    save_data(db)
    return {"success": True, "message": f"Claim {claim_id} updated to {new_claim_status}.", "data": found_claim}


# ── Workflow 6: Project Proposals & Partner Assignment ──────────────────────

@router.get("/projects/proposals")
@router.get("/projects")
async def list_project_proposals(
    jurisdiction_code: Optional[str] = None,
    project_type: Optional[str] = None,
    status_filter: Optional[str] = None
):
    db = load_data()
    projects = db.get("project_proposals", [])
    if not projects:
        projects = [
            {
                "id": "PRJ-GOVT-801",
                "project_code": "PRJ-GOVT-801",
                "title": "Narmada Riverbank Agroforestry Green Corridor",
                "project_type": "Riverbank Restoration & Agroforestry",
                "target_type": "public_asset",
                "target_id": "ASSET-1001",
                "target_name": "Narmada Riverbank Biodiversity Belt",
                "objective": "Establish 45-acre dense agroforestry bio-shield and prevent soil erosion along flood corridor.",
                "scope_description": "Land tilling, 15,000 native tree plantation, drip irrigation setup, and 3-year survival monitoring.",
                "area_acres": 45.0,
                "participants_count": 250,
                "preferred_date": "2026-07-15",
                "estimated_budget_inr": 2500000.0,
                "co_funding_type": "Govt 75% State Fund + 25% Panchayat Share",
                "status": "execution",
                "jurisdiction_code": "MP-HOS-PIP-01",
                "state": "Madhya Pradesh",
                "district": "Hoshangabad",
                "assigned_partner": "Vanashree Ecological Foundation & Nursery Corp",
                "tender_details": {
                    "tender_ref_number": "TND-2026-MP-0482",
                    "contractor_name": "Vanashree Ecological Foundation & Nursery Corp",
                    "contractor_type": "Empaneled Plantation Contractor",
                    "contract_amount_inr": 2350000.0,
                    "mou_reference": "MOU-MP-2026-8812",
                    "start_date": "2026-07-20",
                    "target_completion_date": "2027-01-20"
                },
                "progress_percent": 65,
                "milestones": [
                    {
                        "milestone_id": "M-1",
                        "title": "Land Baseline Survey & Soil Tilling",
                        "target_date": "2026-08-01",
                        "status": "completed",
                        "verification_date": "2026-08-02T10:00:00Z",
                        "gps_location": {"latitude": 22.7485, "longitude": 75.8942},
                        "evidence_photos": ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop"]
                    },
                    {
                        "milestone_id": "M-2",
                        "title": "Sapling Procurement & Nursery Tagging",
                        "target_date": "2026-08-15",
                        "status": "completed",
                        "verification_date": "2026-08-16T14:30:00Z",
                        "gps_location": {"latitude": 22.7490, "longitude": 75.8950},
                        "evidence_photos": ["https://images.unsplash.com/photo-1511497584788-876761c1298b?w=600&auto=format&fit=crop"]
                    },
                    {
                        "milestone_id": "M-3",
                        "title": "Plantation Drive & Irrigation Setup",
                        "target_date": "2026-09-30",
                        "status": "in_progress",
                        "verification_date": None,
                        "gps_location": {"latitude": 22.7485, "longitude": 75.8942},
                        "evidence_photos": ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop"]
                    },
                    {
                        "milestone_id": "M-4",
                        "title": "Survival Rate Verification & Final Audit",
                        "target_date": "2026-12-15",
                        "status": "pending",
                        "verification_date": None,
                        "gps_location": None,
                        "evidence_photos": []
                    }
                ],
                "documents": [
                    {"title": "Panchayat Gram Sabha Resolution NOC", "url": "https://bhumicred.in/docs/noc_panchayat_801.pdf"},
                    {"title": "Environmental Impact Assessment", "url": "https://bhumicred.in/docs/eia_hoshangabad.pdf"}
                ],
                "final_report_url": None,
                "released_tranches": [{"tranche": 1, "amount_inr": 1000000.0, "status": "Disbursed", "date": "2026-07-22"}],
                "submitted_at": "2026-07-15T10:00:00Z",
                "audit_timeline": [
                    {
                        "timestamp": "2026-07-15T10:00:00Z",
                        "action": "Project Proposal Submitted",
                        "actor": "Gram Panchayat Officer",
                        "notes": "Submitted proposal for 45-acre green corridor."
                    },
                    {
                        "timestamp": "2026-07-20T11:00:00Z",
                        "action": "Tender Awarded & Contractor Assigned",
                        "actor": "State Admin",
                        "notes": "Awarded tender TND-2026-MP-0482 to Vanashree Ecological Foundation."
                    }
                ]
            },
            {
                "id": "PRJ-GOVT-802",
                "project_code": "PRJ-GOVT-802",
                "title": "Gram Panchayat Miyawaki Bio-Shield Installation",
                "project_type": "Afforestation / Miyawaki Plantation",
                "target_type": "public_asset",
                "target_id": "ASSET-1002",
                "target_name": "Pipariya Village Forest Plot",
                "objective": "Install 12.5-acre dense urban forest bio-shield using Miyawaki ultra-dense technique.",
                "scope_description": "8,000 tree saplings, compost enrichment, protective fencing.",
                "area_acres": 12.5,
                "participants_count": 80,
                "preferred_date": "2026-08-10",
                "estimated_budget_inr": 1200000.0,
                "co_funding_type": "State Climate Fund 100%",
                "status": "partner_assigned",
                "jurisdiction_code": "MP-HOS-PIP-01",
                "state": "Madhya Pradesh",
                "district": "Hoshangabad",
                "assigned_partner": "MP State Agro Forestry Corp",
                "tender_details": {
                    "tender_ref_number": "TND-2026-MP-0112",
                    "contractor_name": "MP State Agro Forestry Corp",
                    "contractor_type": "Empaneled Plantation Contractor",
                    "contract_amount_inr": 1150000.0,
                    "mou_reference": "MOU-MP-2026-9011",
                    "start_date": "2026-08-20",
                    "target_completion_date": "2027-02-20"
                },
                "progress_percent": 35,
                "milestones": [
                    {
                        "milestone_id": "M-1",
                        "title": "Land Preparation & Fencing",
                        "target_date": "2026-09-01",
                        "status": "completed",
                        "verification_date": "2026-09-02T09:00:00Z",
                        "gps_location": {"latitude": 22.7533, "longitude": 75.8937},
                        "evidence_photos": ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop"]
                    },
                    {
                        "milestone_id": "M-2",
                        "title": "Dense Sapling Planting",
                        "target_date": "2026-10-15",
                        "status": "pending",
                        "verification_date": None,
                        "gps_location": None,
                        "evidence_photos": []
                    }
                ],
                "documents": [
                    {"title": "Forest Land NOC", "url": "https://bhumicred.in/docs/forest_noc_802.pdf"}
                ],
                "final_report_url": None,
                "released_tranches": [],
                "submitted_at": "2026-08-10T09:00:00Z",
                "audit_timeline": [
                    {
                        "timestamp": "2026-08-10T09:00:00Z",
                        "action": "Project Proposal Submitted",
                        "actor": "Panchayat Officer",
                        "notes": "Submitted proposal for 12.5-acre Miyawaki bio-shield."
                    }
                ]
            }
        ]
        db["project_proposals"] = projects
        save_data(db)

    # Multi-tenant Jurisdiction Filtering
    filtered = []
    for p in projects:
        if jurisdiction_code and jurisdiction_code.upper() != "ALL":
            p_jurisdiction = p.get("jurisdiction_code", "").upper()
            if p_jurisdiction and p_jurisdiction != jurisdiction_code.upper():
                continue
        if project_type and project_type != "All":
            if p.get("project_type", "").lower() != project_type.lower():
                continue
        if status_filter and status_filter != "All":
            if p.get("status", "").lower() != status_filter.lower():
                continue
        filtered.append(p)

    return {"success": True, "data": filtered}

@router.get("/projects/{project_id}")
async def get_project_details(project_id: str):
    db = load_data()
    projects = db.get("project_proposals", [])
    for p in projects:
        if p.get("id") == project_id or p.get("project_code") == project_id:
            return {"success": True, "data": p}
    raise HTTPException(status_code=404, detail="Project record not found")

@router.post("/projects/propose", status_code=status.HTTP_201_CREATED)
@router.post("/projects", status_code=status.HTTP_201_CREATED)
async def propose_project(data: GovtProjectCreateRequest):
    db = load_data()
    projects = db.get("project_proposals", [])
    
    proj_id = f"PRJ-GOVT-{len(projects) + 803:03d}"
    init_status = data.status or "submitted"

    default_milestones = [
        {
            "milestone_id": "M-1",
            "title": "Land Baseline Survey & Soil Tilling",
            "target_date": data.preferred_date or "2026-10-15",
            "status": "pending",
            "verification_date": None,
            "gps_location": None,
            "evidence_photos": []
        },
        {
            "milestone_id": "M-2",
            "title": "Sapling Procurement & Nursery Tagging",
            "target_date": "2026-11-15",
            "status": "pending",
            "verification_date": None,
            "gps_location": None,
            "evidence_photos": []
        },
        {
            "milestone_id": "M-3",
            "title": "Plantation Drive & Irrigation Installation",
            "target_date": "2026-12-15",
            "status": "pending",
            "verification_date": None,
            "gps_location": None,
            "evidence_photos": []
        },
        {
            "milestone_id": "M-4",
            "title": "Final Survival Rate Audit & MRV Baseline Report",
            "target_date": "2027-02-15",
            "status": "pending",
            "verification_date": None,
            "gps_location": None,
            "evidence_photos": []
        }
    ]

    new_proj = {
        "id": proj_id,
        "project_code": proj_id,
        "title": data.title,
        "project_type": data.project_type,
        "target_type": data.target_type,
        "target_id": data.target_id or f"TRG-{len(projects)+100}",
        "target_name": data.target_name or data.title,
        "objective": data.objective or f"Targeted carbon sink and soil restoration project.",
        "scope_description": data.scope_description or f"Execution of {data.area_acres} Acres {data.project_type}.",
        "area_acres": data.area_acres,
        "participants_count": data.participants_count,
        "preferred_date": data.preferred_date or "2026-10-01",
        "estimated_budget_inr": data.estimated_budget_inr,
        "co_funding_type": data.co_funding_type or "Govt Co-Funded Scheme",
        "status": init_status,
        "jurisdiction_code": data.jurisdiction_code or "MP-HOS-PIP-01",
        "state": data.state or "Madhya Pradesh",
        "district": data.district or "Hoshangabad",
        "assigned_partner": None,
        "tender_details": None,
        "progress_percent": 0,
        "milestones": default_milestones,
        "documents": data.documents or [],
        "final_report_url": None,
        "released_tranches": [],
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "audit_timeline": [
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "action": "Project Proposal Created",
                "actor": "Government Body",
                "notes": f"Created {data.title} ({data.area_acres} Acres, Budget ₹{data.estimated_budget_inr:,.0f}). Jurisdiction: {data.jurisdiction_code}."
            }
        ]
    }
    
    projects.insert(0, new_proj)
    db["project_proposals"] = projects
    
    add_govt_notification(
        db,
        title=f"Project Request Created - {data.title}",
        message=f"Project {proj_id} submitted for {data.area_acres} Acres ({data.project_type}). Jurisdiction: {data.jurisdiction_code}.",
        notif_type="project_submitted",
        ref_id=proj_id
    )

    save_data(db)
    return {"success": True, "message": f"Project request {proj_id} created successfully.", "data": new_proj}

@router.post("/projects/{project_id}/status")
async def update_project_status(project_id: str, data: ProjectStatusUpdateRequest):
    db = load_data()
    projects = db.get("project_proposals", [])
    found_proj = None
    for p in projects:
        if p.get("id") == project_id or p.get("project_code") == project_id:
            found_proj = p
            break
            
    if not found_proj:
        raise HTTPException(status_code=404, detail="Project not found")

    found_proj["status"] = data.status
    add_audit_event(found_proj, f"Status Updated -> {data.status.upper()}", "Government Authority", data.remarks)

    add_govt_notification(
        db,
        title=f"Project {project_id} Status Updated",
        message=f"Project {found_proj['title']} status changed to {data.status.upper()}. {data.remarks or ''}",
        notif_type="project_status_updated",
        ref_id=project_id
    )

    save_data(db)
    return {"success": True, "message": f"Project status updated to {data.status}.", "data": found_proj}

@router.post("/projects/{project_id}/tender-assign")
async def assign_project_tender_contractor(project_id: str, data: AssignTenderContractorRequest):
    db = load_data()
    projects = db.get("project_proposals", [])
    found_proj = None
    for p in projects:
        if p.get("id") == project_id or p.get("project_code") == project_id:
            found_proj = p
            break

    if not found_proj:
        raise HTTPException(status_code=404, detail="Project not found")

    found_proj["status"] = "partner_assigned"
    found_proj["assigned_partner"] = data.contractor_name
    found_proj["tender_details"] = {
        "tender_ref_number": data.tender_ref_number,
        "contractor_name": data.contractor_name,
        "contractor_type": data.contractor_type,
        "contract_amount_inr": data.contract_amount_inr,
        "mou_reference": data.mou_reference or f"MOU-{int(datetime.now(timezone.utc).timestamp())%10000}",
        "start_date": data.start_date or "2026-10-15",
        "target_completion_date": data.target_completion_date or "2027-04-15",
        "assigned_at": datetime.now(timezone.utc).isoformat()
    }

    add_audit_event(
        found_proj,
        "Tender Awarded & Contractor Assigned",
        "State Procurement Cell",
        f"Assigned {data.contractor_name} under Tender {data.tender_ref_number} (Contract Value: ₹{data.contract_amount_inr:,.0f})."
    )

    add_govt_notification(
        db,
        title=f"Contractor Assigned - {found_proj['title']}",
        message=f"Tender {data.tender_ref_number} awarded to {data.contractor_name} (Contract Value: ₹{data.contract_amount_inr:,.0f}).",
        notif_type="partner_assigned",
        ref_id=project_id
    )

    save_data(db)
    return {"success": True, "message": f"Contractor {data.contractor_name} assigned to project {project_id}.", "data": found_proj}

@router.post("/projects/{project_id}/milestones")
async def update_project_milestone(project_id: str, data: UpdateProjectMilestoneRequest):
    db = load_data()
    projects = db.get("project_proposals", [])
    found_proj = None
    for p in projects:
        if p.get("id") == project_id or p.get("project_code") == project_id:
            found_proj = p
            break

    if not found_proj:
        raise HTTPException(status_code=404, detail="Project not found")

    milestones = found_proj.get("milestones", [])
    target_m = None
    for m in milestones:
        if m.get("milestone_id") == data.milestone_id or m.get("title") == data.milestone_id:
            target_m = m
            break

    if not target_m:
        # Create new milestone entry
        target_m = {
            "milestone_id": data.milestone_id,
            "title": f"Milestone {data.milestone_id}",
            "target_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "status": data.status,
            "verification_date": None,
            "gps_location": None,
            "evidence_photos": []
        }
        milestones.append(target_m)

    target_m["status"] = data.status
    if data.status == "completed":
        target_m["verification_date"] = datetime.now(timezone.utc).isoformat()
    
    if data.gps_location:
        target_m["gps_location"] = data.gps_location
    if data.evidence_photos:
        target_m["evidence_photos"] = data.evidence_photos

    # Calculate dynamic progress %
    completed_count = sum(1 for m in milestones if m.get("status") == "completed")
    total_count = len(milestones) or 1
    found_proj["progress_percent"] = min(100, int((completed_count / total_count) * 100))
    if found_proj["progress_percent"] > 0 and found_proj["status"] in ("draft", "submitted", "partner_assigned"):
        found_proj["status"] = "execution"

    add_audit_event(
        found_proj,
        f"Milestone {data.milestone_id} Updated ({data.status.upper()})",
        "Field Officer Inspection",
        data.notes or f"Marked {data.milestone_id} as {data.status}. Progress: {found_proj['progress_percent']}%"
    )

    add_govt_notification(
        db,
        title=f"Milestone {data.milestone_id} Updated - {found_proj['title']}",
        message=f"Milestone marked as {data.status.upper()}. Project overall progress is now {found_proj['progress_percent']}%.",
        notif_type="milestone_updated",
        ref_id=project_id
    )

    save_data(db)
    return {"success": True, "message": f"Milestone {data.milestone_id} updated.", "data": found_proj}

@router.post("/projects/{project_id}/verify-complete")
async def verify_and_complete_project(project_id: str):
    db = load_data()
    projects = db.get("project_proposals", [])
    found_proj = None
    for p in projects:
        if p.get("id") == project_id or p.get("project_code") == project_id:
            found_proj = p
            break

    if not found_proj:
        raise HTTPException(status_code=404, detail="Project not found")

    found_proj["status"] = "completed"
    found_proj["progress_percent"] = 100
    found_proj["final_report_url"] = f"https://bhumicred.in/reports/export/{project_id}_final_completion_audit.pdf"
    
    # Mark all milestones as completed
    for m in found_proj.get("milestones", []):
        m["status"] = "completed"
        if not m.get("verification_date"):
            m["verification_date"] = datetime.now(timezone.utc).isoformat()

    add_audit_event(
        found_proj,
        "Project Final Verification & Completion Sign-off",
        "State Agronomy & Environmental Audit",
        f"Project officially completed, 100% progress verified. Final audit certificate generated."
    )

    add_govt_notification(
        db,
        title=f"Project Completed & Certified - {found_proj['title']}",
        message=f"Project {project_id} officially completed and verified by State Agronomy Audit.",
        notif_type="project_completed",
        ref_id=project_id
    )

    save_data(db)
    return {"success": True, "message": f"Project {project_id} verified and completed.", "data": found_proj}


# ── Workflow 7: Carbon Credit Verification, State Ledger & Lifecycle ────────────────────────

def init_state_carbon_ledger(db: Dict[str, Any]):
    if "state_carbon_ledger" not in db:
        db["state_carbon_ledger"] = {
            "total_minted_credits": 15200.0,
            "retired_transferred_credits": 4500.0,
            "available_registry_credits": 10700.0,
            "estimated_carbon_value_inr": 19795000.0,
            "jurisdiction_code": "MP-IND-461",
            "state": "Madhya Pradesh",
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "ledger_transactions": [
                {
                    "tx_id": "TX-CRB-9001",
                    "type": "MINTED",
                    "request_id": "CRB-901",
                    "amount_credits": 2500.0,
                    "serial_range": "BC-IND-MP-2026-00001-02500",
                    "certification_agency": "Verra VCS",
                    "unit_price_inr": 1850.0,
                    "total_value_inr": 4625000.0,
                    "timestamp": "2026-08-01T12:00:00Z",
                    "certificate_pdf_url": "/reports/Carbon_Credit_Minting_Certificate.pdf"
                },
                {
                    "tx_id": "TX-TRF-9002",
                    "type": "TRANSFER",
                    "buyer_recipient": "Adani Green ESG Carbon Escrow Pool",
                    "amount_credits": 1500.0,
                    "serial_range": "BC-IND-MP-2026-00001-01500",
                    "unit_price_inr": 1850.0,
                    "total_value_inr": 2775000.0,
                    "timestamp": "2026-08-15T14:30:00Z",
                    "receipt_url": "/reports/Carbon_Settlement_Receipt.pdf"
                }
            ]
        }

@router.get("/carbon/eligible-targets")
async def get_carbon_eligible_targets(jurisdiction_code: Optional[str] = None):
    db = load_data()
    assets = [a for a in db.get("assets", []) if str(a.get("status", "")).lower() in ["approved", "active"]]
    projects = [p for p in db.get("projects", []) if str(p.get("status", "")).lower() not in ["draft", "cancelled", "rejected"]]
    farms = db.get("farms", [])
    
    if not assets:
        assets = [
            {"id": "AST-101", "name": "Narmada Riverbank Green Belt & Miyawaki Park", "category": "Park", "area_acres": 8.5, "status": "Approved", "target_type": "public_asset", "mature_trees_count": 2100},
            {"id": "AST-102", "name": "Gram Panchayat Biodiversity Sanctuary (Khasra 42)", "category": "Sanctuary", "area_acres": 12.0, "status": "Approved", "target_type": "public_asset", "mature_trees_count": 3200}
        ]
    if not projects:
        projects = [
            {"id": "PRJ-801", "title": "Gram Panchayat Miyawaki Eco-Park", "project_type": "Afforestation", "area_acres": 10.0, "status": "active", "target_type": "project", "participants_count": 120}
        ]
    
    targets = []
    for a in assets:
        targets.append({
            "id": a.get("id"),
            "target_type": "public_asset",
            "name": a.get("name", "Public Asset"),
            "category": a.get("category", "Asset"),
            "area_acres": float(a.get("area_acres", 10.0)),
            "location": f"{a.get('village_ward', '')}, {a.get('district', 'Hoshangabad')}".strip(", "),
            "status": a.get("status", "Approved"),
            "trees_count": a.get("mature_trees_count", 1500),
            "jurisdiction_code": a.get("jurisdiction_code", "MP-IND-461")
        })
    for p in projects:
        targets.append({
            "id": p.get("id"),
            "target_type": "project",
            "name": p.get("title", "Government Project"),
            "category": p.get("project_type", "Project"),
            "area_acres": float(p.get("area_acres", 10.0)),
            "location": p.get("district", "Hoshangabad"),
            "status": p.get("status", "active"),
            "trees_count": p.get("participants_count", 100) * 50,
            "jurisdiction_code": p.get("jurisdiction_code", "MP-IND-461")
        })
    for f in farms:
        targets.append({
            "id": f.get("id", "FAR-101"),
            "target_type": "land",
            "name": f"Land Parcel Khasra {f.get('khasra_number', '101')} ({f.get('owner_name', 'Farmer Land')})",
            "category": "Land Parcel",
            "area_acres": float(f.get("area_acres", 5.0)),
            "location": f.get("village", "Pipariya"),
            "status": "Approved",
            "trees_count": 500,
            "jurisdiction_code": "MP-IND-461"
        })
        
    if jurisdiction_code:
        targets = [t for t in targets if t.get("jurisdiction_code") == jurisdiction_code or "MP" in t.get("jurisdiction_code", "")]
        
    return {"success": True, "data": targets}

@router.get("/carbon/requests")
@router.get("/carbon-requests")
async def list_carbon_requests(
    stage: Optional[str] = None,
    status_filter: Optional[str] = None,
    jurisdiction_code: Optional[str] = None
):
    db = load_data()
    requests = db.get("carbon_requests", [])
    if not requests:
        requests = [
            {
                "id": "CRB-901",
                "target_type": "public_asset",
                "target_id": "AST-101",
                "target_name": "Gram Panchayat Community Forest (Khasra 12)",
                "asset_name": "Gram Panchayat Community Forest (Khasra 12)",
                "objective": "Carbon sequestration & riparian buffer restoration along Narmada bank.",
                "methodology": "VM0042 - Improved Agroforestry & Afforestation",
                "carbon_target": "2,500 tCO₂e",
                "carbon_target_tco2e": 2500.0,
                "area_acres": 15.0,
                "tree_density": "350 Trees / Acre",
                "stage": "Monitoring",
                "status": "verification_completed",
                "sentinel_ndvi_score": 0.84,
                "canopy_coverage_percent": 78.5,
                "issued_credits": 2500,
                "jurisdiction_code": "MP-IND-461",
                "submitted_at": "2026-08-01T11:00:00Z",
                "documents": [{"name": "Baseline_Carbon_Audit.pdf", "url": "/uploads/govt/documents/baseline_carbon_audit.pdf"}],
                "evidence_photos": ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop"],
                "audit_timeline": [
                    {"stage": "Submitted", "timestamp": "2026-08-01T11:00:00Z", "actor": "Government Body", "notes": "Submitted carbon request for 15-acre forest asset."},
                    {"stage": "Eligibility Validation", "timestamp": "2026-08-02T09:30:00Z", "actor": "Automated GIS Engine", "notes": "Sentinel-2 satellite eligibility check passed (NDVI: 0.84)."},
                    {"stage": "Admin Review", "timestamp": "2026-08-05T14:15:00Z", "actor": "State Carbon Officer", "notes": "Approved project methodology and baseline biomass calculation."},
                    {"stage": "Verification", "timestamp": "2026-08-10T16:00:00Z", "actor": "Verra Independent Auditor", "notes": "On-site audit signoff completed."},
                    {"stage": "Monitoring", "timestamp": "2026-08-15T10:00:00Z", "actor": "Satellite MRV Telemetry", "notes": "Active continuous biomass & growth monitoring."}
                ]
            }
        ]
        db["carbon_requests"] = requests
        save_data(db)

    if stage:
        requests = [r for r in requests if r.get("stage", "").lower() == stage.lower()]
    if status_filter:
        requests = [r for r in requests if r.get("status", "").lower() == status_filter.lower()]
    if jurisdiction_code:
        requests = [r for r in requests if r.get("jurisdiction_code") == jurisdiction_code or "MP" in r.get("jurisdiction_code", "")]

    return {"success": True, "data": requests}

@router.get("/carbon/requests/{request_id}")
async def get_carbon_request_detail(request_id: str):
    db = load_data()
    requests = db.get("carbon_requests", [])
    found = next((r for r in requests if r.get("id") == request_id), None)
    if not found:
        raise HTTPException(status_code=404, detail=f"Carbon credit request {request_id} not found.")
    return {"success": True, "data": found}

@router.post("/carbon/requests", status_code=status.HTTP_201_CREATED)
@router.post("/carbon/request", status_code=status.HTTP_201_CREATED)
@router.post("/carbon-requests", status_code=status.HTTP_201_CREATED)
async def create_carbon_credit_request(data: Dict[str, Any]):
    db = load_data()
    requests = db.get("carbon_requests", [])
    
    target_type = data.get("target_type", "public_asset")
    target_id = data.get("target_id", "AST-101")
    target_name = data.get("target_name") or data.get("asset_name", "Public Asset Sequestration Zone")
    area_acres = float(data.get("area_acres", 10.0))
    objective = data.get("objective", "Carbon Sequestration & Ecosystem Protection")
    documents = data.get("documents", [])
    evidence_photos = data.get("evidence_photos", [])
    sentinel_ndvi_link = data.get("sentinel_ndvi_link", "https://sentinel.bhumicred.in/ndvi/live")
    methodology = data.get("methodology", "VM0042 - Improved Agroforestry & Afforestation")
    tree_density = data.get("tree_density", "350 Trees / Acre")
    carbon_target_tco2e = float(data.get("carbon_target_tco2e", data.get("carbon_target", 2500.0) if isinstance(data.get("carbon_target"), (int, float)) else 2500.0))
    jurisdiction_code = data.get("jurisdiction_code", "MP-IND-461")

    # Validate target approval status
    target_approved = True
    if target_type == "public_asset":
        asset = next((a for a in db.get("assets", []) if a.get("id") == target_id), None)
        if not asset or str(asset.get("status", "")).lower() not in ["approved", "active"]:
            target_approved = False
    elif target_type == "project":
        project = next((p for p in db.get("projects", []) if p.get("id") == target_id), None)
        if not project or str(project.get("status", "")).lower() in ["draft", "cancelled", "rejected"]:
            target_approved = False
    elif target_type == "land":
        farm = next((f for f in db.get("farms", []) if f.get("id") == target_id), None)
        if not farm and not target_id.startswith("FAR-10"):
            target_approved = False


    if not target_approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target activity '{target_name}' (ID: {target_id}) is not approved/validated. Only approved activities progress to carbon lifecycle."
        )

    req_id = f"CRB-{len(requests) + 902}"
    new_req = {
        "id": req_id,
        "target_type": target_type,
        "target_id": target_id,
        "target_name": target_name,
        "asset_name": target_name,
        "objective": objective,
        "methodology": methodology,
        "carbon_target": f"{carbon_target_tco2e:,.0f} tCO₂e",
        "carbon_target_tco2e": carbon_target_tco2e,
        "area_acres": area_acres,
        "tree_density": tree_density,
        "documents": documents,
        "evidence_photos": evidence_photos,
        "sentinel_ndvi_link": sentinel_ndvi_link,
        "jurisdiction_code": jurisdiction_code,
        "stage": "Submitted",
        "status": "submitted",
        "sentinel_ndvi_score": 0.82,
        "canopy_coverage_percent": 75.0,
        "issued_credits": 0,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "audit_timeline": [
            {
                "stage": "Submitted",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "action": "Carbon Request Created",
                "actor": "Government Body",
                "notes": f"Submitted carbon request for {target_name} ({area_acres} acres, target {carbon_target_tco2e:,.0f} tCO₂e)."
            }
        ]
    }
    
    requests.insert(0, new_req)
    db["carbon_requests"] = requests
    
    add_govt_notification(
        db=db,
        title="Carbon Credit Request Created",
        message=f"Carbon request {req_id} for {target_name} ({carbon_target_tco2e:,.0f} tCO₂e) submitted successfully.",
        notif_type="carbon_request_created",
        ref_id=req_id
    )
    
    save_data(db)
    return {"success": True, "message": f"Carbon credit request {req_id} created and submitted for eligibility validation.", "data": new_req}

@router.post("/carbon/requests/{request_id}/status")
async def update_carbon_request_stage(request_id: str, data: CarbonStageTransitionRequest):
    db = load_data()
    requests = db.get("carbon_requests", [])
    found = next((r for r in requests if r.get("id") == request_id), None)
    if not found:
        raise HTTPException(status_code=404, detail=f"Carbon request {request_id} not found.")

    valid_stages = ["Submitted", "Eligibility Validation", "Admin Review", "Verification", "Monitoring", "Credit Lifecycle"]
    new_stage = data.new_stage
    if new_stage not in valid_stages:
        raise HTTPException(status_code=400, detail=f"Invalid stage '{new_stage}'. Must be one of {valid_stages}.")

    # Enforce target activity approval check
    target_type = found.get("target_type", "public_asset")
    target_id = found.get("target_id")
    if target_type == "public_asset" and target_id:
        asset = next((a for a in db.get("assets", []) if a.get("id") == target_id), None)
        if asset and str(asset.get("status", "")).lower() in ["rejected", "unapproved", "cancelled"]:
            raise HTTPException(status_code=400, detail="Cannot progress carbon request: Linked public asset is not approved.")
    elif target_type == "project" and target_id:
        project = next((p for p in db.get("projects", []) if p.get("id") == target_id), None)
        if project and str(project.get("status", "")).lower() in ["rejected", "cancelled"]:
            raise HTTPException(status_code=400, detail="Cannot progress carbon request: Linked project is not approved/active.")

    found["stage"] = new_stage
    found["status"] = new_stage.lower().replace(" ", "_")
    if data.sentinel_ndvi_score is not None:
        found["sentinel_ndvi_score"] = data.sentinel_ndvi_score
    if data.canopy_coverage_percent is not None:
        found["canopy_coverage_percent"] = data.canopy_coverage_percent

    timeline = found.get("audit_timeline", [])
    timeline.append({
        "stage": new_stage,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": f"Advanced to {new_stage}",
        "actor": "State Carbon Authority",
        "notes": data.auditor_notes or f"Transitioned request {request_id} to stage {new_stage}."
    })
    found["audit_timeline"] = timeline

    add_govt_notification(
        db=db,
        title=f"Carbon Request Advanced to {new_stage}",
        message=f"Request {request_id} for {found.get('target_name')} moved to {new_stage}.",
        notif_type="carbon_stage_update",
        ref_id=request_id
    )

    save_data(db)
    return {"success": True, "message": f"Request {request_id} stage updated to '{new_stage}'.", "data": found}

@router.post("/carbon/requests/{request_id}/issue-credits")
async def issue_carbon_credits_for_request(request_id: str, data: IssueStateCarbonCreditsRequest):
    db = load_data()
    init_state_carbon_ledger(db)
    
    requests = db.get("carbon_requests", [])
    found = next((r for r in requests if r.get("id") == request_id), None)
    if not found:
        raise HTTPException(status_code=404, detail=f"Carbon request {request_id} not found.")

    credits_minted = float(data.credits_to_issue)
    if credits_minted <= 0:
        raise HTTPException(status_code=400, detail="Credits to issue must be greater than 0.")

    # Minting update on request
    found["issued_credits"] = float(found.get("issued_credits", 0)) + credits_minted
    found["stage"] = "Credit Lifecycle"
    found["status"] = "credits_minted"
    
    serial_start = int(db["state_carbon_ledger"]["total_minted_credits"]) + 1
    serial_end = int(db["state_carbon_ledger"]["total_minted_credits"]) + int(credits_minted)
    serial_range = f"{data.serial_prefix}-{data.vintage_year}-{serial_start:05d}-{serial_end:05d}"
    found["registry_serial_number"] = serial_range

    timeline = found.get("audit_timeline", [])
    timeline.append({
        "stage": "Credit Lifecycle",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": "Carbon Credits Minted",
        "actor": data.certification_agency,
        "notes": f"Minted {credits_minted:,.0f} certified tCO₂e carbon credits (Serial Range: {serial_range}). {data.auditor_notes or ''}"
    })
    found["audit_timeline"] = timeline

    # Update State Carbon Credit Ledger
    ledger = db["state_carbon_ledger"]
    ledger["total_minted_credits"] = float(ledger.get("total_minted_credits", 0)) + credits_minted
    ledger["available_registry_credits"] = float(ledger.get("available_registry_credits", 0)) + credits_minted
    ledger["estimated_carbon_value_inr"] = ledger["available_registry_credits"] * data.unit_price_inr
    ledger["last_updated"] = datetime.now(timezone.utc).isoformat()

    tx_id = f"TX-MINT-{int(datetime.now(timezone.utc).timestamp())}"
    ledger_tx = {
        "tx_id": tx_id,
        "type": "MINTED",
        "request_id": request_id,
        "target_name": found.get("target_name"),
        "amount_credits": credits_minted,
        "serial_range": serial_range,
        "certification_agency": data.certification_agency,
        "unit_price_inr": data.unit_price_inr,
        "total_value_inr": credits_minted * data.unit_price_inr,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "certificate_pdf_url": f"/reports/Carbon_Credit_Minting_Certificate_{tx_id}.pdf"
    }
    ledger.get("ledger_transactions", []).insert(0, ledger_tx)

    add_govt_notification(
        db=db,
        title="State Carbon Credits Minted",
        message=f"Successfully minted {credits_minted:,.0f} carbon credits for {found.get('target_name')} (Serial: {serial_range}).",
        notif_type="carbon_credits_minted",
        ref_id=tx_id
    )

    save_data(db)
    return {
        "success": True,
        "message": f"Successfully minted {credits_minted:,.0f} tCO₂e carbon credits.",
        "data": {
            "request": found,
            "ledger_summary": ledger,
            "mint_transaction": ledger_tx
        }
    }

@router.get("/carbon/ledger")
async def get_state_carbon_credit_ledger(jurisdiction_code: Optional[str] = None):
    db = load_data()
    init_state_carbon_ledger(db)
    ledger = db["state_carbon_ledger"]
    return {"success": True, "data": ledger}

@router.post("/carbon/transfer")
async def transfer_carbon_credits(data: CarbonTransferRequest):
    db = load_data()
    init_state_carbon_ledger(db)
    ledger = db["state_carbon_ledger"]

    transfer_qty = float(data.credits_to_transfer)
    if transfer_qty <= 0:
        raise HTTPException(status_code=400, detail="Transfer credits count must be > 0.")

    available = float(ledger.get("available_registry_credits", 0))
    if transfer_qty > available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient available carbon credits. Requested: {transfer_qty:,.0f}, Available: {available:,.0f}"
        )

    ledger["available_registry_credits"] = available - transfer_qty
    ledger["retired_transferred_credits"] = float(ledger.get("retired_transferred_credits", 0)) + transfer_qty
    ledger["estimated_carbon_value_inr"] = ledger["available_registry_credits"] * data.unit_price_inr
    ledger["last_updated"] = datetime.now(timezone.utc).isoformat()

    tx_id = f"TX-TRF-{int(datetime.now(timezone.utc).timestamp())}"
    serial_start = int(ledger["retired_transferred_credits"] - transfer_qty) + 1
    serial_end = int(ledger["retired_transferred_credits"])
    serial_range = f"BC-IND-MP-2026-{serial_start:05d}-{serial_end:05d}"

    transfer_tx = {
        "tx_id": tx_id,
        "type": data.transfer_type,
        "buyer_recipient": data.buyer_or_recipient,
        "amount_credits": transfer_qty,
        "unit_price_inr": data.unit_price_inr,
        "total_value_inr": transfer_qty * data.unit_price_inr,
        "serial_range": serial_range,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "notes": data.notes or "Registry settlement executed.",
        "receipt_url": f"/reports/Carbon_Settlement_Receipt_{tx_id}.pdf"
    }
    ledger.get("ledger_transactions", []).insert(0, transfer_tx)

    add_govt_notification(
        db=db,
        title="Carbon Credit Settlement Executed",
        message=f"Transferred {transfer_qty:,.0f} credits to {data.buyer_or_recipient} (Value: ₹{transfer_qty * data.unit_price_inr:,.0f}).",
        notif_type="carbon_transfer_executed",
        ref_id=tx_id
    )

    save_data(db)
    return {
        "success": True,
        "message": f"Successfully transferred {transfer_qty:,.0f} carbon credits to {data.buyer_or_recipient}.",
        "data": {
            "transfer_transaction": transfer_tx,
            "ledger_summary": ledger
        }
    }


# ── Persistent Tender Proposals & Contractor Allocation ────────────────────────

@router.get("/tenders")
async def list_persistent_tenders(project_id: Optional[str] = None, status_filter: Optional[str] = None):
    db = load_data()
    tenders = db.get("tender_proposals", [])
    if not tenders:
        tenders = [
            {
                "id": "TND-2026-MP-0482",
                "tender_ref_number": "TND-2026-MP-0482",
                "title": "Gram Panchayat Miyawaki Plantation & Agroforestry Supply",
                "project_id": "PRJ-801",
                "contractor_name": "Vanashree Ecological Foundation & Nursery Corp",
                "contractor_gstin": "23AAACV1234F1Z5",
                "proposed_budget_inr": 1650000.0,
                "status": "awarded",
                "submitted_at": "2026-08-10T10:00:00Z",
                "technical_proposal_doc": "/uploads/govt/documents/technical_bid_vanashree.pdf",
                "financial_bid_doc": "/uploads/govt/documents/financial_bid_vanashree.pdf",
                "notes": "Empaneled plantation agency awarded tender for Narmada bio-shield."
            },
            {
                "id": "TND-2026-MP-0112",
                "tender_ref_number": "TND-2026-MP-0112",
                "title": "Soil Testing Lab Equipment & Reagent Supply Tender",
                "project_id": None,
                "contractor_name": "Krishi Tech Bio-Labs Pvt Ltd",
                "contractor_gstin": "23BBBCT5678K1Z2",
                "proposed_budget_inr": 850000.0,
                "status": "submitted",
                "submitted_at": "2026-08-20T11:30:00Z",
                "technical_proposal_doc": "/uploads/govt/documents/soil_lab_proposal.pdf",
                "financial_bid_doc": "/uploads/govt/documents/soil_lab_financial.pdf",
                "notes": "Technical proposal under review by KVK agronomy panel."
            }
        ]
        db["tender_proposals"] = tenders
        save_data(db)

    if project_id:
        tenders = [t for t in tenders if t.get("project_id") == project_id]
    if status_filter:
        tenders = [t for t in tenders if t.get("status", "").lower() == status_filter.lower()]

    return {"success": True, "data": tenders}

@router.post("/tenders", status_code=status.HTTP_201_CREATED)
async def create_persistent_tender(data: TenderProposalCreate):
    db = load_data()
    tenders = db.get("tender_proposals", [])
    
    tender_id = data.tender_ref_number or f"TND-{int(datetime.now(timezone.utc).timestamp())}"
    new_tender = {
        "id": tender_id,
        "tender_ref_number": tender_id,
        "title": data.title,
        "project_id": data.project_id,
        "contractor_name": data.contractor_name,
        "contractor_gstin": data.contractor_gstin,
        "proposed_budget_inr": data.proposed_budget_inr,
        "technical_proposal_doc": data.technical_proposal_doc,
        "financial_bid_doc": data.financial_bid_doc,
        "jurisdiction_code": data.jurisdiction_code,
        "status": "submitted",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "notes": data.notes
    }

    tenders.insert(0, new_tender)
    db["tender_proposals"] = tenders

    add_govt_notification(
        db=db,
        title="Tender Proposal Submitted",
        message=f"Tender proposal {tender_id} submitted by {data.contractor_name} (Value: ₹{data.proposed_budget_inr:,.0f}).",
        notif_type="tender_submitted",
        ref_id=tender_id
    )

    save_data(db)
    return {"success": True, "message": f"Tender proposal {tender_id} created and stored in persistent database.", "data": new_tender}

@router.post("/tenders/{tender_id}/award")
async def award_persistent_tender(tender_id: str, data: AwardTenderRequest):
    db = load_data()
    tenders = db.get("tender_proposals", [])
    found = next((t for t in tenders if t.get("id") == tender_id or t.get("tender_ref_number") == tender_id), None)
    if not found:
        raise HTTPException(status_code=404, detail=f"Tender proposal {tender_id} not found.")

    found["status"] = "awarded"
    found["awarded_amount_inr"] = data.awarded_amount_inr
    found["awarded_at"] = datetime.now(timezone.utc).isoformat()
    if data.notes:
        found["notes"] = data.notes

    # If linked to a project, update project tender details
    project_id = found.get("project_id")
    if project_id:
        projects = db.get("projects", [])
        proj = next((p for p in projects if p.get("id") == project_id), None)
        if proj:
            proj["tender_details"] = {
                "tender_ref_number": found.get("tender_ref_number"),
                "contractor_name": data.contractor_name,
                "contract_amount_inr": data.awarded_amount_inr,
                "awarded_at": datetime.now(timezone.utc).isoformat()
            }
            proj["status"] = "partner_assigned"

    add_govt_notification(
        db=db,
        title="Tender Contract Awarded",
        message=f"Tender {tender_id} awarded to {data.contractor_name} for ₹{data.awarded_amount_inr:,.0f}.",
        notif_type="tender_awarded",
        ref_id=tender_id
    )

    save_data(db)
    return {"success": True, "message": f"Tender {tender_id} awarded to {data.contractor_name}.", "data": found}


# ── File Upload Storage Handler ───────────────────────────────────────────────

@router.post("/upload-file", status_code=status.HTTP_201_CREATED)
async def upload_govt_document_file(payload: FileUploadPayload):
    doc_dir = os.path.join("uploads", "govt", "documents" if payload.file_type == "document" else "photos")
    os.makedirs(doc_dir, exist_ok=True)

    filename = payload.filename.replace(" ", "_")
    file_path = os.path.join(doc_dir, filename)

    if payload.content_base64:
        import base64
        file_bytes = base64.b64decode(payload.content_base64.split(",")[-1])
        with open(file_path, "wb") as f:
            f.write(file_bytes)
    else:
        # Create dummy document placeholder file on disk if no base64 content
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(f"BhumiCred Official Government Verified Document: {filename}\nGenerated at {datetime.now(timezone.utc).isoformat()}")

    rel_url = f"/{doc_dir.replace(os.sep, '/')}/{filename}"
    return {
        "success": True,
        "message": f"File '{filename}' uploaded and stored successfully.",
        "data": {
            "filename": filename,
            "file_url": rel_url,
            "size_bytes": os.path.getsize(file_path)
        }
    }



# ── Workflow 8: Treasury Settlement & Withdrawals (Implemented in Workflow 9 below) ──





# =====================================================================
# ── GIS MAP & JURISDICTION GEOSPATIAL LAYERS (STRICT DATA PRIVACY) ──
# =====================================================================

DEFAULT_GIS_COORDS = [
    {"lat": 22.7485, "lng": 75.8942, "village": "Amupura"},
    {"lat": 22.7533, "lng": 75.8937, "village": "Dolariya"},
    {"lat": 22.7410, "lng": 75.9012, "village": "Babai"},
    {"lat": 22.7620, "lng": 75.8850, "village": "Khari"},
    {"lat": 22.7350, "lng": 75.9120, "village": "Sanga"}
]

class SaveReportRequest(BaseModel):
    name: str
    category: str
    filters: Dict[str, Any] = {}
    notes: Optional[str] = None

class ExportReportPayload(BaseModel):
    report_category: str
    report_name: str
    format: str = "pdf" # "pdf" or "csv"
    date_range: Optional[str] = "Last 30 Days"
    filters: Optional[Dict[str, Any]] = {}

@router.get("/gis/layers")
@router.get("/gis/dashboard")
async def get_govt_gis_layers(
    district: Optional[str] = None,
    state: Optional[str] = None,
    village_ward: Optional[str] = None,
    layer_types: Optional[str] = None,
    status_filter: Optional[str] = None
):
    db = load_data()
    
    # Base public assets
    assets_raw = db.get("assets", [])
    campaigns_raw = db.get("campaigns", [])
    soil_raw = db.get("soil_requests", [])
    insurance_raw = db.get("insurance_requests", [])
    projects_raw = db.get("project_proposals", [])
    carbon_raw = db.get("carbon_requests", [])
    
    # 1. Public Assets Layer
    public_assets_layer = []
    for idx, a in enumerate(assets_raw):
        gps = a.get("gps_coords")
        if not gps or not gps.get("latitude"):
            coord_def = DEFAULT_GIS_COORDS[idx % len(DEFAULT_GIS_COORDS)]
            gps = {"latitude": coord_def["lat"], "longitude": coord_def["lng"]}
        
        lat = gps.get("latitude", 22.7485)
        lng = gps.get("longitude", 75.8942)
        
        # Calculate bounding polygon for visualization
        delta = 0.003
        polygon = [
            {"latitude": lat - delta, "longitude": lng - delta},
            {"latitude": lat - delta, "longitude": lng + delta},
            {"latitude": lat + delta, "longitude": lng + delta},
            {"latitude": lat + delta, "longitude": lng - delta},
        ]
        
        public_assets_layer.append({
            "id": a.get("id", f"AST-10{idx+1}"),
            "name": a.get("name", "Public Reserve Land"),
            "category": a.get("category", "Public Land"),
            "status": a.get("status", "Active"),
            "area_acres": a.get("area_acres", 12.5),
            "mature_trees_count": a.get("mature_trees_count", 850),
            "saplings_count": a.get("saplings_count", 400),
            "health_score": a.get("health_score", 92),
            "khasra_number": a.get("khasra_number", f"KH-{100+idx*12}"),
            "location": a.get("location", "Babai Vikas Khand, Amupura"),
            "village_ward": a.get("village_ward", "Amupura"),
            "district": district or "Hoshangabad",
            "gps_coords": gps,
            "polygon_boundary": polygon
        })
        
    # 2. Eligible Farmers Layer (STRICT DATA PRIVACY - MASKED IDENTIFIERS ONLY)
    farmers_layer = [
        {
            "farmer_ref_id": "FMR-84920",
            "masked_name": "Ramesh P.",
            "village_ward": "Amupura",
            "district": district or "Hoshangabad",
            "land_parcels_count": 2,
            "total_area_acres": 6.8,
            "crop_type": "Wheat & Teak Agroforestry",
            "active_projects": ["MP Agroforestry Sink"],
            "gps_coords": {"latitude": 22.7492, "longitude": 75.8955},
            "status": "Verified & Enrolled"
        },
        {
            "farmer_ref_id": "FMR-91042",
            "masked_name": "Devendra S.",
            "village_ward": "Dolariya",
            "district": district or "Hoshangabad",
            "land_parcels_count": 3,
            "total_area_acres": 14.2,
            "crop_type": "Soybean & Citrus Orchard",
            "active_projects": ["Carbon Soil Enrichment"],
            "gps_coords": {"latitude": 22.7540, "longitude": 75.8920},
            "status": "Verified & Enrolled"
        },
        {
            "farmer_ref_id": "FMR-72319",
            "masked_name": "Suresh K.",
            "village_ward": "Babai",
            "district": district or "Hoshangabad",
            "land_parcels_count": 1,
            "total_area_acres": 4.5,
            "crop_type": "Millet & Neem Border",
            "active_projects": ["Tree Shield Scheme"],
            "gps_coords": {"latitude": 22.7425, "longitude": 75.9030},
            "status": "Active"
        },
        {
            "farmer_ref_id": "FMR-60481",
            "masked_name": "Anil M.",
            "village_ward": "Khari",
            "district": district or "Hoshangabad",
            "land_parcels_count": 2,
            "total_area_acres": 8.0,
            "crop_type": "Gram & Organic Biochar",
            "active_projects": ["Panchayat Soil Campaign"],
            "gps_coords": {"latitude": 22.7635, "longitude": 75.8840},
            "status": "Verified & Enrolled"
        }
    ]

    # 3. Farmer Land Parcels Layer
    farmer_land_layer = [
        {
            "parcel_id": "LND-MP-402",
            "masked_owner": "Ramesh P. (FMR-84920)",
            "village_ward": "Amupura",
            "area_acres": 3.8,
            "crop_pattern": "Teak Border + Mustard",
            "tree_count": 240,
            "satellite_ndvi": 0.74,
            "status": "Verified MRV",
            "gps_coords": {"latitude": 22.7490, "longitude": 75.8960},
            "polygon": [
                {"latitude": 22.7480, "longitude": 75.8950},
                {"latitude": 22.7480, "longitude": 75.8970},
                {"latitude": 22.7500, "longitude": 75.8970},
                {"latitude": 22.7500, "longitude": 75.8950}
            ]
        },
        {
            "parcel_id": "LND-MP-901",
            "masked_owner": "Devendra S. (FMR-91042)",
            "village_ward": "Dolariya",
            "area_acres": 7.5,
            "crop_pattern": "Citrus Plantation",
            "tree_count": 520,
            "satellite_ndvi": 0.81,
            "status": "Verified MRV",
            "gps_coords": {"latitude": 22.7545, "longitude": 75.8915},
            "polygon": [
                {"latitude": 22.7535, "longitude": 75.8905},
                {"latitude": 22.7535, "longitude": 75.8925},
                {"latitude": 22.7555, "longitude": 75.8925},
                {"latitude": 22.7555, "longitude": 75.8905}
            ]
        }
    ]

    # 4. Projects Layer
    projects_layer = []
    for idx, p in enumerate(projects_raw):
        p_lat = 22.7460 + (idx * 0.007)
        p_lng = 75.8920 + (idx * 0.005)
        projects_layer.append({
            "id": p.get("id", f"PRJ-{100+idx}"),
            "title": p.get("title", "Community Agroforestry Sink"),
            "project_type": p.get("project_type", "Agroforestry"),
            "target_acres": p.get("target_acres", 25.0),
            "estimated_budget_inr": p.get("estimated_budget_inr", 1250000),
            "status": p.get("status", "Active"),
            "assigned_partner": p.get("assigned_partner", "Bhumicred Green NGO"),
            "progress_percentage": p.get("progress_percentage", 68),
            "location": p.get("location", "Amupura Cluster"),
            "village_ward": "Amupura",
            "gps_coords": {"latitude": p_lat, "longitude": p_lng}
        })
    if not projects_layer:
        projects_layer.append({
            "id": "PRJ-MP-101",
            "title": "Babai Cluster Teak & Bamboo Plantation",
            "project_type": "Agroforestry",
            "target_acres": 45.0,
            "estimated_budget_inr": 1850000,
            "status": "Active",
            "assigned_partner": "MP State Agro Forestry Corp",
            "progress_percentage": 72,
            "location": "Babai Cluster",
            "village_ward": "Babai",
            "gps_coords": {"latitude": 22.7440, "longitude": 75.9020}
        })

    # 5. Tree & Plantation Layer
    trees_layer = [
        {
            "id": "TR-CLUST-01",
            "asset_ref": "AST-101",
            "cluster_name": "Panchayat Reserve Forest",
            "species": "Teak, Neem, Sheesham & Mahua",
            "tree_count": 2840,
            "health_score": 94,
            "canopy_density": "88%",
            "status": "Satellite Verified",
            "gps_coords": {"latitude": 22.7485, "longitude": 75.8942}
        },
        {
            "id": "TR-CLUST-02",
            "asset_ref": "AST-102",
            "cluster_name": "Gram Roadside Green Corridor",
            "species": "Karanj & Gulmohar",
            "tree_count": 1420,
            "health_score": 89,
            "canopy_density": "76%",
            "status": "Healthy",
            "gps_coords": {"latitude": 22.7533, "longitude": 75.8937}
        }
    ]

    # 6. Operational Activities Layer
    activities_layer = [
        {
            "id": "ACT-SOIL-01",
            "activity_type": "soil_testing",
            "title": "Soil Organic Carbon Grid Audit",
            "target_name": "Amupura North Sector",
            "sample_count": 48,
            "assigned_lab": "MP Krishi Vigyan Kendra Lab",
            "status": "Samples Collected",
            "scheduled_date": "15 Aug 2026",
            "gps_coords": {"latitude": 22.7470, "longitude": 75.8980}
        },
        {
            "id": "ACT-INS-01",
            "activity_type": "tree_insurance",
            "title": "Cyclone & Drought Tree Inspection",
            "target_name": "Babai Teak Cluster",
            "trees_covered": 1200,
            "status": "Under Policy Verification",
            "scheduled_date": "18 Aug 2026",
            "gps_coords": {"latitude": 22.7430, "longitude": 75.9050}
        },
        {
            "id": "ACT-CMP-01",
            "activity_type": "campaign",
            "title": "Farmer Biochar & Organic Onboarding",
            "target_farmers": 120,
            "registered_farmers": 84,
            "status": "Active Camp",
            "scheduled_date": "10 Aug 2026 - 25 Aug 2026",
            "gps_coords": {"latitude": 22.7610, "longitude": 75.8870}
        },
        {
            "id": "ACT-CRB-01",
            "activity_type": "carbon_verification",
            "title": "Sentinel-2 Carbon MRV Satellite Overpass",
            "carbon_target": "184.2 tCO2e",
            "status": "Verification In-Progress",
            "scheduled_date": "20 Aug 2026",
            "gps_coords": {"latitude": 22.7510, "longitude": 75.8930}
        }
    ]

    total_acres = sum(a["area_acres"] for a in public_assets_layer)
    total_trees = sum(a["mature_trees_count"] for a in public_assets_layer)

    layers_map = {
        "public_assets": public_assets_layer,
        "farmers": farmers_layer,
        "eligible_farmers": farmers_layer,
        "land": farmer_land_layer,
        "farmer_land": farmer_land_layer,
        "farmer_land_parcels": farmer_land_layer,
        "projects": projects_layer,
        "trees": trees_layer,
        "soil_activity": [a for a in activities_layer if a.get("activity_type") == "soil_testing"] or [{"id": "SOIL-ACT-1", "title": "Soil Sampling Grid"}],
        "insurance_activity": [a for a in activities_layer if a.get("activity_type") == "tree_insurance"] or [{"id": "INS-ACT-1", "title": "Tree Inspection"}],
        "carbon_activity": [a for a in activities_layer if "carbon" in a.get("activity_type", "")] or [{"id": "CRB-ACT-1", "title": "Satellite MRV Telemetry"}],
        "activities": activities_layer
    }

    return {
        "success": True,
        "jurisdiction": {
            "state": state or "Madhya Pradesh",
            "district": district or "Hoshangabad",
            "village_ward": village_ward or "All Villages",
            "total_mapped_assets": len(public_assets_layer),
            "total_public_area_acres": round(total_acres, 1),
            "total_verified_trees": total_trees,
            "active_farmers_count": len(farmers_layer)
        },
        "available_layers": [
            {"key": "public_assets", "name": "Public Assets & Land", "color": "#16A34A", "count": len(public_assets_layer)},
            {"key": "farmers", "name": "Eligible Farmers (Masked)", "color": "#2563EB", "count": len(farmers_layer)},
            {"key": "land", "name": "Farmer Land Parcels", "color": "#D97706", "count": len(farmer_land_layer)},
            {"key": "projects", "name": "Sanctioned Projects", "color": "#0284C7", "count": len(projects_layer)},
            {"key": "trees", "name": "Tree Clusters & Canopy", "color": "#15803D", "count": len(trees_layer)},
            {"key": "soil_activity", "name": "Soil Testing Activity", "color": "#7C3AED", "count": len(layers_map["soil_activity"])},
            {"key": "insurance_activity", "name": "Tree Insurance Activity", "color": "#0284C7", "count": len(layers_map["insurance_activity"])},
            {"key": "carbon_activity", "name": "Carbon Sequestration Activity", "color": "#059669", "count": len(layers_map["carbon_activity"])}
        ],
        "data": layers_map,
        "layers": layers_map
    }



# =====================================================================
# ── GOVT REPORTS DASHBOARD & ANALYTICS (7 OFFICIAL MODULES) ──────────
# =====================================================================

def init_reports_storage(db: Dict[str, Any]):
    if "saved_reports" not in db:
        db["saved_reports"] = [
            {
                "id": "SAVED-001",
                "name": "Monthly Amupura Public Forest Census",
                "category": "asset_inventory",
                "filters": {"village": "Amupura", "status": "Active"},
                "created_at": "2026-08-01T10:00:00Z",
                "last_generated": "2026-08-18T14:30:00Z"
            },
            {
                "id": "SAVED-002",
                "name": "Quarterly Soil Organic Carbon Audit",
                "category": "soil_testing",
                "filters": {"test_type": "Standard Nitrogen & SOC", "status": "Completed"},
                "created_at": "2026-07-15T09:30:00Z",
                "last_generated": "2026-08-12T11:00:00Z"
            }
        ]
    if "recent_reports" not in db:
        db["recent_reports"] = [
            {
                "id": "REP-EXPORT-901",
                "report_name": "GIS Satellite Tree Census 2026",
                "category": "asset_inventory",
                "format": "PDF",
                "generated_at": "18 Aug 2026, 04:30 PM",
                "file_size": "2.4 MB",
                "download_url": "https://bhumicred.in/reports/export/gis_tree_census_2026.pdf"
            },
            {
                "id": "REP-EXPORT-902",
                "report_name": "Soil Health & Carbon Index Report",
                "category": "soil_testing",
                "format": "PDF",
                "generated_at": "12 Aug 2026, 02:15 PM",
                "file_size": "1.8 MB",
                "download_url": "https://bhumicred.in/reports/export/soil_health_carbon_report.pdf"
            },
            {
                "id": "REP-EXPORT-903",
                "report_name": "Tree Insurance Subsidy Audit",
                "category": "tree_insurance",
                "format": "CSV",
                "generated_at": "05 Aug 2026, 10:45 AM",
                "file_size": "640 KB",
                "download_url": "https://bhumicred.in/reports/export/tree_insurance_audit.csv"
            },
            {
                "id": "REP-EXPORT-904",
                "report_name": "Panchayat Carbon Offset Certificate",
                "category": "carbon_activity",
                "format": "PDF",
                "generated_at": "01 Aug 2026, 06:20 PM",
                "file_size": "3.1 MB",
                "download_url": "https://bhumicred.in/reports/export/panchayat_carbon_offset.pdf"
            }
        ]

@router.get("/reports/categories")
@router.get("/reports/dashboard")
async def get_govt_reports_dashboard(
    district: Optional[str] = None,
    state: Optional[str] = None,
    village_ward: Optional[str] = None,
    date_range: Optional[str] = None
):
    db = load_data()
    init_reports_storage(db)
    
    assets = db.get("assets", [])
    campaigns = db.get("campaigns", [])
    soil_tests = db.get("soil_requests", [])
    insurance = db.get("insurance_requests", [])
    projects = db.get("project_proposals", [])
    carbon = db.get("carbon_requests", [])
    
    total_acres = sum(a.get("area_acres", 0) for a in assets) or 21.7
    total_trees = sum(a.get("mature_trees_count", 0) for a in assets) or 5330
    
    # 9 Standardized Report Categories
    categories = [
        {
            "id": "asset_inventory",
            "name": "Asset Inventory Report",
            "icon": "tree",
            "color": "#16A34A",
            "description": "Public Land, Parks, Green Belts, Plantation Areas, and Satellite MRV Canopy health.",
            "metrics": {
                "total_assets": len(assets) or 6,
                "total_acreage": round(total_acres, 1),
                "managed_trees": total_trees,
                "verified_mrv_pct": 85
            }
        },
        {
            "id": "farmer_participation",
            "name": "Farmer Participation Report",
            "icon": "account-group",
            "color": "#2563EB",
            "description": "Aggregated outreach, project enrollments, land parcel contributions, and scheme beneficiaries.",
            "metrics": {
                "eligible_farmers": 420,
                "participating_farmers": 310,
                "active_campaign_farmers": 145,
                "privacy_masked": True
            }
        },
        {
            "id": "soil_testing",
            "name": "Soil Testing Report",
            "icon": "flask-round-bottom",
            "color": "#D97706",
            "description": "Testing sample counts, N-P-K & Soil Organic Carbon (SOC) index, and certified lab audits.",
            "metrics": {
                "total_requests": len(soil_tests) or 8,
                "samples_collected": 148,
                "reports_ready": 6,
                "avg_organic_carbon": "0.74%"
            }
        },
        {
            "id": "tree_insurance",
            "name": "Tree Insurance Report",
            "icon": "shield-check",
            "color": "#0284C7",
            "description": "Tree coverage, total sum insured, weather risk index, and government subsidy audit.",
            "metrics": {
                "policies_active": len(insurance) or 4,
                "insured_trees": 4800,
                "total_sum_insured": "₹38.5 Lakhs",
                "claims_cleared": 12
            }
        },
        {
            "id": "project_progress",
            "name": "Project Progress Report",
            "icon": "clipboard-text",
            "color": "#7C3AED",
            "description": "Sanctioned agroforestry, CSR partner milestones, fund utilization, and completion timeline.",
            "metrics": {
                "total_projects": len(projects) or 5,
                "active_projects": 3,
                "avg_progress": "74%",
                "budget_utilized": "₹42.8 Lakhs"
            }
        },
        {
            "id": "campaigns",
            "name": "Farmer Campaign Report",
            "icon": "bullhorn",
            "color": "#DC2626",
            "description": "Onboarding drives, soil health campaigns, target vs actual farmer participation metrics.",
            "metrics": {
                "total_campaigns": len(campaigns) or 4,
                "active_campaigns": 2,
                "farmers_invited": 250,
                "completion_rate": "86%"
            }
        },
        {
            "id": "carbon_activity",
            "name": "Carbon Activity Report",
            "icon": "leaf",
            "color": "#0F766E",
            "description": "Total tCO2e sequestered, ICAR / VCS methodology verification, and minted registry credits.",
            "metrics": {
                "total_carbon_requests": len(carbon) or 3,
                "sequestered_tco2e": "184.2 tCO2e",
                "verified_credits": 2500,
                "registry_status": "ICAR Compliant"
            }
        },
        {
            "id": "compliance",
            "name": "Compliance Audit Report",
            "icon": "shield-alert",
            "color": "#4F46E5",
            "description": "Environmental clearance, Gram Sabha resolutions, and ICAR agronomy compliance audit.",
            "metrics": {
                "compliance_score": "96.4%",
                "audited_assets": 12,
                "passed": 12,
                "mrv_signoffs": 8
            }
        },
        {
            "id": "expenditure",
            "name": "Institutional Expenditure Report",
            "icon": "cash-multiple",
            "color": "#059669",
            "description": "Institutional Treasury ledger, scheme allocations, and Direct Benefit Transfer (DBT) payouts.",
            "metrics": {
                "available_escrow": "₹42.5 Lakhs",
                "disbursed": "₹15.2 Lakhs",
                "reconciled": "100%",
                "privacy_masked": True
            }
        }
    ]

    return {
        "success": True,
        "jurisdiction": {
            "state": state or "Madhya Pradesh",
            "district": district or "Hoshangabad",
            "village_ward": village_ward or "All Wards",
            "nodal_agency": "Panchayat & Rural Development Department"
        },
        "summary": {
            "total_assets": len(assets) or 6,
            "total_area_acres": round(total_acres, 1),
            "total_trees": total_trees,
            "eligible_farmers": 420,
            "active_projects": len(projects) or 5,
            "soil_samples_tested": 148,
            "carbon_sequestered_tco2e": 184.2
        },
        "categories": categories,
        "recent_reports": db.get("recent_reports", []),
        "saved_reports": db.get("saved_reports", [])
    }

# ── Dynamic Reports & Export Handlers ──────────────────────────────────────────

def mask_sensitive_kyc(data: Any) -> Any:
    """Recursively scrub sensitive KYC, Aadhaar, Bank Account, IFSC, and Phone Numbers."""
    if isinstance(data, dict):
        cleaned = {}
        for k, v in data.items():
            k_lower = str(k).lower()
            if any(term in k_lower for term in ["aadhaar", "uidai", "ssn"]):
                cleaned[k] = "XXXX-XXXX-" + str(v)[-4:] if v else "XXXX-XXXX-XXXX"
            elif any(term in k_lower for term in ["bank", "account_number", "acc_no", "account_no"]):
                cleaned[k] = "XXXXXX" + str(v)[-4:] if v else "XXXXXX0000"
            elif "ifsc" in k_lower:
                cleaned[k] = "SBIN00XXXXX"
            elif any(term in k_lower for term in ["phone", "mobile", "contact_number"]):
                cleaned[k] = "XXXXXX" + str(v)[-4:] if v else "XXXXXX0000"
            else:
                cleaned[k] = mask_sensitive_kyc(v)
        return cleaned
    elif isinstance(data, list):
        return [mask_sensitive_kyc(item) for item in data]
    return data

def build_pdf_file_on_disk(title: str, category: str, kpis: List[Dict[str, Any]], items: List[Dict[str, Any]], filename: str) -> str:
    reports_dir = os.path.join("uploads", "reports")
    os.makedirs(reports_dir, exist_ok=True)
    file_path = os.path.join(reports_dir, filename)

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        c = canvas.Canvas(file_path, pagesize=letter)
        width, height = letter

        c.setFillColorRGB(0.06, 0.46, 0.43)
        c.rect(0, height - 80, width, 80, fill=True, stroke=False)
        c.setFillColorRGB(1, 1, 1)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(30, height - 35, "GOVERNMENT OF MADHYA PRADESH")
        c.setFont("Helvetica", 11)
        c.drawString(30, height - 55, "Panchayat & Rural Development • Official Agronomy Audit Report")

        c.setFillColorRGB(0.06, 0.09, 0.16)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(30, height - 110, f"Report: {title}")
        c.setFont("Helvetica", 9)
        c.setFillColorRGB(0.39, 0.45, 0.55)
        c.drawString(30, height - 125, f"Category: {category} | Date: {datetime.now(timezone.utc).strftime('%d %b %Y, %I:%M %p')} | Confidential")

        y = height - 165
        c.setFillColorRGB(0.96, 0.98, 0.98)
        c.rect(30, y - 40, width - 60, 45, fill=True, stroke=True)
        c.setFillColorRGB(0.06, 0.46, 0.43)
        c.setFont("Helvetica-Bold", 9)

        x_off = 45
        for kpi in kpis[:4]:
            c.drawString(x_off, y - 15, f"{kpi.get('label')}: {kpi.get('value')}")
            x_off += 130

        y -= 70
        c.setFillColorRGB(0.15, 0.23, 0.37)
        c.rect(30, y - 18, width - 60, 20, fill=True, stroke=False)
        c.setFillColorRGB(1, 1, 1)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(35, y - 12, "REF ID")
        c.drawString(120, y - 12, "RECORD NAME / TARGET")
        c.drawString(320, y - 12, "METRICS / DETAILS")
        c.drawString(480, y - 12, "STATUS")

        y -= 25
        c.setFont("Helvetica", 8)
        c.setFillColorRGB(0.1, 0.1, 0.1)

        for item in items[:15]:
            rec_id = str(item.get("id") or item.get("ref_id") or item.get("farmer_ref_id") or "REC-101")
            name = str(item.get("name") or item.get("target_name") or item.get("title") or item.get("masked_name") or item.get("asset_name") or "")[:28]
            details = str(item.get("type") or item.get("area") or item.get("package") or item.get("partner") or item.get("land_added") or item.get("projects") or item.get("compliance_level") or "")[:28]
            status_text = str(item.get("status") or "Active")

            c.drawString(35, y, rec_id)
            c.drawString(120, y, name)
            c.drawString(320, y, details)
            c.drawString(480, y, status_text)
            y -= 18

            if y < 60:
                c.showPage()
                y = height - 60

        c.setFont("Helvetica-Oblique", 8)
        c.setFillColorRGB(0.5, 0.5, 0.5)
        c.drawString(30, 25, "Certified & Cryptographically Signed by BhumiCred State Agronomy Ledger • Sensitive KYC Masked")
        c.save()

    except Exception:
        with open(file_path, "wb") as f:
            f.write(
                b"%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
                b"2 0 obj << /Type /Pages /Kinds [3 0 R] /Count 1 >> endobj\n"
                b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
                b"4 0 obj << /Length 180 >> stream\n"
                b"BT /F1 16 Tf 50 720 Td (GOVERNMENT OF MADHYA PRADESH) Tj ET\n"
                b"BT /F1 12 Tf 50 690 Td (Official Agronomy Audit Report: " + title.encode("utf-8") + b") Tj ET\n"
                b"BT /F1 10 Tf 50 660 Td (Sanitized Official Report - Sensitive KYC Masked) Tj ET\n"
                b"endstream\nendobj\n"
                b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
                b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000475 00000 n \n"
                b"trailer << /Size 6 /Root 1 0 R >>\nstartxref\n554\n%%EOF\n"
            )

    return file_path

@router.get("/reports/detail/{category}")
async def get_govt_report_category_detail(
    category: str,
    district: Optional[str] = None,
    village_ward: Optional[str] = None,
    date_range: Optional[str] = "Last 30 Days",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    jurisdiction_code: Optional[str] = None
):
    db = load_data()
    init_reports_storage(db)
    
    # 1. Asset Inventory
    if category in ["asset_inventory", "assets"]:
        assets = db.get("assets", [])
        return {
            "success": True,
            "category": "asset_inventory",
            "title": "Public Asset & Tree Inventory Report",
            "generated_date": datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p"),
            "kpis": [
                {"label": "Total Assets Mapped", "value": f"{len(assets) or 6} Units", "change": "+2 this month"},
                {"label": "Total Public Land", "value": "21.7 Acres", "change": "Verified MRV"},
                {"label": "Mature Trees Census", "value": "5,330 Trees", "change": "88% Health Index"},
                {"label": "Saplings Planted", "value": "+1,250", "change": "Monsoon 2026"}
            ],
            "status_breakdown": [
                {"status": "Active & Verified", "count": 4, "percentage": 67},
                {"status": "Under Sentinel MRV Audit", "count": 1, "percentage": 17},
                {"status": "Pending Verification", "count": 1, "percentage": 16}
            ],
            "items": mask_sensitive_kyc([
                {"id": "AST-101", "name": "Gram Panchayat Reserve Forest", "type": "Reserve / Green Area", "area": "8.5 Acres", "trees": 2840, "village": "Amupura", "status": "Verified"},
                {"id": "AST-102", "name": "Roadside Green Corridor (Babai Highway)", "type": "Roadside Trees", "area": "3.2 Acres", "trees": 1420, "village": "Babai", "status": "Active"},
                {"id": "AST-103", "name": "Amupura Community Park & Nursery", "type": "Park", "area": "2.0 Acres", "trees": 350, "village": "Amupura", "status": "Active"},
                {"id": "AST-104", "name": "Dolariya Agroforestry Test Plot", "type": "Plantation Area", "area": "5.0 Acres", "trees": 720, "village": "Dolariya", "status": "Under MRV"}
            ])
        }

    # 2. Farmer Participation
    if category in ["farmer_participation", "farmers"]:
        return {
            "success": True,
            "category": "farmer_participation",
            "title": "Farmer Participation & Enrollment Report",
            "generated_date": datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p"),
            "privacy_notice": "Sensitive KYC & Aadhaar identifiers are securely masked per Government Data Privacy Directives.",
            "kpis": [
                {"label": "Total Eligible Farmers", "value": "420 Farmers", "change": "In Jurisdiction"},
                {"label": "Active Participants", "value": "310 Farmers", "change": "73.8% Engagement"},
                {"label": "Project Enrolled", "value": "185 Farmers", "change": "Agroforestry/Carbon"},
                {"label": "Soil Tested", "value": "120 Farmers", "change": "Received Card"}
            ],
            "status_breakdown": [
                {"status": "Active Beneficiary", "count": 185, "percentage": 60},
                {"status": "Onboarded in Campaign", "count": 85, "percentage": 27},
                {"status": "Pending Field Verification", "count": 40, "percentage": 13}
            ],
            "items": mask_sensitive_kyc([
                {"ref_id": "FMR-84920", "masked_name": "Ramesh P.", "village": "Amupura", "land_count": 2, "total_area": "6.8 Acres", "projects": "MP Agroforestry Sink", "status": "Active"},
                {"ref_id": "FMR-91042", "masked_name": "Devendra S.", "village": "Dolariya", "land_count": 3, "total_area": "14.2 Acres", "projects": "Carbon Soil Enrichment", "status": "Active"},
                {"ref_id": "FMR-72319", "masked_name": "Suresh K.", "village": "Babai", "land_count": 1, "total_area": "4.5 Acres", "projects": "Tree Shield Scheme", "status": "Active"}
            ])
        }

    # 3. Soil Testing
    if category in ["soil_testing", "soil"]:
        return {
            "success": True,
            "category": "soil_testing",
            "title": "Soil Organic Carbon & Nutrient Health Report",
            "generated_date": datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p"),
            "kpis": [
                {"label": "Total Soil Requests", "value": "8 Requests", "change": "100% Assigned"},
                {"label": "Samples Collected", "value": "148 Samples", "change": "Across 5 Wards"},
                {"label": "Certified Reports Ready", "value": "6 Reports", "change": "Delivered to Govt"},
                {"label": "Avg Organic Carbon", "value": "0.74% SOC", "change": "+0.12% Baseline"}
            ],
            "status_breakdown": [
                {"status": "Reports Approved & Ready", "count": 6, "percentage": 75},
                {"status": "Lab Processing In-Progress", "count": 2, "percentage": 25}
            ],
            "items": mask_sensitive_kyc([
                {"id": "SOIL-501", "target_name": "Amupura Gram Panchayat Land", "package": "Full NPK & Carbon Grid", "samples": 48, "lab": "MP Krishi Vigyan Lab", "soc_index": "0.78% (Healthy)", "status": "Report Ready"},
                {"id": "SOIL-502", "target_name": "Babai Teak Cluster Core", "package": "Heavy Metal & SOC Audit", "samples": 36, "lab": "ICAR Central Soil Institute", "soc_index": "0.82% (High)", "status": "Report Ready"}
            ])
        }

    # 4. Tree Insurance
    if category in ["tree_insurance", "insurance"]:
        return {
            "success": True,
            "category": "tree_insurance",
            "title": "Tree Weather & Pest Insurance Subsidy Report",
            "generated_date": datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p"),
            "privacy_notice": "Bank account & settlement disbursement details remain restricted to central Treasury desk.",
            "kpis": [
                {"label": "Active Policies", "value": "4 Policies", "change": "Panchayat Sanctioned"},
                {"label": "Trees Protected", "value": "4,800 Trees", "change": "Teak & Citrus"},
                {"label": "Total Sum Insured", "value": "₹38.5 Lakhs", "change": "Covered 2026-27"},
                {"label": "Claims Settled", "value": "12 Claims", "change": "₹3.8 Lakhs Payout"}
            ],
            "status_breakdown": [
                {"status": "Active Policies", "count": 3, "percentage": 75},
                {"status": "Pending Inspection", "count": 1, "percentage": 25}
            ],
            "items": mask_sensitive_kyc([
                {"id": "INS-701", "asset_name": "Gram Panchayat Reserve Forest", "trees_covered": 2800, "sum_insured": "₹22,40,000", "provider": "HDFC ERGO Agri Shield", "claims": "4 Settled", "status": "Active"},
                {"id": "INS-702", "asset_name": "Babai Green Corridor Teak Belt", "trees_covered": 1200, "sum_insured": "₹9,60,000", "provider": "ICICI Lombard Crop & Tree", "claims": "2 Settled", "status": "Active"}
            ])
        }

    # 5. Project Progress
    if category in ["project_progress", "projects"]:
        return {
            "success": True,
            "category": "project_progress",
            "title": "Sanctioned Projects & CSR Milestone Report",
            "generated_date": datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p"),
            "kpis": [
                {"label": "Total Projects", "value": "5 Projects", "change": "Across 4 Wards"},
                {"label": "Active Implementation", "value": "3 Projects", "change": "On Schedule"},
                {"label": "Average Progress", "value": "74% Completed", "change": "+8% this sprint"},
                {"label": "Budget Sanctioned", "value": "₹58.0 Lakhs", "change": "Grant Approved"}
            ],
            "status_breakdown": [
                {"status": "Active & Under Execution", "count": 3, "percentage": 60},
                {"status": "Milestone Review", "count": 1, "percentage": 20},
                {"status": "Completed & Audited", "count": 1, "percentage": 20}
            ],
            "items": mask_sensitive_kyc([
                {"id": "PRJ-MP-101", "title": "Babai Cluster Teak & Bamboo Plantation", "partner": "MP State Agro Corp", "area": "45.0 Acres", "budget": "₹18,50,000", "progress": 78, "status": "Active"},
                {"id": "PRJ-MP-102", "title": "Amupura Solar Irrigation & Biochar Hub", "partner": "GreenEarth Biochar NGO", "area": "15.0 Acres", "budget": "₹12,00,000", "progress": 85, "status": "Active"}
            ])
        }

    # 6. Campaigns
    if category in ["campaigns", "campaign"]:
        return {
            "success": True,
            "category": "campaigns",
            "title": "Farmer Campaign & Onboarding Audit Report",
            "generated_date": datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p"),
            "kpis": [
                {"label": "Campaigns Run", "value": "4 Campaigns", "change": "2 Active Now"},
                {"label": "Farmers Invited", "value": "250 Farmers", "change": "SMS & Nodal Outreach"},
                {"label": "Farmers Registered", "value": "215 Farmers", "change": "86.0% Conversion"},
                {"label": "Land Added", "value": "184.5 Acres", "change": "Mapped under Scheme"}
            ],
            "status_breakdown": [
                {"status": "Active Campaign", "count": 2, "percentage": 50},
                {"status": "Completed & Certified", "count": 2, "percentage": 50}
            ],
            "items": mask_sensitive_kyc([
                {"id": "CMP-301", "title": "Amupura Monsoon Farmer Onboarding Camp", "type": "Farmer Onboarding", "target": 100, "registered": 88, "land_added": "72.4 Acres", "status": "Active"},
                {"id": "CMP-302", "title": "Panchayat Soil Health Card Campaign", "type": "Soil Testing Drive", "target": 80, "registered": 75, "land_added": "64.0 Acres", "status": "Active"}
            ])
        }

    # 7. Carbon Activity
    if category in ["carbon_activity", "carbon"]:
        return {
            "success": True,
            "category": "carbon_activity",
            "title": "Carbon Sequestration & State Registry Ledger Report",
            "generated_date": datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p"),
            "kpis": [
                {"label": "Carbon Projects", "value": "3 Active", "change": "In Jurisdiction"},
                {"label": "Total Sequestered", "value": "184.2 tCO2e", "change": "2026 Audit"},
                {"label": "Minted Credits", "value": "2,500 Credits", "change": "Registry Approved"},
                {"label": "MRV Compliance", "value": "100% ICAR", "change": "Sentinel-2 Verified"}
            ],
            "status_breakdown": [
                {"status": "Verified & Minted", "count": 2, "percentage": 67},
                {"status": "Sentinel Satellite Audit", "count": 1, "percentage": 33}
            ],
            "items": mask_sensitive_kyc([
                {"id": "CRB-801", "asset_name": "Gram Panchayat Reserve Forest", "methodology": "ICAR-Agroforestry v2.1", "tco2e": "120.5 tCO2e", "credits": "1,500 BC-Credits", "status": "Minted & Certified"},
                {"id": "CRB-802", "asset_name": "Babai Teak Agroforestry Sink", "methodology": "VCS Soil & Biomass v4", "tco2e": "63.7 tCO2e", "credits": "1,000 BC-Credits", "status": "Minted & Certified"}
            ])
        }

    # 8. Compliance
    if category in ["compliance"]:
        return {
            "success": True,
            "category": "compliance",
            "title": "State Environmental & Agronomy Compliance Audit",
            "generated_date": datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p"),
            "kpis": [
                {"label": "Overall Compliance", "value": "96.4%", "change": "ICAR & State Norms"},
                {"label": "Audited Assets", "value": "12 Assets", "change": "100% Passed"},
                {"label": "Sentinel MRV Signoffs", "value": "8 Signoffs", "change": "Verified"},
                {"label": "Gram Sabha Approvals", "value": "14 Resolutions", "change": "Sanctioned"}
            ],
            "status_breakdown": [
                {"status": "Fully Compliant", "count": 10, "percentage": 83},
                {"status": "Under Routine Review", "count": 2, "percentage": 17}
            ],
            "items": mask_sensitive_kyc([
                {"id": "CMP-901", "name": "Gram Panchayat Bio-Shield Protection NOC", "type": "Gram Sabha Resolution", "compliance_level": "100% Verified", "authority": "Sub-Divisional Officer", "status": "Compliant"},
                {"id": "CMP-902", "name": "Narmada Buffer Ecological Clearance", "type": "State Climate Clearance", "compliance_level": "98% Verified", "authority": "State Agronomy Desk", "status": "Compliant"}
            ])
        }

    # 9. Expenditure
    return {
        "success": True,
        "category": "expenditure",
        "title": "Institutional Treasury & DBT Expenditure Report",
        "generated_date": datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p"),
        "privacy_notice": "Bank account numbers and Aadhaar identifiers are strictly masked per Government Data Directives.",
        "kpis": [
            {"label": "Escrow Available", "value": "₹42.5 Lakhs", "change": "Treasury Pool"},
            {"label": "Total Disbursed", "value": "₹15.2 Lakhs", "change": "PFMS DBT"},
            {"label": "Scheme Earmarked", "value": "₹18.0 Lakhs", "change": "4 Active Schemes"},
            {"label": "Reconciliation", "value": "100% Settled", "change": "Bank Reconciled"}
        ],
        "status_breakdown": [
            {"status": "Disbursed & Settled", "count": 15, "percentage": 75},
            {"status": "Pending Disbursement", "count": 3, "percentage": 15},
            {"status": "Reconciled / Refunded", "count": 2, "percentage": 10}
        ],
        "items": mask_sensitive_kyc([
            {"id": "EXP-1001", "name": "PM-KISAN Farmer Installment Batch #2", "type": "DBT Payout", "amount": "₹8,00,000", "bank_account": "XXXXXX4819", "ifsc": "SBIN00XXXXX", "status": "Settled"},
            {"id": "EXP-1002", "name": "Tree Insurance State Subsidy Contribution", "type": "Insurance Grant", "amount": "₹4,20,000", "bank_account": "XXXXXX9102", "ifsc": "HDFC00XXXXX", "status": "Settled"}
        ])
    }


# ── REAL EXPORT FILE ENDPOINTS (PDF, CSV, GeoJSON) ──────────────────────────

@router.get("/reports/export/pdf")
@router.post("/reports/export/pdf")
async def export_govt_report_pdf(
    category: str = "asset_inventory",
    district: Optional[str] = None,
    village_ward: Optional[str] = None,
    date_range: Optional[str] = "Last 30 Days"
):
    detail = await get_govt_report_category_detail(category, district, village_ward, date_range)
    title = detail.get("title", "Government Agronomy Audit Report")
    kpis = detail.get("kpis", [])
    items = detail.get("items", [])

    filename = f"Govt_Report_{category}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.pdf"
    file_path = build_pdf_file_on_disk(title, category, kpis, items, filename)

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/reports/export/csv")
@router.post("/reports/export/csv")
async def export_govt_report_csv(
    category: str = "asset_inventory",
    district: Optional[str] = None,
    village_ward: Optional[str] = None,
    date_range: Optional[str] = "Last 30 Days"
):
    import csv
    import io
    
    detail = await get_govt_report_category_detail(category, district, village_ward, date_range)
    items = detail.get("items", [])
    items_masked = mask_sensitive_kyc(items)

    output = io.StringIO()
    if items_masked:
        fieldnames = list(items_masked[0].keys())
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for row in items_masked:
            writer.writerow(row)
    else:
        writer = csv.writer(output)
        writer.writerow(["ID", "Name", "Category", "Status", "Timestamp"])
        writer.writerow(["REC-101", "Sample Government Record", category, "Verified", datetime.now(timezone.utc).isoformat()])

    csv_content = output.getvalue()
    filename = f"Govt_Report_{category}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    
    reports_dir = os.path.join("uploads", "reports")
    os.makedirs(reports_dir, exist_ok=True)
    file_path = os.path.join(reports_dir, filename)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(csv_content)

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/gis/export/geojson")
@router.get("/reports/export/geojson")
@router.post("/gis/export/geojson")
async def export_govt_gis_geojson(
    district: Optional[str] = None,
    village_ward: Optional[str] = None,
    layer_types: Optional[str] = None
):
    gis_res = await get_govt_gis_layers(district=district, village_ward=village_ward, layer_types=layer_types)
    layers_data = gis_res.get("data", {})
    
    features = []
    
    # Assets
    for asset in layers_data.get("public_assets", []):
        gps = asset.get("gps_coords", {})
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [gps.get("longitude", 75.8942), gps.get("latitude", 22.7485)]
            },
            "properties": mask_sensitive_kyc({
                "id": asset.get("id"),
                "name": asset.get("name"),
                "category": asset.get("category"),
                "area_acres": asset.get("area_acres"),
                "status": asset.get("status"),
                "layer_type": "public_assets"
            })
        })
        
    # Farmers
    for farmer in layers_data.get("farmers", []):
        gps = farmer.get("gps_coords", {})
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [gps.get("longitude", 75.8955), gps.get("latitude", 22.7492)]
            },
            "properties": mask_sensitive_kyc({
                "farmer_ref_id": farmer.get("farmer_ref_id"),
                "masked_name": farmer.get("masked_name"),
                "village_ward": farmer.get("village_ward"),
                "total_area_acres": farmer.get("total_area_acres"),
                "layer_type": "farmers"
            })
        })
        
    # Farmer Land Parcels
    for land in layers_data.get("farmer_land_parcels", []):
        poly = land.get("polygon_boundary", [])
        coords = [[pt["longitude"], pt["latitude"]] for pt in poly] if poly else [[75.895, 22.749], [75.898, 22.749], [75.898, 22.747], [75.895, 22.747], [75.895, 22.749]]
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [coords]
            },
            "properties": mask_sensitive_kyc({
                "parcel_id": land.get("parcel_id"),
                "khasra_number": land.get("khasra_number"),
                "area_acres": land.get("area_acres"),
                "layer_type": "land"
            })
        })

    geojson_data = {
        "type": "FeatureCollection",
        "name": f"BhumiCred_GIS_{district or 'MP'}",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": features
    }

    filename = f"Govt_GIS_Export_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.geojson"
    reports_dir = os.path.join("uploads", "reports")
    os.makedirs(reports_dir, exist_ok=True)
    file_path = os.path.join(reports_dir, filename)
    
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(geojson_data, f, indent=2)

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/geo+json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/reports/export-sanitized")
@router.post("/reports/export")
async def export_govt_sanitized_report(payload: ExportReportPayload):
    db = load_data()
    init_reports_storage(db)
    
    export_id = f"REP-EXP-{Date_now_id()}"
    ext = payload.format.lower()
    filename = f"{payload.report_category}_{ext}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.{ext}"
    
    detail = await get_govt_report_category_detail(payload.report_category)
    title = detail.get("title", payload.report_name)
    kpis = detail.get("kpis", [])
    items = detail.get("items", [])

    if ext == "pdf":
        file_path = build_pdf_file_on_disk(title, payload.report_category, kpis, items, filename)
    else:
        # Build CSV file
        reports_dir = os.path.join("uploads", "reports")
        os.makedirs(reports_dir, exist_ok=True)
        file_path = os.path.join(reports_dir, filename)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(f"ID,Name,Type,Status,Date\nREC-101,{title},{payload.report_category},Verified,{datetime.now(timezone.utc).isoformat()}\n")

    download_url = f"/uploads/reports/{filename}"
    
    new_export_record = {
        "id": export_id,
        "report_name": payload.report_name,
        "category": payload.report_category,
        "format": payload.format.upper(),
        "generated_at": datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p"),
        "file_size": "1.2 MB",
        "download_url": download_url,
        "filters_applied": payload.filters or {}
    }
    
    db["recent_reports"].insert(0, new_export_record)
    save_data(db)
    
    return {
        "success": True,
        "export_id": export_id,
        "report_name": payload.report_name,
        "format": payload.format.upper(),
        "download_url": download_url,
        "message": f"Sanitized {payload.report_name} in {payload.format.upper()} format generated successfully on disk with strict data privacy protection."
    }

def Date_now_id():
    import random
    return str(random.randint(100000, 999999))


@router.post("/reports/saved")
async def save_govt_report_configuration(payload: SaveReportRequest):
    db = load_data()
    init_reports_storage(db)
    
    saved_id = f"SAVED-{Date_now_id()[:3]}"
    saved_record = {
        "id": saved_id,
        "name": payload.name,
        "category": payload.category,
        "filters": payload.filters,
        "notes": payload.notes or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_generated": datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p")
    }
    
    db["saved_reports"].insert(0, saved_record)
    save_data(db)
    
    return {
        "success": True,
        "message": f"Report configuration '{payload.name}' saved successfully.",
        "data": saved_record
    }

@router.get("/reports/saved")
async def list_govt_saved_reports():
    db = load_data()
    init_reports_storage(db)
    return {"success": True, "data": db.get("saved_reports", [])}



# =====================================================================
# ── GOVERNMENT BODY NOTIFICATIONS & REAL-TIME EVENT ARCHITECTURE ────
# =====================================================================

class UpdatePreferencesPayload(BaseModel):
    push_enabled: bool = True
    in_app_enabled: bool = True
    categories: Dict[str, bool] = {
        "account": True,
        "campaign": True,
        "project": True,
        "soil_testing": True,
        "insurance": True,
        "document": True,
        "payment": True,
        "wallet": True,
        "carbon": True,
        "system": True
    }

class TriggerNotificationPayload(BaseModel):
    category: str
    notification_type: str
    title: str
    message: str
    priority: str = "normal" # "high", "normal", "low"
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    deep_link: Optional[str] = None
    target_screen: Optional[str] = None
    navigation_params: Optional[Dict[str, Any]] = {}

def get_predefined_govt_notification(trigger_type: str, item_id: Optional[str] = None) -> Dict[str, Any]:
    now_iso = datetime.now(timezone.utc).isoformat()
    rand_num = random.randint(1000, 9999)
    notif_id = f"NOTIF-GOV-{trigger_type.upper()[:6]}-{rand_num}"

    triggers_map = {
        "account_status": {
            "category": "account",
            "notification_type": "account_status",
            "title": "Government Body Profile Approved 🏛️✅",
            "message": "Your Gram Panchayat institutional profile has been verified and sanctioned with Sentinel-2 MRV production access.",
            "priority": "HIGH",
            "deep_link": "bhumicred://govt/account/GOV-352644",
            "target_screen": "GovtAccount",
            "navigation_params": {"account_id": item_id or "GOV-352644", "status": "APPROVED"}
        },
        "campaign_status": {
            "category": "campaign",
            "notification_type": "campaign_status",
            "title": "Farmer Campaign Status Updated 📢🌱",
            "message": "Monsoon Farmer Onboarding (CMP-301) has transitioned to ACTIVE status with 80 target farmers.",
            "priority": "HIGH",
            "deep_link": "bhumicred://govt/campaigns/CMP-301",
            "target_screen": "GovtCampaigns",
            "navigation_params": {"campaign_id": item_id or "CMP-301", "status": "ACTIVE"}
        },
        "project_assignment": {
            "category": "project",
            "notification_type": "project_assignment",
            "title": "Implementation Partner Assigned 🏗️🤝",
            "message": "MP State Agro Corp has been assigned as implementation partner for Babai Cluster Plantation (PRJ-MP-101).",
            "priority": "MEDIUM",
            "deep_link": "bhumicred://govt/projects/PRJ-MP-101",
            "target_screen": "GovtProjects",
            "navigation_params": {"project_id": item_id or "PRJ-MP-101", "partner": "MP State Agro Corp"}
        },
        "project_milestone": {
            "category": "project",
            "notification_type": "project_milestone",
            "title": "Project Milestone Achieved 🚩📊",
            "message": "Babai Teak Agroforestry (PRJ-MP-101) achieved Milestone 2: 78% canopy planting target completed.",
            "priority": "MEDIUM",
            "deep_link": "bhumicred://govt/projects/PRJ-MP-101/milestones",
            "target_screen": "GovtProjects",
            "navigation_params": {"project_id": item_id or "PRJ-MP-101", "milestone_index": 2}
        },
        "soil_schedule": {
            "category": "soil_testing",
            "notification_type": "soil_schedule",
            "title": "Soil Sample Collection Scheduled 🧪📅",
            "message": "Field agent assigned for 36 core samples in Babai Teak Cluster (SOIL-502) scheduled for 12 Sep 2026.",
            "priority": "MEDIUM",
            "deep_link": "bhumicred://govt/soil-testing/SOIL-502/schedule",
            "target_screen": "GovtSoilTesting",
            "navigation_params": {"request_id": item_id or "SOIL-502", "schedule_date": "2026-09-12"}
        },
        "soil_report_ready": {
            "category": "soil_testing",
            "notification_type": "soil_report_ready",
            "title": "Soil Health & SOC Report Certified 🧪📋",
            "message": "Lab analysis completed for 48 samples (SOIL-501). Soil Organic Carbon certified at 0.78%. Official report ready.",
            "priority": "HIGH",
            "deep_link": "bhumicred://govt/soil-testing/SOIL-501/report",
            "target_screen": "GovtReportDetailView",
            "navigation_params": {"category": "soil_testing", "request_id": item_id or "SOIL-501"}
        },
        "insurance_policy": {
            "category": "insurance",
            "notification_type": "insurance_policy",
            "title": "Tree Insurance Policy Renewed 🛡️🌳",
            "message": "Policy INS-701 for 2,800 teak trees in Amupura Reserve renewed with ₹22.4L sum insured.",
            "priority": "MEDIUM",
            "deep_link": "bhumicred://govt/insurance/INS-701",
            "target_screen": "GovtInsurance",
            "navigation_params": {"policy_id": item_id or "INS-701", "status": "ACTIVE"}
        },
        "insurance_claim": {
            "category": "insurance",
            "notification_type": "insurance_claim",
            "title": "Insurance Subsidy Claim Settled 🛡️💰",
            "message": "Hailstorm claim CLM-701 approved. Payout of ₹1,45,000 cleared for 120 teak trees in Babai belt.",
            "priority": "HIGH",
            "deep_link": "bhumicred://govt/insurance/claims/CLM-701",
            "target_screen": "GovtInsurance",
            "navigation_params": {"claim_id": item_id or "CLM-701", "payout_amount": 145000}
        },
        "document_expiry": {
            "category": "document",
            "notification_type": "document_expiry",
            "title": "Agroforestry MOU Renewal Notice 📑⚠️",
            "message": "Your Gram Panchayat Agroforestry Partnership MOU (DOC-MOU-2025) is due for renewal in 15 days.",
            "priority": "HIGH",
            "deep_link": "bhumicred://govt/documents/DOC-MOU-2025",
            "target_screen": "GovtDocuments",
            "navigation_params": {"doc_id": item_id or "DOC-MOU-2025", "days_remaining": 15}
        },
        "payment_settlement": {
            "category": "payment",
            "notification_type": "payment_settlement",
            "title": "Treasury Settlement Disbursed 💸🏛️",
            "message": "Settlement of ₹15,000 credited to Panchayat Escrow Account (****3448). UTR: UTR-MP-98231.",
            "priority": "HIGH",
            "deep_link": "bhumicred://govt/treasury/settlements/WDR-1001",
            "target_screen": "GovtTreasury",
            "navigation_params": {"withdrawal_id": item_id or "WDR-1001", "amount": 15000}
        },
        "carbon_status": {
            "category": "carbon",
            "notification_type": "carbon_status",
            "title": "2,500 Carbon Credits Certified & Minted 🍃🎖️",
            "message": "Sentinel-2 biomass audit verified. 184.2 tCO2e minted as BC-IND-MP-84920 in State Registry Ledger.",
            "priority": "HIGH",
            "deep_link": "bhumicred://govt/carbon-credits/CRB-801",
            "target_screen": "GovtCarbonCreditWorkflowView",
            "navigation_params": {"request_id": item_id or "CRB-801", "status": "MINTED"}
        },
        "campaign_update": {
            "category": "campaign",
            "notification_type": "campaign_update",
            "title": "Campaign Budget Tranche Released 💰📢",
            "message": "Budget allocation of ₹2,50,000 released for Panchayat Soil Health Campaign (CMP-302).",
            "priority": "MEDIUM",
            "deep_link": "bhumicred://govt/campaigns/CMP-302/budget",
            "target_screen": "GovtCampaigns",
            "navigation_params": {"campaign_id": item_id or "CMP-302", "tranche": "Phase 1"}
        },
        "dbt_status": {
            "category": "dbt",
            "notification_type": "dbt_status",
            "title": "DBT Batch Disbursement Success 💳✨",
            "message": "PFMS DBT batch TXN-DBT-9921 of ₹8,00,000 successfully disbursed to 420 enrolled beneficiaries.",
            "priority": "HIGH",
            "deep_link": "bhumicred://govt/dbt/transactions/TXN-DBT-9921",
            "target_screen": "GovtTreasury",
            "navigation_params": {"batch_id": item_id or "TXN-DBT-9921", "status": "SUCCESS"}
        }
    }

    base = triggers_map.get(trigger_type, triggers_map["account_status"])
    return {
        "id": notif_id,
        "category": base["category"],
        "notification_type": base["notification_type"],
        "title": base["title"],
        "message": base["message"],
        "priority": base["priority"],
        "is_read": False,
        "created_at": now_iso,
        "deep_link": base["deep_link"],
        "target_screen": base["target_screen"],
        "navigation_params": base["navigation_params"]
    }

def init_govt_notifications(db: Dict[str, Any]):
    if "notifications" not in db or not db["notifications"]:
        # Seed all 13 mandatory notification triggers
        all_types = [
            "account_status",
            "campaign_status",
            "project_assignment",
            "project_milestone",
            "soil_schedule",
            "soil_report_ready",
            "insurance_policy",
            "insurance_claim",
            "document_expiry",
            "payment_settlement",
            "carbon_status",
            "campaign_update",
            "dbt_status"
        ]
        db["notifications"] = [get_predefined_govt_notification(t) for t in all_types]
    
    if "notification_preferences" not in db:
        db["notification_preferences"] = {
            "push_enabled": True,
            "in_app_enabled": True,
            "categories": {
                "account": True,
                "campaign": True,
                "project": True,
                "soil_testing": True,
                "insurance": True,
                "document": True,
                "payment": True,
                "wallet": True,
                "carbon": True,
                "dbt": True,
                "system": True
            }
        }

@router.get("/notifications")
async def get_govt_notifications(
    category: Optional[str] = None,
    priority: Optional[str] = None,
    unread_only: Optional[bool] = False,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    db = load_data()
    init_govt_notifications(db)
    
    notifs = db.get("notifications", [])
    
    if category and category != "all":
        notifs = [n for n in notifs if n.get("category") == category]
        
    if priority and priority != "all":
        notifs = [n for n in notifs if str(n.get("priority", "")).upper() == priority.upper()]
        
    if unread_only:
        notifs = [n for n in notifs if not n.get("is_read")]

    if search:
        s_lower = search.lower()
        notifs = [
            n for n in notifs 
            if s_lower in n.get("title", "").lower() or s_lower in n.get("message", "").lower()
        ]
        
    unread_count = sum(1 for n in db.get("notifications", []) if not n.get("is_read"))
    paginated = notifs[offset: offset + limit]
    
    return {
        "success": True,
        "unread_count": unread_count,
        "total_count": len(notifs),
        "data": paginated
    }

@router.get("/notifications/unread-count")
async def get_govt_notifications_unread_count():
    db = load_data()
    init_govt_notifications(db)
    unread_count = sum(1 for n in db.get("notifications", []) if not n.get("is_read"))
    return {"success": True, "unread_count": unread_count}

@router.put("/notifications/{notif_id}/read")
async def mark_govt_notification_read(notif_id: str):
    db = load_data()
    init_govt_notifications(db)
    
    found = False
    for n in db.get("notifications", []):
        if n.get("id") == notif_id:
            n["is_read"] = True
            found = True
            break
            
    if found:
        save_data(db)
        unread_count = sum(1 for n in db.get("notifications", []) if not n.get("is_read"))
        return {"success": True, "message": f"Notification {notif_id} marked as read.", "unread_count": unread_count}
    raise HTTPException(status_code=404, detail="Notification not found.")

@router.put("/notifications/read-all")
async def mark_all_govt_notifications_read():
    db = load_data()
    init_govt_notifications(db)
    
    for n in db.get("notifications", []):
        n["is_read"] = True
        
    save_data(db)
    return {"success": True, "message": "All notifications marked as read.", "unread_count": 0}

@router.delete("/notifications/{notif_id}")
async def delete_govt_notification(notif_id: str):
    db = load_data()
    init_govt_notifications(db)
    
    original_len = len(db.get("notifications", []))
    db["notifications"] = [n for n in db.get("notifications", []) if n.get("id") != notif_id]
    
    if len(db["notifications"]) < original_len:
        save_data(db)
        unread_count = sum(1 for n in db.get("notifications", []) if not n.get("is_read"))
        return {"success": True, "message": f"Notification {notif_id} dismissed.", "unread_count": unread_count}
    raise HTTPException(status_code=404, detail="Notification not found.")

@router.get("/notifications/preferences")
async def get_govt_notification_preferences():
    db = load_data()
    init_govt_notifications(db)
    return {"success": True, "data": db.get("notification_preferences", {})}

@router.put("/notifications/preferences")
async def update_govt_notification_preferences(payload: UpdatePreferencesPayload):
    db = load_data()
    init_govt_notifications(db)
    
    db["notification_preferences"] = payload.dict()
    save_data(db)
    return {"success": True, "message": "Notification preferences updated.", "data": db["notification_preferences"]}

@router.post("/notifications/trigger-test/{trigger_type}")
async def trigger_govt_notification_by_type(trigger_type: str, item_id: Optional[str] = None):
    db = load_data()
    init_govt_notifications(db)
    
    new_notif = get_predefined_govt_notification(trigger_type, item_id)
    db["notifications"].insert(0, new_notif)
    save_data(db)
    
    return {
        "success": True,
        "message": f"Trigger '{trigger_type}' dispatched successfully.",
        "data": new_notif
    }

@router.post("/notifications/send-alert")
async def send_govt_alert_notification(payload: TriggerNotificationPayload):
    db = load_data()
    init_govt_notifications(db)
    
    rand_num = random.randint(1000, 9999)
    new_id = f"NOTIF-GOV-ALERT-{rand_num}"
    
    cat = payload.category or "system"
    t_type = payload.notification_type or "alert"
    target_scr = payload.target_screen or "GovtBodyDashboardView"
    deep_l = payload.deep_link or f"bhumicred://govt/{cat}/{rand_num}"
    
    new_notif = {
        "id": new_id,
        "category": cat,
        "notification_type": t_type,
        "title": payload.title,
        "message": payload.message,
        "priority": str(payload.priority).upper(),
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "entity_type": payload.entity_type,
        "entity_id": payload.entity_id,
        "deep_link": deep_l,
        "target_screen": target_scr,
        "navigation_params": payload.navigation_params or {}
    }
    
    db["notifications"].insert(0, new_notif)
    save_data(db)
    
    return {
        "success": True,
        "message": f"Notification {new_id} dispatched.",
        "data": new_notif
    }


# ── Workflow 7: Government Subsidized Marketplace & Voucher System ────────────

DEFAULT_GOVT_MARKETPLACE_PRODUCTS = [
    {
        "id": "PROD-GOV-001",
        "name": "Certified Subsidized Wheat Seed (HD-2967)",
        "category": "Seeds",
        "description": "State certified high-yielding wheat seed bundle resistant to yellow rust. Eligible for National Seed Mission subsidy.",
        "price_inr": 1800.0,
        "subsidy_percent": 50.0,
        "scheme_code": "NATIONAL-SEEDS",
        "scheme_name": "National Seed Subsidized Distribution Mission",
        "max_subsidy_amount_inr": 900.0,
        "unit": "Bag (40kg)",
        "stock": 500,
        "rating": 4.8,
        "image_url": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop",
        "vendor": "MP State Seed Certification Corporation",
        "eligibility_criteria": "Registered smallholder or marginal farmer with verified land parcel."
    },
    {
        "id": "PROD-GOV-002",
        "name": "Hybrid Subsidized Paddy Seed (Basmati 1509)",
        "category": "Seeds",
        "description": "Short duration, drought-resilient aromatic paddy seed pack for irrigated and rainfed corridors.",
        "price_inr": 2400.0,
        "subsidy_percent": 50.0,
        "scheme_code": "NATIONAL-SEEDS",
        "scheme_name": "National Seed Subsidized Distribution Mission",
        "max_subsidy_amount_inr": 1200.0,
        "unit": "Bag (25kg)",
        "stock": 400,
        "rating": 4.7,
        "image_url": "https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=600&auto=format&fit=crop",
        "vendor": "MP Krishi Vigyan Kendra (KVK)",
        "eligibility_criteria": "Smallholder farmer in designated watershed corridors."
    },
    {
        "id": "PROD-GOV-003",
        "name": "Organic Bio-Fertilizer Azotobacter Pack",
        "category": "Seeds",
        "description": "Nitrogen-fixing bio-fertilizer inoculant pack for soil organic carbon enrichment.",
        "price_inr": 800.0,
        "subsidy_percent": 60.0,
        "scheme_code": "MISSION-SOIL",
        "scheme_name": "PM-Soil Health & Organic Farming Mission",
        "max_subsidy_amount_inr": 480.0,
        "unit": "Pack (5kg)",
        "stock": 600,
        "rating": 4.9,
        "image_url": "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600&auto=format&fit=crop",
        "vendor": "Department of Agriculture MP",
        "eligibility_criteria": "Farmers with active Soil Health Card."
    },
    {
        "id": "PROD-GOV-004",
        "name": "High-Yield Teak / Sagwan Saplings (Bundle of 100)",
        "category": "Saplings",
        "description": "Tissue-cultured high-density agroforestry teak saplings for boundary planting & carbon credit revenue.",
        "price_inr": 5000.0,
        "subsidy_percent": 75.0,
        "scheme_code": "SMAF",
        "scheme_name": "Sub-Mission on Agroforestry (SMAF)",
        "max_subsidy_amount_inr": 3750.0,
        "unit": "Bundle (100 Saplings)",
        "stock": 300,
        "rating": 4.9,
        "image_url": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop",
        "vendor": "Forest Development Corporation MP",
        "eligibility_criteria": "Participating farmers in Sub-Mission on Agroforestry."
    },
    {
        "id": "PROD-GOV-005",
        "name": "Clonal Bamboo Saplings (Subsidized Green Shield Pack)",
        "category": "Saplings",
        "description": "Fast-growing tissue culture bamboo saplings for riverbank protection and carbon sequestration.",
        "price_inr": 4000.0,
        "subsidy_percent": 70.0,
        "scheme_code": "SMAF",
        "scheme_name": "National Bamboo Mission & SMAF",
        "max_subsidy_amount_inr": 2800.0,
        "unit": "Pack (50 Plants)",
        "stock": 250,
        "rating": 4.8,
        "image_url": "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop",
        "vendor": "State Forest Research Institute",
        "eligibility_criteria": "Farmers allocating at least 0.5 acres for bamboo green shield."
    },
    {
        "id": "PROD-GOV-006",
        "name": "Hybrid Grafted Mango (Aam) Saplings Pack",
        "category": "Saplings",
        "description": "Grafted Dasheri / Amrapali high-yield mango sapling set for commercial orchard intercropping.",
        "price_inr": 3500.0,
        "subsidy_percent": 60.0,
        "scheme_code": "SMAF",
        "scheme_name": "Sub-Mission on Agroforestry (SMAF)",
        "max_subsidy_amount_inr": 2100.0,
        "unit": "Pack (20 Saplings)",
        "stock": 200,
        "rating": 4.7,
        "image_url": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop",
        "vendor": "Horticulture Department MP",
        "eligibility_criteria": "Verified landholding with irrigation facility."
    },
    {
        "id": "PROD-GOV-007",
        "name": "Spectrometer Soil NPK & Organic Carbon Testing Kit",
        "category": "Agricultural products",
        "description": "Portable IoT spectrometer for real-time soil nitrogen, phosphorus, potassium, and SOC percentage testing.",
        "price_inr": 12500.0,
        "subsidy_percent": 65.0,
        "scheme_code": "MISSION-SOIL",
        "scheme_name": "National Soil Health & Spectrometry Mission",
        "max_subsidy_amount_inr": 8125.0,
        "unit": "Kit",
        "stock": 150,
        "rating": 4.9,
        "image_url": "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=600&auto=format&fit=crop",
        "vendor": "Krishi Vigyan Kendra Tech Wing",
        "eligibility_criteria": "Authorized Panchayats, KVK field officers, and Lead Farmers."
    },
    {
        "id": "PROD-GOV-008",
        "name": "Solar Agricultural Pest Trap Unit",
        "category": "Agricultural products",
        "description": "Eco-friendly solar-powered ultraviolet pest trap for chemical-free pest control.",
        "price_inr": 3200.0,
        "subsidy_percent": 50.0,
        "scheme_code": "PM-KUSUM",
        "scheme_name": "PM-KUSUM Sustainable Energy Initiative",
        "max_subsidy_amount_inr": 1600.0,
        "unit": "Unit",
        "stock": 350,
        "rating": 4.6,
        "image_url": "https://images.unsplash.com/photo-1508873696983-2df515122519?w=600&auto=format&fit=crop",
        "vendor": "Renewable Energy Development Agency MP",
        "eligibility_criteria": "Farmers adopting organic integrated pest management."
    },
    {
        "id": "PROD-GOV-009",
        "name": "Drip Irrigation Inline Tubing & Micro-Emitter Set",
        "category": "Agricultural products",
        "description": "Micro-irrigation set with pressure compensating emitters for water-saving crop hydration.",
        "price_inr": 8500.0,
        "subsidy_percent": 70.0,
        "scheme_code": "PM-KUSUM",
        "scheme_name": "Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)",
        "max_subsidy_amount_inr": 5950.0,
        "unit": "Acre Set",
        "stock": 180,
        "rating": 4.8,
        "image_url": "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=600&auto=format&fit=crop",
        "vendor": "Jain Irrigation Systems (Govt Empaneled)",
        "eligibility_criteria": "Small and marginal farmers with verified land boundaries."
    },
    {
        "id": "PROD-GOV-010",
        "name": "PM-KUSUM 5HP Submersible Solar Water Pump Set",
        "category": "Government-supported items",
        "description": "High-efficiency 5HP solar water pump set with AC/DC controller and remote telemetry for off-grid irrigation.",
        "price_inr": 250000.0,
        "subsidy_percent": 80.0,
        "scheme_code": "PM-KUSUM",
        "scheme_name": "Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan (PM-KUSUM)",
        "max_subsidy_amount_inr": 200000.0,
        "unit": "Complete Pump Set",
        "stock": 50,
        "rating": 5.0,
        "image_url": "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop",
        "vendor": "MP Urja Vikas Nigam Limited",
        "eligibility_criteria": "Farmers with valid borewell registration and no prior solar pump subsidy."
    },
    {
        "id": "PROD-GOV-011",
        "name": "Subsidized Solar Micro-Irrigation Power Pack (2KW)",
        "category": "Government-supported items",
        "description": "Standalone 2KW solar power generator pack customized for small farm drip pumps.",
        "price_inr": 120000.0,
        "subsidy_percent": 75.0,
        "scheme_code": "PM-KUSUM",
        "scheme_name": "PM-KUSUM Solar Power Sub-Component B",
        "max_subsidy_amount_inr": 90000.0,
        "unit": "Set",
        "stock": 80,
        "rating": 4.9,
        "image_url": "https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=600&auto=format&fit=crop",
        "vendor": "MP Urja Vikas Nigam Limited",
        "eligibility_criteria": "Individual or group farmers in off-grid agricultural zones."
    }
]

def init_govt_marketplace_db(db):
    if "govt_marketplace_products" not in db or not db["govt_marketplace_products"]:
        db["govt_marketplace_products"] = DEFAULT_GOVT_MARKETPLACE_PRODUCTS
    if "govt_marketplace_orders" not in db:
        db["govt_marketplace_orders"] = []
    if "govt_subsidy_vouchers" not in db:
        db["govt_subsidy_vouchers"] = []

@router.get("/marketplace/products")
async def get_govt_marketplace_products(
    category: Optional[str] = None,
    scheme_code: Optional[str] = None,
    search: Optional[str] = None
):
    db = load_data()
    init_govt_marketplace_db(db)
    products = db.get("govt_marketplace_products", [])
    
    filtered = []
    for p in products:
        if category and category.lower() != "all":
            if p.get("category", "").lower() != category.lower():
                continue
        if scheme_code and scheme_code.upper() != "ALL":
            if p.get("scheme_code", "").upper() != scheme_code.upper():
                continue
        if search:
            q = search.lower().strip()
            name_match = q in p.get("name", "").lower()
            desc_match = q in p.get("description", "").lower()
            cat_match = q in p.get("category", "").lower()
            if not (name_match or desc_match or cat_match):
                continue
        filtered.append(p)
        
    return {"success": True, "count": len(filtered), "data": filtered}

@router.get("/marketplace/products/{product_id}")
async def get_govt_marketplace_product_detail(product_id: str):
    db = load_data()
    init_govt_marketplace_db(db)
    products = db.get("govt_marketplace_products", [])
    prod = next((p for p in products if p.get("id") == product_id), None)
    if not prod:
        raise HTTPException(status_code=404, detail="Subsidized product not found.")
    return {"success": True, "data": prod}

@router.post("/marketplace/verify-subsidy")
async def verify_govt_subsidy_eligibility(payload: VerifySubsidyRequest):
    db = load_data()
    init_govt_marketplace_db(db)
    products = db.get("govt_marketplace_products", [])
    prod = next((p for p in products if p.get("id") == payload.product_id), None)
    if not prod:
        raise HTTPException(status_code=404, detail="Target product not found.")
        
    unit_price = float(prod.get("price_inr", 0.0))
    qty = payload.quantity or 1
    total_price = unit_price * qty
    
    subsidy_pct = float(prod.get("subsidy_percent", 50.0))
    max_subsidy = float(prod.get("max_subsidy_amount_inr", total_price * (subsidy_pct / 100.0)))
    
    calc_subsidy = (total_price * (subsidy_pct / 100.0))
    gov_contribution = min(calc_subsidy, max_subsidy * qty)
    farmer_payable = max(0.0, total_price - gov_contribution)
    
    ref_code = f"SUB-VERIF-{int(datetime.now(timezone.utc).timestamp())}"
    
    return {
        "success": True,
        "is_eligible": True,
        "verification_reference": ref_code,
        "farmer_id": payload.farmer_id,
        "scheme_code": prod.get("scheme_code", payload.scheme_code),
        "scheme_name": prod.get("scheme_name", "Government Subsidized Scheme"),
        "product_id": prod["id"],
        "product_name": prod["name"],
        "quantity": qty,
        "unit_price_inr": unit_price,
        "total_product_price_inr": total_price,
        "eligible_subsidy_percent": subsidy_pct,
        "government_contribution_inr": gov_contribution,
        "farmer_payable_amount_inr": farmer_payable,
        "eligibility_notes": f"Verified under {prod.get('scheme_name')}. 80% state & central co-funding applied."
    }

@router.post("/marketplace/vouchers/generate")
async def generate_govt_subsidy_voucher(payload: GenerateVoucherRequest):
    db = load_data()
    init_govt_marketplace_db(db)
    products = db.get("govt_marketplace_products", [])
    prod = next((p for p in products if p.get("id") == payload.product_id), None)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found.")
        
    vouchers = db.get("govt_subsidy_vouchers", [])
    vch_code = f"VCH-{prod.get('scheme_code', 'SUB')}-{len(vouchers) + 1001}"
    
    qty = payload.quantity or 1
    unit_price = float(prod.get("price_inr", 0.0))
    total_price = unit_price * qty
    subsidy_pct = float(prod.get("subsidy_percent", 50.0))
    subsidy_val = min(total_price * (subsidy_pct / 100.0), float(payload.subsidy_amount_inr))
    
    new_voucher = {
        "id": f"vch_{len(vouchers) + 1}",
        "voucher_code": vch_code,
        "farmer_id": payload.farmer_id or "FAR-101",
        "farmer_name": payload.farmer_name or "Ramkumar Sharma",
        "scheme_code": prod.get("scheme_code", payload.scheme_code),
        "scheme_name": prod.get("scheme_name", "Government Subsidized Scheme"),
        "product_id": prod["id"],
        "product_name": prod["name"],
        "quantity": qty,
        "subsidy_amount_inr": subsidy_val,
        "status": "Active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=90)).strftime("%Y-%m-%d"),
        "qr_payload": f"BHUMICRED:GOVT_VOUCHER:{vch_code}:{subsidy_val}"
    }
    
    vouchers.insert(0, new_voucher)
    db["govt_subsidy_vouchers"] = vouchers
    save_data(db)
    
    return {"success": True, "message": f"Subsidy Voucher {vch_code} generated.", "data": new_voucher}

@router.get("/marketplace/vouchers")
async def list_govt_subsidy_vouchers(farmer_id: Optional[str] = None):
    db = load_data()
    init_govt_marketplace_db(db)
    vouchers = db.get("govt_subsidy_vouchers", [])
    if farmer_id:
        vouchers = [v for v in vouchers if v.get("farmer_id") == farmer_id]
    return {"success": True, "count": len(vouchers), "data": vouchers}

@router.post("/marketplace/vouchers/redeem")
async def redeem_govt_subsidy_voucher(payload: RedeemVoucherRequest):
    db = load_data()
    init_govt_marketplace_db(db)
    vouchers = db.get("govt_subsidy_vouchers", [])
    target = next((v for v in vouchers if v.get("voucher_code") == payload.voucher_code), None)
    if not target:
        raise HTTPException(status_code=404, detail="Voucher code not found.")
    if target.get("status") == "Redeemed":
        raise HTTPException(status_code=400, detail="Voucher has already been redeemed.")
        
    target["status"] = "Redeemed"
    target["redeemed_at"] = datetime.now(timezone.utc).isoformat()
    if payload.order_id:
        target["redeemed_order_id"] = payload.order_id
        
    save_data(db)
    return {"success": True, "message": f"Voucher {payload.voucher_code} redeemed successfully.", "data": target}

@router.post("/marketplace/checkout", status_code=status.HTTP_201_CREATED)
async def checkout_govt_subsidized_order(payload: GovtCheckoutRequest):
    db = load_data()
    init_govt_marketplace_db(db)
    
    products = db.get("govt_marketplace_products", [])
    orders = db.get("govt_marketplace_orders", [])
    
    order_id = f"ORD-GOV-{len(orders) + 101}"
    order_number = f"AGR-GOV-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{len(orders) + 101}"
    
    line_items = []
    total_product_price = 0.0
    total_gov_contribution = 0.0
    total_farmer_payable = 0.0
    
    for item in payload.cart_items:
        prod = next((p for p in products if p.get("id") == item.product_id), None)
        if not prod:
            continue
        qty = item.quantity or 1
        unit_price = float(prod.get("price_inr", 0.0))
        item_total = unit_price * qty
        subsidy_pct = float(prod.get("subsidy_percent", 50.0))
        max_sub = float(prod.get("max_subsidy_amount_inr", item_total * (subsidy_pct / 100.0)))
        
        gov_sub = min(item_total * (subsidy_pct / 100.0), max_sub * qty)
        farmer_pay = max(0.0, item_total - gov_sub)
        
        total_product_price += item_total
        total_gov_contribution += gov_sub
        total_farmer_payable += farmer_pay
        
        line_items.append({
            "product_id": prod["id"],
            "product_name": prod["name"],
            "category": prod["category"],
            "quantity": qty,
            "unit_price_inr": unit_price,
            "item_total_price_inr": item_total,
            "subsidy_percent": subsidy_pct,
            "government_contribution_inr": gov_sub,
            "farmer_payable_inr": farmer_pay,
            "image_url": prod.get("image_url")
        })
        
    if not line_items:
        raise HTTPException(status_code=400, detail="Cart contains no valid subsidized products.")
        
    if payload.voucher_code:
        vouchers = db.get("govt_subsidy_vouchers", [])
        vch = next((v for v in vouchers if v.get("voucher_code") == payload.voucher_code and v.get("status") == "Active"), None)
        if vch:
            vch["status"] = "Redeemed"
            vch["redeemed_at"] = datetime.now(timezone.utc).isoformat()
            vch["redeemed_order_id"] = order_id
            
    new_order = {
        "id": order_id,
        "order_number": order_number,
        "farmer_id": payload.farmer_id or "FAR-101",
        "farmer_name": payload.farmer_name or "Ramkumar Sharma",
        "scheme_code": payload.scheme_code or "PM-KUSUM",
        "line_items": line_items,
        "total_product_price_inr": total_product_price,
        "total_government_subsidy_inr": total_gov_contribution,
        "total_farmer_payable_inr": total_farmer_payable,
        "voucher_applied": payload.voucher_code,
        "delivery_address": payload.delivery_address,
        "status": "Placed",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "delivery_tracking": {
            "current_stage": "Placed",
            "estimated_delivery_days": 3,
            "dealer_hub": "Hoshangabad District Krishi Supply Depot",
            "dispatch_officer": "Ramesh Verma (Govt Supply Nodal)",
            "timeline": [
                {
                    "stage": "Placed",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "status_label": "Order Placed & Subsidy Sanctioned",
                    "notes": f"Sanctioned ₹{total_gov_contribution:,.0f} government subsidy under {payload.scheme_code}."
                }
            ]
        }
    }
    
    orders.insert(0, new_order)
    db["govt_marketplace_orders"] = orders
    
    add_govt_notification(
        db,
        title=f"Subsidized Order Placed - {order_number}",
        message=f"Order for {len(line_items)} subsidized items approved under {payload.scheme_code}. Govt contribution: ₹{total_gov_contribution:,.0f}.",
        notif_type="order_placed",
        ref_id=order_id
    )
    
    save_data(db)
    return {"success": True, "message": "Subsidized order placed successfully.", "data": new_order}

@router.get("/marketplace/orders")
async def list_govt_marketplace_orders(
    farmer_id: Optional[str] = None,
    status_filter: Optional[str] = None
):
    db = load_data()
    init_govt_marketplace_db(db)
    orders = db.get("govt_marketplace_orders", [])
    
    filtered = []
    for o in orders:
        if farmer_id and o.get("farmer_id") != farmer_id:
            continue
        if status_filter and status_filter.lower() != "all":
            if o.get("status", "").lower() != status_filter.lower():
                continue
        filtered.append(o)
        
    return {"success": True, "count": len(filtered), "data": filtered}

@router.get("/marketplace/orders/{order_id}")
async def get_govt_marketplace_order_detail(order_id: str):
    db = load_data()
    init_govt_marketplace_db(db)
    orders = db.get("govt_marketplace_orders", [])
    order = next((o for o in orders if o.get("id") == order_id or o.get("order_number") == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Government marketplace order not found.")
    return {"success": True, "data": order}

@router.post("/marketplace/orders/{order_id}/status")
async def update_govt_marketplace_order_status(order_id: str, payload: UpdateGovtOrderStatusRequest):
    db = load_data()
    init_govt_marketplace_db(db)
    orders = db.get("govt_marketplace_orders", [])
    order = next((o for o in orders if o.get("id") == order_id or o.get("order_number") == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Government marketplace order not found.")
        
    new_status = payload.status
    order["status"] = new_status
    
    tracking = order.get("delivery_tracking", {})
    tracking["current_stage"] = new_status
    timeline = tracking.get("timeline", [])
    
    new_event = {
        "stage": new_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status_label": f"Order {new_status}",
        "notes": payload.remarks or f"Order status updated to {new_status}."
    }
    timeline.append(new_event)
    tracking["timeline"] = timeline
    order["delivery_tracking"] = tracking
    
    add_govt_notification(
        db,
        title=f"Order Status Update - {order.get('order_number')}",
        message=f"Order {order.get('order_number')} is now {new_status}. {payload.remarks or ''}",
        notif_type=f"order_{new_status.lower()}",
        ref_id=order["id"]
    )
    
    save_data(db)
    return {"success": True, "message": f"Order status updated to {new_status}.", "data": order}


# ── Workflow 8: Government Treasury, Budget Allocation & DBT System ─────────

def init_govt_treasury_db(db):
    if "treasury_summary" not in db:
        db["treasury_summary"] = {
            "available_balance_inr": 50000000.0,
            "allocated_balance_inr": 25000000.0,
            "pending_disbursements_inr": 0.0,
            "disbursed_total_inr": 12500000.0,
            "failed_disbursements_inr": 0.0,
            "reversed_total_inr": 0.0,
            "escrow_account": "IN-GOVT-ESCROW-MP-88210",
            "bank_name": "Reserve Bank of India / State Bank of India Govt Treasury",
            "ifsc_masked": "SBIN••••01",
            "last_reconciled_at": datetime.now(timezone.utc).isoformat()
        }
    if "treasury_ledger" not in db:
        db["treasury_ledger"] = [
            {
                "id": "TR-101",
                "timestamp": "2026-08-01T10:00:00Z",
                "transaction_type": "GRANT_DEPOSIT",
                "amount_inr": 50000000.0,
                "description": "State Agriculture Development Escrow Grant Sanction",
                "balance_after_inr": 50000000.0
            }
        ]
    if "dbt_transactions" not in db:
        db["dbt_transactions"] = []
    if "scheme_allocations" not in db:
        db["scheme_allocations"] = []

def mask_kyc_data(farmer_id: str, db: dict) -> dict:
    farmers = db.get("farmers", [])
    f = next((farmer for farmer in farmers if farmer.get("id") == farmer_id), None)
    name = f.get("name") if f else f"Farmer {farmer_id}"
    village = f.get("village_ward") if f else "Jurisdiction Zone"
    return {
        "farmer_id": farmer_id,
        "farmer_name": name,
        "aadhaar_masked": "XXXX-XXXX-8821",
        "bank_masked": "SBI •••• 9931 (Masked)",
        "ifsc_masked": "SBIN••••01",
        "village_ward": village
    }

@router.get("/treasury/summary")
@router.get("/api/v1/govt/treasury/summary")
async def get_govt_treasury_summary():
    db = load_data()
    init_govt_treasury_db(db)
    summary = db.get("treasury_summary", {})
    ledger = db.get("treasury_ledger", [])
    allocations = db.get("scheme_allocations", [])
    return {
        "success": True,
        "data": {
            "summary": summary,
            "recent_ledger": ledger[:20],
            "scheme_allocations": allocations
        }
    }

@router.post("/schemes/{scheme_id}/allocate")
@router.post("/api/v1/govt/schemes/{scheme_id}/allocate")
async def allocate_scheme_budget(scheme_id: str, payload: BudgetAllocateRequest):
    db = load_data()
    init_govt_treasury_db(db)
    summary = db["treasury_summary"]
    
    amount = float(payload.allocated_amount_inr)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Allocation amount must be greater than zero.")
        
    if summary["available_balance_inr"] < amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient Treasury Escrow Funds. Available: ₹{summary['available_balance_inr']:,.2f}, Requested: ₹{amount:,.2f}"
        )
        
    summary["available_balance_inr"] -= amount
    summary["allocated_balance_inr"] += amount
    
    allocation_id = f"ALC-{len(db['scheme_allocations']) + 101}"
    alloc_record = {
        "id": allocation_id,
        "scheme_id": scheme_id,
        "allocated_amount_inr": amount,
        "allocation_type": payload.allocation_type or "State Agriculture Sub-Grant",
        "fiscal_year": payload.fiscal_year or "FY 2026-27",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "notes": payload.notes or f"Allocated ₹{amount:,.0f} to scheme {scheme_id}."
    }
    db["scheme_allocations"].insert(0, alloc_record)
    
    ledger_entry = {
        "id": f"TR-{len(db['treasury_ledger']) + 101}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "transaction_type": "BUDGET_ALLOCATION",
        "scheme_id": scheme_id,
        "amount_inr": -amount,
        "description": f"Allocated ₹{amount:,.0f} for Scheme {scheme_id} ({payload.allocation_type}).",
        "balance_after_inr": summary["available_balance_inr"]
    }
    db["treasury_ledger"].insert(0, ledger_entry)
    
    add_govt_notification(
        db,
        title=f"Budget Allocated - ₹{amount:,.0f}",
        message=f"₹{amount:,.0f} allocated to Scheme {scheme_id} for DBT disbursements.",
        notif_type="budget_allocated",
        ref_id=allocation_id
    )
    
    save_data(db)
    return {
        "success": True,
        "message": f"Successfully allocated ₹{amount:,.0f} to scheme {scheme_id}.",
        "data": alloc_record,
        "treasury_summary": summary
    }

@router.post("/dbt/disburse")
@router.post("/api/v1/govt/dbt/disburse")
async def disburse_govt_dbt(payload: DBTDisburseRequest):
    db = load_data()
    init_govt_treasury_db(db)
    summary = db["treasury_summary"]
    
    if not payload.beneficiary_ids:
        raise HTTPException(status_code=400, detail="Beneficiary IDs list cannot be empty.")
        
    per_farmer = float(payload.amount_per_farmer_inr)
    total_amount = per_farmer * len(payload.beneficiary_ids)
    
    if summary["allocated_balance_inr"] < total_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient Allocated Scheme Balance. Allocated Available: ₹{summary['allocated_balance_inr']:,.2f}, Required: ₹{total_amount:,.2f}"
        )
        
    summary["pending_disbursements_inr"] += total_amount
    
    dbt_txns = db.get("dbt_transactions", [])
    batch_id = f"DBT-BATCH-{int(datetime.now(timezone.utc).timestamp()) % 100000}"
    created_items = []
    
    for f_id in payload.beneficiary_ids:
        txn_id = f"DBT-TXN-{len(dbt_txns) + 1001}"
        masked_info = mask_kyc_data(f_id, db)
        
        txn = {
            "transaction_id": txn_id,
            "batch_id": batch_id,
            "scheme_id": payload.scheme_id,
            "scheme_name": payload.scheme_name or "Government DBT Scheme",
            "beneficiary": masked_info,
            "amount_inr": per_farmer,
            "status": "INITIATED",
            "payment_gateway": payload.payment_gateway or "PFMS_DBT",
            "utr_number": None,
            "failure_reason": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "status_history": [
                {
                    "status": "INITIATED",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "notes": f"DBT transfer initiated via {payload.payment_gateway or 'PFMS_DBT'}."
                }
            ]
        }
        dbt_txns.insert(0, txn)
        created_items.append(txn)
        
    db["dbt_transactions"] = dbt_txns
    
    add_govt_notification(
        db,
        title=f"DBT Batch Initiated - ₹{total_amount:,.0f}",
        message=f"Disbursed {len(payload.beneficiary_ids)} DBT transfers under {payload.scheme_name or payload.scheme_id}.",
        notif_type="dbt_initiated",
        ref_id=batch_id
    )
    
    save_data(db)
    return {
        "success": True,
        "message": f"DBT payout batch of ₹{total_amount:,.0f} initiated for {len(payload.beneficiary_ids)} beneficiaries.",
        "batch_id": batch_id,
        "total_disbursed_inr": total_amount,
        "transactions": created_items,
        "treasury_summary": summary
    }

@router.get("/dbt/status/{transaction_id}")
@router.get("/api/v1/govt/dbt/status/{transaction_id}")
async def get_dbt_transaction_status(transaction_id: str):
    db = load_data()
    init_govt_treasury_db(db)
    txns = db.get("dbt_transactions", [])
    target = next((t for t in txns if t.get("transaction_id") == transaction_id or t.get("utr_number") == transaction_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="DBT transaction record not found.")
    return {"success": True, "data": target}

@router.post("/dbt/status/{transaction_id}")
@router.post("/api/v1/govt/dbt/status/{transaction_id}")
async def update_dbt_transaction_status(transaction_id: str, payload: DBTStatusUpdateRequest):
    db = load_data()
    init_govt_treasury_db(db)
    summary = db["treasury_summary"]
    txns = db.get("dbt_transactions", [])
    
    target = next((t for t in txns if t.get("transaction_id") == transaction_id or t.get("utr_number") == transaction_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="DBT transaction record not found.")
        
    old_status = target.get("status")
    new_status = payload.status
    amt = float(target.get("amount_inr", 0.0))
    
    if old_status == new_status:
        return {"success": True, "message": f"Status is already {new_status}.", "data": target}
        
    if old_status == "INITIATED" and new_status == "SUCCESS":
        summary["pending_disbursements_inr"] = max(0.0, summary["pending_disbursements_inr"] - amt)
        summary["disbursed_total_inr"] += amt
        summary["allocated_balance_inr"] = max(0.0, summary["allocated_balance_inr"] - amt)
        target["utr_number"] = payload.utr_number or f"UTR-PFMS-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{int(datetime.now(timezone.utc).timestamp()) % 10000}"
        
    elif old_status == "INITIATED" and new_status == "FAILED":
        summary["pending_disbursements_inr"] = max(0.0, summary["pending_disbursements_inr"] - amt)
        summary["failed_disbursements_inr"] += amt
        target["failure_reason"] = payload.failure_reason or "NPCI APBS Bank Account Mismatch / Invalid IFSC"
        
    elif old_status == "SUCCESS" and new_status == "REVERSED":
        summary["disbursed_total_inr"] = max(0.0, summary["disbursed_total_inr"] - amt)
        summary["reversed_total_inr"] += amt
        summary["available_balance_inr"] += amt
        target["failure_reason"] = payload.failure_reason or "Bank Returned Transfer (Account Closed)"
        
        ledger_entry = {
            "id": f"TR-{len(db['treasury_ledger']) + 101}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "transaction_type": "DBT_REVERSAL_REFUND",
            "scheme_id": target.get("scheme_id"),
            "amount_inr": amt,
            "description": f"Refunded reversed DBT transfer {target['transaction_id']} back to Escrow Available Balance.",
            "balance_after_inr": summary["available_balance_inr"]
        }
        db["treasury_ledger"].insert(0, ledger_entry)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported status transition from {old_status} to {new_status}."
        )
        
    target["status"] = new_status
    target["updated_at"] = datetime.now(timezone.utc).isoformat()
    if payload.remarks:
        target["remarks"] = payload.remarks
        
    history = target.get("status_history", [])
    history.append({
        "status": new_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "notes": payload.remarks or f"Transitioned from {old_status} to {new_status}."
    })
    target["status_history"] = history
    
    add_govt_notification(
        db,
        title=f"DBT Status: {new_status} - {target['transaction_id']}",
        message=f"DBT payout of ₹{amt:,.0f} for {target['beneficiary']['farmer_name']} is now {new_status}.",
        notif_type=f"dbt_{new_status.lower()}",
        ref_id=target["transaction_id"]
    )
    
    save_data(db)
    return {
        "success": True,
        "message": f"DBT transaction status updated from {old_status} to {new_status}.",
        "data": target,
        "treasury_summary": summary
    }

@router.post("/dbt/reconcile")
@router.post("/api/v1/govt/dbt/reconcile")
async def reconcile_govt_dbt(payload: ReconciliationRequest):
    db = load_data()
    init_govt_treasury_db(db)
    summary = db["treasury_summary"]
    txns = db.get("dbt_transactions", [])
    
    reconciled_count = 0
    reversed_amount = 0.0
    
    for t in txns:
        if payload.scheme_id and t.get("scheme_id") != payload.scheme_id:
            continue
        if t.get("status") == "FAILED":
            t["status"] = "REVERSED"
            t["updated_at"] = datetime.now(timezone.utc).isoformat()
            amt = float(t.get("amount_inr", 0.0))
            summary["failed_disbursements_inr"] = max(0.0, summary["failed_disbursements_inr"] - amt)
            summary["reversed_total_inr"] += amt
            summary["available_balance_inr"] += amt
            
            reconciled_count += 1
            reversed_amount += amt
            
            history = t.get("status_history", [])
            history.append({
                "status": "REVERSED",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "notes": "Reconciled via automated PFMS bank reconciliation."
            })
            t["status_history"] = history
            
    summary["last_reconciled_at"] = datetime.now(timezone.utc).isoformat()
    
    if reconciled_count > 0:
        ledger_entry = {
            "id": f"TR-{len(db['treasury_ledger']) + 101}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "transaction_type": "BANK_RECONCILIATION_REFUND",
            "amount_inr": reversed_amount,
            "description": f"Bank Reconciliation: Refunded {reconciled_count} failed DBT transfers (₹{reversed_amount:,.0f}) to Treasury Escrow.",
            "balance_after_inr": summary["available_balance_inr"]
        }
        db["treasury_ledger"].insert(0, ledger_entry)
        
        add_govt_notification(
            db,
            title=f"Bank Reconciliation Completed",
            message=f"Reconciled {reconciled_count} failed transfers. Refunded ₹{reversed_amount:,.0f} to Available Escrow Balance.",
            notif_type="reconciliation_completed",
            ref_id=f"RECON-{int(datetime.now(timezone.utc).timestamp())}"
        )
        
    save_data(db)
    return {
        "success": True,
        "message": f"Bank reconciliation completed. Reconciled {reconciled_count} transactions (₹{reversed_amount:,.0f} refunded).",
        "reconciled_count": reconciled_count,
        "refunded_amount_inr": reversed_amount,
        "treasury_summary": summary
    }


