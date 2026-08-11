import logging
from datetime import datetime, timezone
import random
from typing import Optional, List, Tuple

import math

from app.models.registration import BhumiCredRegistration, GPSPointModel, CalculatedAreaModel
from app.models.invoice import Invoice, InvoiceItemModel
from app.models.audit_schedule import AuditSchedule
from app.repositories.registration import BhumiCredRegistrationRepository, InvoiceRepository, AuditScheduleRepository
from app.schemas.registration import (
    Step1Request, Step2Request, Step3Request, Step4Request, Step5Request, Step6Request,
    CalculatedArea, Step4Response, InvoiceResponse, InvoiceItem, SubmitRegistrationResponse,
    RegistrationResponse, GPSPoint
)
from app.core.exceptions import BadRequestException, NotFoundException

logger = logging.getLogger(__name__)

class BhumiCredRegistrationService:
    def __init__(
        self,
        registration_repo: BhumiCredRegistrationRepository,
        invoice_repo: InvoiceRepository,
        audit_repo: AuditScheduleRepository,
    ):
        self._registrations = registration_repo
        self._invoices = invoice_repo
        self._audits = audit_repo

    async def get_registration(self, reg_id: str) -> BhumiCredRegistration:
        reg = await self._registrations.get_by_id(reg_id)
        if not reg:
            raise NotFoundException("Registration draft not found", "REGISTRATION_NOT_FOUND")
        return reg

    async def resume_registration(self, mobile_number: str) -> RegistrationResponse:
        reg = await self._registrations.get_latest_draft_by_mobile(mobile_number)
        if not reg:
            raise NotFoundException("No active draft registration found for this mobile number.", "REGISTRATION_NOT_FOUND")
        return self._build_registration_response(reg)

    async def process_step_1(self, payload: Step1Request, farmer_id: Optional[str] = None, created_by: Optional[str] = None) -> RegistrationResponse:
        # Check if there is an existing draft registration for the mobile number
        reg = await self._registrations.get_latest_draft_by_mobile(payload.mobile_number)
        
        if not reg:
            reg = BhumiCredRegistration(
                farmer_id=farmer_id,
                mobile_number=payload.mobile_number,
                belongs_to_self=payload.belongs_to_self,
                farmer_name=payload.farmer_name,
                father_guardian_name=payload.father_guardian_name,
                current_step=1,
                status="draft",
                created_by=created_by,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            await self._registrations.create(reg)
            logger.info(f"Created new registration draft for mobile: {payload.mobile_number}")
        else:
            # Update only changed fields
            reg.farmer_id = farmer_id
            reg.belongs_to_self = payload.belongs_to_self
            reg.farmer_name = payload.farmer_name
            reg.father_guardian_name = payload.father_guardian_name
            reg.updated_at = datetime.now(timezone.utc)
            if reg.current_step < 1:
                reg.current_step = 1
            await self._registrations.save(reg)
            logger.info(f"Updated registration step 1 for ID: {reg.id}")

        return self._build_registration_response(reg)

    async def process_step_2(self, reg_id: str, payload: Step2Request) -> RegistrationResponse:
        reg = await self.get_registration(reg_id)
        
        # Step validation
        if reg.current_step < 1:
            raise BadRequestException("Please complete Step 1 first.", "STEP_VALIDATION_FAILED")

        # Update step 2 fields
        reg.total_area = payload.total_area
        reg.unit = payload.unit
        reg.multiple_crops = payload.multiple_crops
        reg.soil_composition = payload.soil_composition
        reg.water_availability = payload.water_availability
        reg.tree_stock_count = payload.tree_stock_count
        reg.plantation_area = payload.plantation_area
        reg.plantation_species = payload.plantation_species
        
        reg.updated_at = datetime.now(timezone.utc)
        if reg.current_step < 2:
            reg.current_step = 2

        await self._registrations.save(reg)
        logger.info(f"Updated registration step 2 for ID: {reg.id}")
        return self._build_registration_response(reg)

    async def process_step_3(self, reg_id: str, payload: Step3Request) -> RegistrationResponse:
        reg = await self.get_registration(reg_id)

        # Step validation
        if reg.current_step < 2:
            raise BadRequestException("Please complete Step 2 first.", "STEP_VALIDATION_FAILED")

        # Update step 3 fields
        reg.state = payload.state
        reg.district = payload.district
        reg.tehsil = payload.tehsil
        reg.village = payload.village
        reg.gram_panchayat = payload.gram_panchayat
        reg.post = payload.post
        reg.pincode = payload.pincode
        reg.latitude = payload.latitude
        reg.longitude = payload.longitude

        reg.updated_at = datetime.now(timezone.utc)
        if reg.current_step < 3:
            reg.current_step = 3

        await self._registrations.save(reg)
        logger.info(f"Updated registration step 3 for ID: {reg.id}")
        return self._build_registration_response(reg)

    async def process_step_4(self, reg_id: str, payload: Step4Request) -> Step4Response:
        reg = await self.get_registration(reg_id)

        if reg.current_step < 3:
            raise BadRequestException("Please complete Step 3 first.", "STEP_VALIDATION_FAILED")

        # Convert to list of tuples for Area calculation
        points = [(p.longitude, p.latitude) for p in payload.boundary_points]
        
        try:
            if len(points) < 3:
                raise BadRequestException("Invalid polygon geometry. Must have at least 3 points.", "INVALID_GEOMETRY")

            # Calculate area using pure math
            area = 0.0
            R = 6378137.0
            for i in range(len(points)):
                p1 = points[i]
                p2 = points[(i + 1) % len(points)]
                import math
                area += math.radians(p2[0] - p1[0]) * (2.0 + math.sin(math.radians(p1[1])) + math.sin(math.radians(p2[1])))
            area_sq_m = abs(area * R * R / 2.0)

            # Conversions
            area_acre = area_sq_m * 0.000247105
            area_hectare = area_sq_m * 0.0001
        except Exception as e:
            if isinstance(e, BadRequestException):
                raise e
            logger.error(f"Error calculating GIS area: {e}")
            raise BadRequestException(f"Error calculating area: {str(e)}", "GIS_CALCULATION_FAILED")

        # GeoJSON creation: Closed linear ring
        geojson_coordinates = [[p.longitude, p.latitude] for p in payload.boundary_points]
        if geojson_coordinates[0] != geojson_coordinates[-1]:
            geojson_coordinates.append(geojson_coordinates[0])

        boundary_geojson = {
            "type": "Polygon",
            "coordinates": [geojson_coordinates]
        }

        # Update model
        reg.boundary_points = [GPSPointModel(latitude=p.latitude, longitude=p.longitude) for p in payload.boundary_points]
        reg.boundary_locked = payload.boundary_locked
        reg.calculated_area = CalculatedAreaModel(
            square_meter=round(area_sq_m, 2),
            acre=round(area_acre, 2),
            hectare=round(area_hectare, 2)
        )
        reg.boundary_geojson = boundary_geojson
        reg.updated_at = datetime.now(timezone.utc)
        
        if reg.current_step < 4:
            reg.current_step = 4

        await self._registrations.save(reg)
        logger.info(f"Updated registration step 4 (area: {area_sq_m} sq m) for ID: {reg.id}")

        return Step4Response(
            success=True,
            message="Boundary saved successfully.",
            calculated_area=CalculatedArea(
                square_meter=round(area_sq_m, 2),
                acre=round(area_acre, 2),
                hectare=round(area_hectare, 2)
            )
        )

    async def get_step_4_boundary(self, reg_id: str) -> dict:
        reg = await self.get_registration(reg_id)
        if not reg.boundary_points:
            return {"success": True, "boundary_points": [], "boundary_locked": False, "calculated_area": None}
        return {
            "success": True,
            "boundary_points": [GPSPoint(latitude=p.latitude, longitude=p.longitude) for p in reg.boundary_points],
            "boundary_locked": reg.boundary_locked,
            "calculated_area": reg.calculated_area
        }

    async def clear_step_4_boundary(self, reg_id: str) -> dict:
        reg = await self.get_registration(reg_id)
        if reg.boundary_locked:
            raise BadRequestException("Cannot clear locked boundary.", "BOUNDARY_LOCKED")
        reg.boundary_points = None
        reg.calculated_area = None
        reg.boundary_geojson = None
        reg.updated_at = datetime.now(timezone.utc)
        await self._registrations.save(reg)
        return {"success": True, "message": "Boundary cleared successfully."}

    async def process_step_5(self, reg_id: str, payload: Step5Request) -> RegistrationResponse:
        reg = await self.get_registration(reg_id)

        if reg.current_step < 4:
            raise BadRequestException("Please complete Step 4 first.", "STEP_VALIDATION_FAILED")

        # Update step 5 fields
        reg.preferred_date = payload.preferred_date
        reg.preferred_time_slot = payload.preferred_time_slot
        reg.landmark = payload.landmark
        reg.special_instructions = payload.special_instructions

        reg.updated_at = datetime.now(timezone.utc)
        if reg.current_step < 5:
            reg.current_step = 5

        await self._registrations.save(reg)
        logger.info(f"Updated registration step 5 for ID: {reg.id}")

        # Create or update audit schedule document
        audit = await self._audits.get_by_registration_id(reg_id)
        if not audit:
            audit = AuditSchedule(
                registration_id=reg_id,
                preferred_date=payload.preferred_date,
                preferred_time_slot=payload.preferred_time_slot,
                landmark=payload.landmark,
                special_instructions=payload.special_instructions,
                status="scheduled"
            )
            await self._audits.create(audit)
        else:
            audit.preferred_date = payload.preferred_date
            audit.preferred_time_slot = payload.preferred_time_slot
            audit.landmark = payload.landmark
            audit.special_instructions = payload.special_instructions
            audit.updated_at = datetime.now(timezone.utc)
            await self._audits.save(audit)

        return self._build_registration_response(reg)

    async def process_step_6(self, reg_id: str, payload: Step6Request) -> RegistrationResponse:
        reg = await self.get_registration(reg_id)

        if reg.current_step < 5:
            raise BadRequestException("Please complete Step 5 first.", "STEP_VALIDATION_FAILED")

        # Update step 6 fields
        reg.tree_insurance = payload.tree_insurance

        reg.updated_at = datetime.now(timezone.utc)
        if reg.current_step < 6:
            reg.current_step = 6

        await self._registrations.save(reg)
        logger.info(f"Updated registration step 6 for ID: {reg.id}")
        return self._build_registration_response(reg)

    async def get_or_generate_invoice(self, reg_id: str) -> InvoiceResponse:
        reg = await self.get_registration(reg_id)

        if reg.current_step < 6:
            raise BadRequestException("Please complete Step 6 first.", "STEP_VALIDATION_FAILED")

        # Check if invoice already exists
        existing_invoice = await self._invoices.get_by_registration_id(reg_id)
        if existing_invoice:
            return self._build_invoice_response(existing_invoice)
            await existing_invoice.delete()

        # Dynamic invoice calculation logic
        # Billing Items:
        # 1. Soil Baseline Audit Fee: Flat INR 1500
        # 2. Registry Registration Fee: Flat INR 500
        # 3. Geo-boundary Mapping & Canopy Scan: Flat INR 1000
        # 4. Optional Tree Insurance: INR 12 per tree (if tree_insurance is True)
        billing_items = [
            InvoiceItemModel(name="Soil Baseline Audit Fee", amount=1500.0),
            InvoiceItemModel(name="Registry Registration Fee", amount=500.0),
            InvoiceItemModel(name="Geo-boundary Mapping & Canopy Scan", amount=1000.0)
        ]
        
        insurance_charges = 0.0
        if reg.tree_insurance and reg.insurance_amount:
            insurance_charges = float(reg.insurance_amount)
            if reg.insurance_plan == "single":
                plan_str = "Single Sapling Protector"
            elif reg.insurance_plan == "family":
                plan_str = "Green Family Canopy Cover"
            else:
                plan_str = f"{reg.tree_stock_count or 0} trees"
            billing_items.append(
                InvoiceItemModel(name=f"Climate Tree Insurance ({plan_str})", amount=insurance_charges)
            )

        subtotal = sum(item.amount for item in billing_items)
        tax = round(subtotal * 0.18, 2) # 18% GST
        grand_total = subtotal + tax

        # Generate unique Invoice Number
        invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

        farmer_details = {
            "farmer_name": reg.farmer_name,
            "father_guardian_name": reg.father_guardian_name,
            "mobile_number": reg.mobile_number,
        }

        land_details = {
            "total_area": reg.total_area,
            "unit": reg.unit,
            "village": reg.village,
            "district": reg.district,
            "calculated_area_acres": reg.calculated_area.acre if reg.calculated_area else None
        }

        invoice = Invoice(
            registration_id=reg_id,
            invoice_number=invoice_number,
            farmer_details=farmer_details,
            land_details=land_details,
            billing_items=billing_items,
            grand_total=round(grand_total, 2),
            tax=tax,
            insurance_charges=insurance_charges,
            created_at=datetime.now(timezone.utc)
        )
        await self._invoices.create(invoice)
        logger.info(f"Generated invoice {invoice_number} for registration {reg_id}")
        return self._build_invoice_response(invoice)

    async def submit_registration(self, reg_id: str) -> SubmitRegistrationResponse:
        reg = await self.get_registration(reg_id)

        if reg.current_step < 6:
            raise BadRequestException("Please complete all steps (1 to 6) before submitting.", "INCOMPLETE_REGISTRATION")

        if reg.status == "submitted":
            raise BadRequestException("This registration has already been submitted.", "ALREADY_SUBMITTED")

        # Generate registration details
        today_str = datetime.now().strftime('%Y%m%d')
        random_suffix = random.randint(10000, 99999)
        reg_number = f"BCR-{today_str}-{random_suffix}"
        app_id = f"APP-{today_str}-{random_suffix}"

        reg.registration_number = reg_number
        reg.application_id = app_id
        reg.status = "submitted"
        reg.is_completed = True
        reg.updated_at = datetime.now(timezone.utc)
        await self._registrations.save(reg)

        logger.info(f"Submitted registration successfully. Reg Number: {reg_number}")

        # Also create a LandParcel so it shows in the Admin panel's GIS & Land / land list
        try:
            from app.models.land_parcel import LandParcel, GeoCoords, LandVerificationStatus, OwnershipType
            from bson import ObjectId

            area_acres = 0.0
            if reg.calculated_area and reg.calculated_area.acre:
                area_acres = float(reg.calculated_area.acre)
            elif reg.total_area:
                area_acres = float(reg.total_area)

            # Map boundary points to list of GeoCoords
            coords_list = []
            if reg.boundary_points:
                for p in reg.boundary_points:
                    coords_list.append(GeoCoords(latitude=p.latitude, longitude=p.longitude))

            # Center coordinates
            center_coords = None
            if reg.latitude is not None and reg.longitude is not None:
                center_coords = GeoCoords(latitude=reg.latitude, longitude=reg.longitude)
            elif coords_list:
                center_coords = coords_list[0]
            else:
                center_coords = GeoCoords(latitude=23.0225, longitude=77.0124)

            land_parcel = LandParcel(
                farmer_id=reg.farmer_id if reg.farmer_id else "unknown_farmer",
                survey_number=reg_number,
                khasra_number=reg_number,
                area_acres=area_acres if area_acres > 0 else 1.0,
                ownership_type=OwnershipType.OWN if reg.belongs_to_self else OwnershipType.LEASED,
                is_irrigated=False,
                state=reg.state or "Madhya Pradesh",
                district=reg.district or "Sehore",
                village=reg.village or "Ichhawar",
                gram_panchayat=reg.gram_panchayat,
                tehsil=reg.tehsil,
                coordinates=center_coords,
                boundary_polygon=coords_list,
                tree_stock_count=reg.tree_stock_count or 0,
                plantation_area_acres=reg.plantation_area or 0.0,
                verification_status=LandVerificationStatus.PENDING,
                is_active=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            await land_parcel.insert()
            logger.info(f"Automatically created LandParcel for submitted registration: {reg_number}")
        except Exception as e:
            logger.error(f"Failed to automatically create LandParcel for registration {reg_number}: {e}", exc_info=True)

        return SubmitRegistrationResponse(
            registration_number=reg_number,
            application_id=app_id,
            current_status=reg.status,
            submission_timestamp=reg.updated_at
        )

    def _build_registration_response(self, reg: BhumiCredRegistration) -> RegistrationResponse:
        return RegistrationResponse(
            id=str(reg.id),
            farmer_id=reg.farmer_id,
            current_step=reg.current_step,
            status=reg.status,
            belongs_to_self=reg.belongs_to_self,
            farmer_name=reg.farmer_name,
            father_guardian_name=reg.father_guardian_name,
            mobile_number=reg.mobile_number,
            total_area=reg.total_area,
            unit=reg.unit,
            multiple_crops=reg.multiple_crops,
            soil_composition=reg.soil_composition,
            water_availability=reg.water_availability,
            tree_stock_count=reg.tree_stock_count,
            plantation_area=reg.plantation_area,
            plantation_species=reg.plantation_species,
            state=reg.state,
            district=reg.district,
            tehsil=reg.tehsil,
            village=reg.village,
            gram_panchayat=reg.gram_panchayat,
            post=reg.post,
            pincode=reg.pincode,
            latitude=reg.latitude,
            longitude=reg.longitude,
            boundary_points=[GPSPoint(latitude=p.latitude, longitude=p.longitude) for p in reg.boundary_points] if reg.boundary_points else None,
            boundary_locked=reg.boundary_locked,
            calculated_area=CalculatedArea(
                square_meter=reg.calculated_area.square_meter,
                acre=reg.calculated_area.acre,
                hectare=reg.calculated_area.hectare
            ) if reg.calculated_area else None,
            preferred_date=reg.preferred_date,
            preferred_time_slot=reg.preferred_time_slot,
            landmark=reg.landmark,
            special_instructions=reg.special_instructions,
            tree_insurance=reg.tree_insurance,
            created_at=reg.created_at,
            updated_at=reg.updated_at,
            created_by=reg.created_by,
        )

    def _build_invoice_response(self, inv: Invoice) -> InvoiceResponse:
        return InvoiceResponse(
            invoice_number=inv.invoice_number,
            farmer_details=inv.farmer_details,
            land_details=inv.land_details,
            billing_items=[InvoiceItem(name=item.name, amount=item.amount) for item in inv.billing_items],
            grand_total=inv.grand_total,
            tax=inv.tax,
            insurance_charges=inv.insurance_charges
        )
