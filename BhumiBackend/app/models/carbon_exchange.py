from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Dict, Any
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel, ASCENDING, DESCENDING


# ── Enums ──────────────────────────────────────────────────────────────────────

class OrderType(str, Enum):
    BUY = "buy"
    SELL = "sell"

class OrderStatus(str, Enum):
    OPEN = "open"
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"
    CANCELLED = "cancelled"

class AlertType(str, Enum):
    WILDFIRE = "wildfire"
    DEFORESTATION = "deforestation"
    FLOOD = "flood"
    DOUBLE_COUNTING = "double_counting"
    GEO_FENCE_BREACH = "geo_fence_breach"

class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# ── Embedded GeoJSON Schemas ──────────────────────────────────────────────────

class GeoJSONPoint(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]


# ── Top-Level Beanie Document Collections ───────────────────────────────────

class CarbonPriceTicker(Document):
    ticker_id: str = Field(..., description="Unique Ticker ID, e.g., TCK-PROJ-2026-08-04")
    project_id: PydanticObjectId
    date: str = Field(..., description="YYYY-MM-DD format")
    opening_price_inr: float = Field(..., gt=0)
    closing_price_inr: float = Field(..., gt=0)
    vwap_price_inr: float = Field(..., gt=0)
    total_volume_tco2e: float = Field(default=0.0, ge=0)
    trade_count: int = Field(default=0, ge=0)

    class Settings:
        name = "carbon_price_tickers"
        indexes = [
            IndexModel([("ticker_id", ASCENDING)], unique=True),
            IndexModel([("project_id", ASCENDING), ("date", ASCENDING)], unique=True)
        ]


class CorporateBRSRAudit(Document):
    audit_id: str = Field(..., description="Unique BRSR Audit Ref, e.g., BRSR-TATA-2026")
    corporate_id: PydanticObjectId
    reporting_year: int = 2026
    sebi_filing_ref: str = Field(..., description="SEBI Ack Number")
    auditor_firm_name: str = "Big 4 ESG Audit LLP"
    compliance_status: str = "compliant"
    audit_report_url: str

    class Settings:
        name = "corporate_brsr_audits"
        indexes = [
            IndexModel([("audit_id", ASCENDING)], unique=True),
            IndexModel([("sebi_filing_ref", ASCENDING)], unique=True),
            IndexModel([("corporate_id", ASCENDING), ("reporting_year", ASCENDING)])
        ]


class CommandCenterThermalHotspot(Document):
    hotspot_id: str = Field(..., description="Unique Thermal Anomaly ID, e.g., HOTSPOT-NASA-0089")
    land_id: PydanticObjectId
    frp_mw: float = Field(..., description="Fire Radiative Power in MW")
    confidence_percent: float = Field(..., ge=0.0, le=100.0)
    satellite: str = "VIIRS_NPP"
    detected_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "command_center_thermal_hotspots"
        indexes = [
            IndexModel([("hotspot_id", ASCENDING)], unique=True),
            IndexModel([("land_id", ASCENDING), ("detected_at", DESCENDING)])
        ]


class CarbonTradingOrder(Document):
    order_id: str = Field(..., description="Unique Order ID, e.g., ORD-EXCH-2026-0091")
    buyer_id: Optional[PydanticObjectId] = None
    seller_id: Optional[PydanticObjectId] = None
    project_id: PydanticObjectId
    order_type: OrderType = OrderType.BUY
    credit_type: str = "VCU"
    quantity_tco2e: float = Field(..., gt=0)
    price_per_tco2e_inr: float = Field(..., gt=0)
    stop_price_per_tco2e_inr: Optional[float] = None
    total_amount_inr: float = Field(..., gt=0)
    filled_quantity: float = Field(default=0.0, ge=0)
    status: OrderStatus = OrderStatus.OPEN
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "carbon_trading_orders"
        indexes = [
            IndexModel([("order_id", ASCENDING)], unique=True),
            IndexModel([
                ("project_id", ASCENDING),
                ("order_type", ASCENDING),
                ("status", ASCENDING),
                ("price_per_tco2e_inr", DESCENDING),
                ("created_at", ASCENDING)
            ]),
            IndexModel([("buyer_id", ASCENDING), ("status", ASCENDING)])
        ]


class CarbonOrderMatch(Document):
    match_id: str = Field(..., description="Unique Trade Match ID, e.g., TRD-MATCH-2026-0091")
    buy_order_id: PydanticObjectId
    sell_order_id: PydanticObjectId
    matched_quantity_tco2e: float = Field(..., gt=0)
    execution_price_inr: float = Field(..., gt=0)
    platform_fee_inr: float = Field(default=0.0, ge=0)
    executed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "carbon_order_matches"
        indexes = [
            IndexModel([("match_id", ASCENDING)], unique=True),
            IndexModel([("buy_order_id", ASCENDING)]),
            IndexModel([("sell_order_id", ASCENDING)]),
            IndexModel([("executed_at", DESCENDING)])
        ]


class GovtSchemeIntegration(Document):
    integration_id: str = Field(..., description="Unique Integration Ref, e.g., SCHEME-PM-SMAF-2026")
    govt_org_id: PydanticObjectId
    scheme_code: str = Field(..., description="e.g., PM-SMAF, PM-KISAN")
    allocated_budget_inr: float = Field(..., gt=0)
    disbursed_budget_inr: float = Field(default=0.0, ge=0)
    beneficiary_count: int = Field(default=0, ge=0)
    active_states: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "govt_scheme_integrations"
        indexes = [
            IndexModel([("integration_id", ASCENDING)], unique=True),
            IndexModel([("scheme_code", ASCENDING)], unique=True)
        ]


