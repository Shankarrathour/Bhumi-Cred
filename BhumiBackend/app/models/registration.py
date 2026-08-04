from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from beanie import Document
from pydantic import BaseModel, Field
from pymongo import IndexModel, ASCENDING

class GPSPointModel(BaseModel):
    latitude: float
    longitude: float

class CalculatedAreaModel(BaseModel):
    square_meter: float
    acre: float
    hectare: float

class BhumiCredRegistration(Document):
    farmer_id: Optional[str] = None
    current_step: int = Field(default=1)
    is_completed: bool = Field(default=False)
    status: str = Field(default="draft") # draft, submitted, active, cancelled
    registration_number: Optional[str] = None
    application_id: Optional[str] = None
    
    # Step 1
    belongs_to_self: Optional[bool] = None
    farmer_name: Optional[str] = None
    father_guardian_name: Optional[str] = None
    mobile_number: Optional[str] = None

    # Step 2
    total_area: Optional[float] = None
    unit: Optional[str] = None
    multiple_crops: Optional[bool] = None
    soil_composition: Optional[str] = None
    water_availability: Optional[str] = None
    tree_stock_count: Optional[int] = None
    plantation_area: Optional[float] = None
    plantation_species: Optional[List[str]] = None

    # Step 3
    state: Optional[str] = None
    district: Optional[str] = None
    tehsil: Optional[str] = None
    village: Optional[str] = None
    gram_panchayat: Optional[str] = None
    post: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    # Step 4
    boundary_points: Optional[List[GPSPointModel]] = None
    boundary_locked: Optional[bool] = None
    calculated_area: Optional[CalculatedAreaModel] = None
    boundary_geojson: Optional[Dict[str, Any]] = None

    # Step 5
    preferred_date: Optional[str] = None
    preferred_time_slot: Optional[str] = None
    landmark: Optional[str] = None
    special_instructions: Optional[str] = None

    # Step 6
    tree_insurance: Optional[bool] = None

    # Audit & Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None # e.g. farmer:{id}

    class Settings:
        name = "registrations"
        indexes = [
            IndexModel([("mobile_number", ASCENDING)]),
            IndexModel([("farmer_id", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("registration_number", ASCENDING)], unique=True, partialFilterExpression={"registration_number": {"$type": "string"}}),
            IndexModel([("application_id", ASCENDING)], unique=True, partialFilterExpression={"application_id": {"$type": "string"}}),
        ]
