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

        # Calculate real land acreage dynamically from land parcels if needed
        total_acres = farmer.total_acreage or 0.0
        if total_acres == 0.0:
            parcels = await LandParcel.find(LandParcel.farmer_id == str(farmer.id)).to_list()
            total_acres = sum(p.area_acres for p in parcels if p.area_acres)

        # Compute real district green rank by comparing against other farmers in MongoDB
        raw_district = farmer.district or (farmer.current_address.district if farmer.current_address else None)
        if not raw_district:
            parcel_with_district = await LandParcel.find_one(
                LandParcel.farmer_id == str(farmer.id),
                LandParcel.district != None,
                LandParcel.is_deleted == False
            )
            if parcel_with_district and parcel_with_district.district:
                raw_district = parcel_with_district.district

        farmer_district = raw_district.strip() if raw_district else None

        all_active_farmers = await Farmer.find(
            Farmer.is_deleted == False,
            Farmer.is_active == True
        ).to_list()

        if farmer_district:
            candidate_farmers = [
                f for f in all_active_farmers
                if (f.district and f.district.strip().lower() == farmer_district.lower()) or
                   (f.current_address and f.current_address.district and f.current_address.district.strip().lower() == farmer_district.lower())
            ]
            if len(candidate_farmers) <= 1:
                candidate_farmers = all_active_farmers
        else:
            candidate_farmers = all_active_farmers

        # Helper function to calculate real total trees and land acreage for any farmer from MongoDB
        async def compute_farmer_tree_and_land(f: Farmer) -> tuple[int, float]:
            f_parcels = await LandParcel.find(
                LandParcel.farmer_id == str(f.id),
                LandParcel.is_deleted == False
            ).to_list()

            f_trees = f.total_trees or 0
            f_acres = f.total_acreage or 0.0

            if f_parcels:
                p_trees = sum(
                    p.tree_stock_count or (sum(t.count for t in p.trees) if p.trees else 0)
                    for p in f_parcels
                )
                p_acres = sum(p.area_acres for p in f_parcels if p.area_acres)
                f_trees = max(f_trees, p_trees)
                f_acres = max(f_acres, p_acres)

            return f_trees, f_acres

        # Compute current farmer's metrics
        my_trees, my_acres = await compute_farmer_tree_and_land(farmer)
        # Dynamic Green Score: (Trees * 10) + (Land Acres * 5) + Sustainability Score
        my_score = (my_trees * 10) + (my_acres * 5) + (farmer.sustainability_score or 0)

        higher_count = 0
        for f in candidate_farmers:
            if str(f.id) == str(farmer.id):
                continue
            f_trees, f_acres = await compute_farmer_tree_and_land(f)
            f_score = (f_trees * 10) + (f_acres * 5) + (f.sustainability_score or 0)

            if f_score > my_score:
                higher_count += 1
            elif f_score == my_score:
                if f_trees > my_trees:
                    higher_count += 1
                elif f_trees == my_trees and f_acres > my_acres:
                    higher_count += 1

        district_rank = higher_count + 1

        change_percent = round(min(15.0, (eco_index / 100.0) * 8.5), 1) if eco_index > 0 else 0.0

        co2_captures = farmer.carbon_credits_generated or 0.0
        if co2_captures == 0.0 and active:
            co2_captures = active.estimated_carbon_impact or 0.0

        return EcologicalOverview(
            eco_index=eco_index,
            eco_index_change_percent=change_percent,
            co2_captures=co2_captures,
            district_green_rank=district_rank,
            wallet_balance=farmer.wallet_balance or 0.0,
        )

    async def get_environmental_pulse(self, farmer: Farmer) -> EnvironmentalPulse:
        return EnvironmentalPulse(
            solar_energy_absorption=74,
            plantation_health_ndvi=92,
            ticker_text="BhumiCred: Verified farmers are earning carbon credits through green practices.",
        )

    async def get_journey_map(self, farmer: Farmer) -> List[JourneyStep]:
        from app.models.land_parcel import LandVerificationStatus
        from app.models.green_family import GreenFamilyCover

        # Fetch all relevant information for the farmer dynamically
        farmer_id_str = str(farmer.id)
        
        # Step 1: Farmer Registered
        step1_status = "completed"

        # Step 2: KYC Verified
        is_kyc_approved = farmer.kyc_status == KYCStatus.APPROVED or getattr(farmer.kyc_status, "value", "").lower() == "approved"
        if is_kyc_approved:
            step2_status = "completed"
        else:
            step2_status = "active"

        # Step 3: Land Approved
        # Look for approved/verified land parcels
        parcels = await LandParcel.find(
            LandParcel.farmer_id == farmer_id_str,
            LandParcel.is_deleted == False
        ).to_list()
        
        approved_parcel_statuses = {
            LandVerificationStatus.APPROVED, 
            LandVerificationStatus.VERIFIED, 
            LandVerificationStatus.PROJECT_ASSIGNED
        }
        has_approved_land = any(
            p.verification_status in approved_parcel_statuses or 
            getattr(p.verification_status, "value", "").lower() in ["approved", "verified", "project_assigned"]
            for p in parcels
        )

        if has_approved_land:
            step3_status = "completed"
        elif step2_status == "completed":
            step3_status = "active"
        else:
            step3_status = "locked"

        # Step 4: Plantation Added
        # Total tree stock count or items inside trees list is greater than 0
        from app.models.tree_registration import TreeRegistration, TreeRegistrationStatus
        has_trees_registered = await TreeRegistration.find(
            TreeRegistration.farmer_id == farmer_id_str,
            TreeRegistration.status == TreeRegistrationStatus.APPROVED
        ).count() > 0

        has_trees = any(
            (p.tree_stock_count or 0) > 0 or len(p.trees or []) > 0
            for p in parcels
        ) or has_trees_registered

        if has_approved_land and has_trees:
            step4_status = "completed"
        elif step3_status == "completed":
            step4_status = "active"
        else:
            step4_status = "locked"

        # Step 5: Green Family Created
        covers = await GreenFamilyCover.find(
            GreenFamilyCover.farmer_id == farmer_id_str
        ).to_list()
        has_green_family = any(
            c.status == "Verified" or getattr(c.status, "value", "").lower() == "verified"
            for c in covers
        )

        if has_green_family:
            step5_status = "completed"
        elif step4_status == "completed":
            step5_status = "active"
        else:
            step5_status = "locked"

        # Step 6: Sustainability Score Active
        enrollments = await self.enrollment_repo.get_active_by_farmer(farmer_id_str)
        active_enrollment = enrollments[0] if enrollments else None
        eco_index = active_enrollment.sustainability_score if active_enrollment else (farmer.sustainability_score or 0)
        
        if eco_index > 0:
            step6_status = "completed"
        elif step5_status == "completed":
            step6_status = "active"
        else:
            step6_status = "locked"

        # Step 7: Carbon Program Joined
        project_title = "Zero-tillage program locked."
        if active_enrollment is not None:
            from app.models.sustainability_project import SustainabilityProject
            proj = await SustainabilityProject.find_one(SustainabilityProject.project_id == active_enrollment.project_id)
            project_title = f"Joined: {proj.title}" if proj else f"Joined: {active_enrollment.project_id}"

        if active_enrollment is not None:
            step7_status = "completed"
        elif step6_status == "completed":
            step7_status = "active"
        else:
            step7_status = "locked"

        # Step 8: Community Contributor
        if step7_status == "completed":
            step8_status = "active"
        else:
            step8_status = "locked"

        # Step 9: Sustainability Leader
        if step8_status == "completed" and eco_index >= 95:
            step9_status = "completed"
        elif step8_status == "completed":
            step9_status = "active"
        else:
            step9_status = "locked"

        total_trees_count = sum((p.tree_stock_count or len(p.trees or [])) for p in parcels)

        return [
            JourneyStep(
                id="step_registered",
                name="Farmer Registered",
                description="Welcome to BhumiCred network.",
                status=step1_status,
                step_number=1,
            ),
            JourneyStep(
                id="step_kyc",
                name="KYC Verified",
                description="Secure aadhaar mapping active.",
                status=step2_status,
                step_number=2,
            ),
            JourneyStep(
                id="step_land",
                name="Land Approved",
                description="Satellite scanning baseline set.",
                status=step3_status,
                step_number=3,
            ),
            JourneyStep(
                id="step_plantation",
                name="Plantation Added",
                description="30 boundary trees tag registered." if not has_trees else f"{total_trees_count} boundary trees tag registered.",
                status=step4_status,
                step_number=4,
            ),
            JourneyStep(
                id="step_family",
                name="Green Family Created",
                description="Tree sponge units active.",
                status=step5_status,
                step_number=5,
            ),
            JourneyStep(
                id="step_score",
                name="Sustainability Score Active",
                description=f"Current: {eco_index}/100 score.",
                status=step6_status,
                step_number=6,
            ),
            JourneyStep(
                id="step_carbon",
                name="Carbon Program Joined",
                description=project_title,
                status=step7_status,
                step_number=7,
            ),
            JourneyStep(
                id="step_community",
                name="Community Contributor",
                description="Help 3 neighbours register.",
                status=step8_status,
                step_number=8,
            ),
            JourneyStep(
                id="step_leader",
                name="Sustainability Leader",
                description="Achieve District Rank #1.",
                status=step9_status,
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