class SchemeDBTDisbursement(Document):
    disbursement_id: str = Field(..., description="Unique DBT Ref, e.g., DBT-PM-SMAF-0091")
    integration_id: PydanticObjectId
    farmer_id: PydanticObjectId
    land_id: PydanticObjectId
    amount_inr: float = Field(..., gt=0)
    dbt_transaction_ref: str
    disbursement_status: str = "success"
    disbursed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "scheme_dbt_disbursements"
        indexes = [
            IndexModel([("disbursement_id", ASCENDING)], unique=True),
            IndexModel([("dbt_transaction_ref", ASCENDING)], unique=True),
            IndexModel([("farmer_id", ASCENDING), ("disbursement_status", ASCENDING)])
        ]


class CSRPortfolio(Document):
    portfolio_id: str = Field(..., description="Unique CSR Portfolio ID, e.g., CSR-TATA-2026")
    corporate_id: PydanticObjectId
    company_name: str
    annual_csr_budget_inr: float = Field(..., gt=0)
    allocated_funding_inr: float = Field(default=0.0, ge=0)
    target_trees_count: int = Field(..., gt=0)
    target_co2_offset_tco2e: float = Field(..., gt=0)
    is_active: bool = True

    class Settings:
        name = "csr_portfolios"
        indexes = [
            IndexModel([("portfolio_id", ASCENDING)], unique=True),
            IndexModel([("corporate_id", ASCENDING)], unique=True)
        ]


class CSRAllocation(Document):
    allocation_id: str = Field(..., description="Unique Ref, e.g., CSR-ALLOC-0091")
    portfolio_id: PydanticObjectId
    project_id: PydanticObjectId
    funded_amount_inr: float = Field(..., gt=0)
    allocated_trees_count: int = Field(..., gt=0)
    milestone_status: str = "allocated"
    allocated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "csr_allocations"
        indexes = [
            IndexModel([("allocation_id", ASCENDING)], unique=True),
            IndexModel([("portfolio_id", ASCENDING), ("allocated_at", DESCENDING)])
        ]


class ESGImpactMetric(Document):
    esg_id: str = Field(..., description="Unique ESG Ref, e.g., ESG-REPORT-2026-TATA")
    corporate_id: PydanticObjectId
    reporting_year: int = 2026
    scope_1_offset_tco2e: float = Field(default=0.0, ge=0)
    scope_2_offset_tco2e: float = Field(default=0.0, ge=0)
    scope_3_offset_tco2e: float = Field(default=0.0, ge=0)
    water_replenished_liters: float = Field(default=0.0, ge=0)
    biodiversity_index_score: float = Field(default=8.5, ge=0.0, le=10.0)
    sdg_alignment: List[int] = Field(default_factory=lambda: [1, 8, 13, 15])
    esg_report_pdf_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "esg_impact_metrics"
        indexes = [
            IndexModel([("esg_id", ASCENDING)], unique=True),
            IndexModel([("corporate_id", ASCENDING), ("reporting_year", ASCENDING)], unique=True)
        ]


class InvestorPortfolio(Document):
    investor_id: str = Field(..., description="Unique Investor ID, e.g., INV-GREEN-FUND-01")
    portfolio_name: str = "Green Climate Impact Fund"
    investor_name: str
    total_invested_inr: float = Field(..., gt=0)
    holdings_value_inr: float = Field(..., ge=0)
    carbon_credits_owned_tco2e: float = Field(default=0.0, ge=0)
    yield_payout_rate_percent: float = Field(default=12.5, ge=0)
    total_returns_realized_inr: float = Field(default=0.0, ge=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "investor_portfolios"
        indexes = [
            IndexModel([("investor_id", ASCENDING)], unique=True)
        ]


class InvestorYieldPayout(Document):
    payout_id: str = Field(..., description="Unique Yield Ref, e.g., YIELD-2026-Q2-0091")
    investor_id: PydanticObjectId
    project_id: PydanticObjectId
    payout_amount_inr: float = Field(..., gt=0)
    yield_period: str = "2026-Q2"
    disbursed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "investor_yield_payouts"
        indexes = [
            IndexModel([("payout_id", ASCENDING)], unique=True),
            IndexModel([("investor_id", ASCENDING), ("disbursed_at", DESCENDING)])
        ]


class CommandCenterAlert(Document):
    alert_id: str = Field(..., description="Unique Alert ID, e.g., ALT-COMMAND-2026-0091")
    land_id: PydanticObjectId
    project_id: Optional[PydanticObjectId] = None
    alert_type: AlertType = AlertType.WILDFIRE
    severity: AlertSeverity = AlertSeverity.HIGH
    geo_location: GeoJSONPoint
    alert_message: str
    status: str = "open"
    triggered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "command_center_alerts"
        indexes = [
            IndexModel([("alert_id", ASCENDING)], unique=True),
            IndexModel([("land_id", ASCENDING), ("status", ASCENDING)]),
            IndexModel([("severity", ASCENDING), ("triggered_at", DESCENDING)]),
            IndexModel([("geo_location", "2dsphere")])
        ]
