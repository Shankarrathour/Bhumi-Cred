from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime

class Step1Request(BaseModel):
    belongs_to_self: bool = Field(..., description="True if self owned, False if belongs to another person")
    farmer_name: str = Field(..., min_length=2, max_length=100)
    father_guardian_name: str = Field(..., min_length=2, max_length=100)
    mobile_number: str = Field(..., pattern=r"^\+?[1-9]\d{1,14}$|^[0-9]{10}$", description="Valid mobile number")

class Step2Request(BaseModel):
    total_area: float = Field(..., gt=0.0)
    unit: str = Field(..., description="Must be Acre or Bigha")
    multiple_crops: bool
    soil_composition: str = Field(..., min_length=1)
    water_availability: str = Field(..., min_length=1)
    tree_stock_count: int = Field(..., ge=0)
    plantation_area: float = Field(..., ge=0.0)
    plantation_species: List[str] = Field(..., min_items=1)

    @field_validator("unit")
    @classmethod
    def validate_unit(cls, v: str) -> str:
        if v not in ["Acre", "Bigha"]:
            raise ValueError("Unit must be 'Acre' or 'Bigha'")
        return v

class Step3Request(BaseModel):
    state: str = Field(..., min_length=2)
    district: str = Field(..., min_length=2)
    tehsil: str = Field(..., min_length=2)
    village: str = Field(..., min_length=2)
    gram_panchayat: str = Field(..., min_length=2)
    post: str = Field(..., min_length=2)
    pincode: str = Field(..., pattern=r"^[1-9][0-9]{5}$", description="6 digit pincode")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)

class GPSPoint(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)

class Step4Request(BaseModel):
    boundary_points: List[GPSPoint] = Field(..., description="List of GPS boundary points")
    boundary_locked: bool

    @field_validator("boundary_points")
    @classmethod
    def validate_points(cls, points: List[GPSPoint]) -> List[GPSPoint]:
        if len(points) < 3:
            raise ValueError("Minimum 3 GPS points are required to define a boundary.")
        if len(points) > 100:
            raise ValueError("Maximum 100 GPS points are allowed.")
        
        # Check duplicate consecutive points
        for i in range(len(points) - 1):
            if (points[i].latitude == points[i+1].latitude and 
                points[i].longitude == points[i+1].longitude):
                raise ValueError("Duplicate consecutive points are not allowed.")
        return points

class CalculatedArea(BaseModel):
    square_meter: float
    acre: float
    hectare: float

class Step4Response(BaseModel):
    success: bool = True
    message: str
    current_step: int = 4
    calculated_area: Optional[CalculatedArea] = None

class Step5Request(BaseModel):
    preferred_date: str = Field(..., description="YYYY-MM-DD format preferred")
    preferred_time_slot: str = Field(..., description="Morning, Afternoon, Evening")
    landmark: Optional[str] = Field(None, max_length=200)
    special_instructions: Optional[str] = Field(None, max_length=500)

    @field_validator("preferred_time_slot")
    @classmethod
    def validate_time_slot(cls, v: str) -> str:
        if v not in ["Morning", "Afternoon", "Evening"]:
            raise ValueError("Preferred time slot must be 'Morning', 'Afternoon', or 'Evening'")
        return v

class Step6Request(BaseModel):
    tree_insurance: bool

class InvoiceItem(BaseModel):
    name: str
    amount: float

class InvoiceResponse(BaseModel):
    invoice_number: str
    farmer_details: dict
    land_details: dict
    billing_items: List[InvoiceItem]
    grand_total: float
    tax: float
    insurance_charges: float

class SubmitRegistrationResponse(BaseModel):
    registration_number: str
    application_id: str
    current_status: str
    submission_timestamp: datetime

class RegistrationResponse(BaseModel):
    id: str
    farmer_id: Optional[str] = None
    current_step: int
    status: str
    belongs_to_self: Optional[bool] = None
    farmer_name: Optional[str] = None
    father_guardian_name: Optional[str] = None
    mobile_number: Optional[str] = None
    total_area: Optional[float] = None
    unit: Optional[str] = None
    multiple_crops: Optional[bool] = None
    soil_composition: Optional[str] = None
    water_availability: Optional[str] = None
    tree_stock_count: Optional[int] = None
    plantation_area: Optional[float] = None
    plantation_species: Optional[List[str]] = None
    state: Optional[str] = None
    district: Optional[str] = None
    tehsil: Optional[str] = None
    village: Optional[str] = None
    gram_panchayat: Optional[str] = None
    post: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    boundary_points: Optional[List[GPSPoint]] = None
    boundary_locked: Optional[bool] = None
    calculated_area: Optional[CalculatedArea] = None
    preferred_date: Optional[str] = None
    preferred_time_slot: Optional[str] = None
    landmark: Optional[str] = None
    special_instructions: Optional[str] = None
    tree_insurance: Optional[bool] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
