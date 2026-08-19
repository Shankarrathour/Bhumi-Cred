from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field

class SoilTestBooking(Document):
    farmer_id: str
    land_parcel_id: str
    package_name: str  # "Standard NPK Audit" or "Premium Micro-nutrient Scan"
    is_paid: bool = False
    amount_paid: float = 0.0
    schedule_date: str
    schedule_time_slot: str
    status: str = "scheduled"  # "scheduled", "sample_collected", "lab_processing", "report_ready"
    
    # Lab Report Values (populated when status is "report_ready")
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    ph: Optional[float] = None
    organic_carbon: Optional[float] = None
    soil_health_score: Optional[float] = None
    observations: Optional[str] = None
    recommendations: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "soil_test_bookings"
