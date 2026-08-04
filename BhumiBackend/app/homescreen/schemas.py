from pydantic import BaseModel
from typing import Optional, List


class EcologicalOverview(BaseModel):
    eco_index: int
    eco_index_change_percent: float
    co2_captures: float
    district_green_rank: int
    wallet_balance: float


class EnvironmentalPulse(BaseModel):
    solar_energy_absorption: int
    plantation_health_ndvi: int
    ticker_text: str


class JourneyStep(BaseModel):
    id: str
    name: str
    description: str
    status: str  # "completed", "active", "locked"
    step_number: int


class MilestoneResponse(BaseModel):
    id: str
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    badge_text: Optional[str] = None
    badge_type: Optional[str] = None
    time_ago: str


class EnvironmentalTrends(BaseModel):
    nitrogen_retention_rate: int
    nitrogen_retention_status: str
    soil_organic_carbon: float
    soil_organic_carbon_status: str
    boundary_tree_cover: int
    boundary_tree_cover_status: str


class EcologicalDashboardResponse(BaseModel):
    overview: EcologicalOverview
    pulse: EnvironmentalPulse
    journey: List[JourneyStep]
    milestones: List[MilestoneResponse]
    trends: EnvironmentalTrends

