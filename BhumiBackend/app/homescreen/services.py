import random
from datetime import datetime, timedelta, timezone
from typing import List

from app.models.farmer import Farmer, KYCStatus
from app.models.land_parcel import LandParcel
from app.homescreen.models import Milestone
from app.homescreen.repositories import MilestoneRepository
from app.repositories.farmer import FarmerRepository
from app.repositories.project_enrollment import ProjectEnrollmentRepository
from app.homescreen.schemas import (
    EcologicalOverview,
    EnvironmentalPulse,
    JourneyStep,
    MilestoneResponse,
    EnvironmentalTrends,
    EcologicalDashboardResponse,
)


class EcologicalService:
    def __init__(
        self,
        milestone_repo: MilestoneRepository,
        farmer_repo: FarmerRepository,
        enrollment_repo: ProjectEnrollmentRepository,
    ):
        self.milestone_repo = milestone_repo
        self.farmer_repo = farmer_repo
        self.enrollment_repo = enrollment_repo

    async def get_dashboard(self, farmer: Farmer) -> EcologicalDashboardResponse:
        overview = await self.get_ecological_overview(farmer)
        pulse = await self.get_environmental_pulse(farmer)
        journey = await self.get_journey_map(farmer)
        milestones = await self.get_milestones(farmer)
        trends = await self.get_environmental_trends(farmer)

        return EcologicalDashboardResponse(
            overview=overview,
            pulse=pulse,
            journey=journey,
            milestones=milestones,
            trends=trends,
        )

    async def get_environmental_trends(self, farmer: Farmer) -> EnvironmentalTrends:
        return EnvironmentalTrends(
            nitrogen_retention_rate=82,
            nitrogen_retention_status="Excellent",
            soil_organic_carbon=0.65,
            soil_organic_carbon_status="Healthy",
            boundary_tree_cover=48,
            boundary_tree_cover_status="Growing",
        )

    async def get_ecological_overview(self, farmer: Farmer) -> EcologicalOverview:
        # Single source of truth for the sustainability score, shared with
        # ProjectsService.get_hub()'s ContributionResponse: an active Carbon
        # Project enrollment's own score takes precedence over the Farmer
        # document's (which is never updated once a farmer has an active
        # enrollment — see ProjectEnrollment.sustainability_score instead).
        enrollments = await self.enrollment_repo.get_active_by_farmer(str(farmer.id))
        active = enrollments[0] if enrollments else None
        eco_index = active.sustainability_score if active else farmer.sustainability_score

        # Generate some slight variation or change percent based on active status, or keep it static if tracking historical is not yet implemented
        change_percent = 5.2 if eco_index > 50 else -1.5

        return EcologicalOverview(
            eco_index=eco_index,
            eco_index_change_percent=change_percent,
            co2_captures=farmer.carbon_credits_generated,
            district_green_rank=12,  # Hardcoded for now as rank requires complex aggregation
            wallet_balance=farmer.wallet_balance,
        )

    async def get_environmental_pulse(self, farmer: Farmer) -> EnvironmentalPulse:
        return EnvironmentalPulse(
            solar_energy_absorption=74,
            plantation_health_ndvi=92,
            ticker_text="BhumiCred: Verified farmers are earning carbon credits through green practices.",
        )

    async def get_journey_map(self, farmer: Farmer) -> List[JourneyStep]:
        return [
            JourneyStep(
                id="step_registered",
                name="Farmer Registered",
                description="Welcome to BhumiCred network.",
                status="completed",
                step_number=1,
            ),
            JourneyStep(
                id="step_kyc",
                name="KYC Verified",
                description="Secure aadhaar mapping active.",
                status="completed",
                step_number=2,
            ),
            JourneyStep(
                id="step_land",
                name="Land Approved",
                description="Satellite scanning baseline set.",
                status="completed",
                step_number=3,
            ),
            JourneyStep(
                id="step_plantation",
                name="Plantation Added",
                description="30 boundary trees tag registered.",
                status="completed",
                step_number=4,
            ),
            JourneyStep(
                id="step_family",
                name="Green Family Created",
                description="Tree sponge units active.",
                status="completed",
                step_number=5,
            ),
            JourneyStep(
                id="step_score",
                name="Sustainability Score Active",
                description="Current: 85/100 score.",
                status="active",
                step_number=6,
            ),
            JourneyStep(
                id="step_carbon",
                name="Carbon Program Joined",
                description="Zero-tillage program locked.",
                status="locked",
                step_number=7,
            ),
            JourneyStep(
                id="step_community",
                name="Community Contributor",
                description="Help 3 neighbours register.",
                status="locked",
                step_number=8,
            ),
            JourneyStep(
                id="step_leader",
                name="Sustainability Leader",
                description="Achieve District Rank #1.",
                status="locked",
                step_number=9,
            ),
        ]

    async def get_milestones(self, farmer: Farmer = None) -> List[MilestoneResponse]:
        return [
            MilestoneResponse(
                id="milestone_1",
                title="First Land Verified 🌿",
                subtitle="Bhopal Rural Plot #103. Mapped successfully.",
                description="Your soil baseline is certified, breathing clean oxygen for 12 local families.",
                badge_text="Baseline NPK Active",
                badge_type="npk_active",
                time_ago="2 hours ago",
            ),
            MilestoneResponse(
                id="milestone_2",
                title="First Plantation Added 🌳",
                subtitle="30 Border Saplings registered.",
                description="Saplings mapped successfully! These growth nodes will generate ₹4,000 yearly carbon payouts as they mature.",
                badge_text="Subsidies Scheduled",
                badge_type="subsidies",
                time_ago="Yesterday",
            ),
            MilestoneResponse(
                id="milestone_3",
                title="First Green Family Created 🌿",
                subtitle="Sponge units mapped by drone scan.",
                description="5 trees grouped into a Carbon Sponge Family unit, yielding ₹1,000 milestones.",
                badge_text="1.5x Biomass Bonus",
                badge_type="biomass",
                time_ago="3 days ago",
            ),
            MilestoneResponse(
                id="milestone_4",
                title="First Carbon Payout claimed 💰",
                subtitle="Direct payout completed.",
                description="₹1,250 reward claimed. Sustainable zero-tillage boundary agriculture is paying off.",
                badge_text="₹1,250 direct cash",
                badge_type="cash",
                time_ago="5 days ago",
            ),
        ]

    def _format_time_ago(self, dt: datetime) -> str:
        # Ensure timezone awareness
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
            
        now = datetime.now(timezone.utc)
        diff = now - dt

        if diff.days == 0:
            if diff.seconds < 3600:
                mins = diff.seconds // 60
                return f"{mins} minutes ago" if mins > 1 else "just now"
            else:
                hours = diff.seconds // 3600
                return f"{hours} hours ago"
        elif diff.days == 1:
            return "Yesterday"
        else:
            return f"{diff.days} days ago"
