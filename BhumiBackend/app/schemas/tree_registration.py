from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.tree_registration import TreeRegistrationStatus


class RegisterTreeRequest(BaseModel):
    tree_name: str = Field(..., description="Name of the tree")
    tree_species: str = Field(..., description="Species of the tree")
    tree_count: int = Field(..., gt=0, description="Number of trees")
    tree_age: int = Field(..., ge=0, description="Age of the tree in months or years")
    plantation_year: int = Field(..., description="Year of plantation")
    land_id: Optional[str] = Field(None, description="Associated land ID if any")
    latitude: float = Field(..., description="Latitude of plantation")
    longitude: float = Field(..., description="Longitude of plantation")
    village: str = Field(..., description="Village name")
    district: str = Field(..., description="District name")
    state: str = Field(..., description="State name")
    photos: list[str] = Field(default_factory=list, description="List of photo URLs")
    insurance_required: bool = Field(False, description="Is insurance required?")
    remarks: Optional[str] = Field(None, description="Any additional remarks")


class UpdateTreeRequest(BaseModel):
    tree_name: Optional[str] = None
    tree_species: Optional[str] = None
    tree_count: Optional[int] = Field(None, gt=0)
    tree_age: Optional[int] = Field(None, ge=0)
    plantation_year: Optional[int] = None
    land_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    photos: Optional[list[str]] = None
    insurance_required: Optional[bool] = None
    remarks: Optional[str] = None


class TreeRegistrationResponse(BaseModel):
    id: str
    farmer_id: str
    tree_name: str
    tree_species: str
    tree_count: int
    tree_age: int
    plantation_year: int
    land_id: Optional[str]
    latitude: float
    longitude: float
    village: str
    district: str
    state: str
    photos: list[str]
    insurance_required: bool
    remarks: Optional[str]
    status: TreeRegistrationStatus
    created_at: datetime
    updated_at: datetime


class FarmerDetails(BaseModel):
    farmer_id: str
    full_name: Optional[str]
    mobile: str
    village: Optional[str]
    district: Optional[str]


class AdminTreeRegistrationResponse(BaseModel):
    id: str
    tree_details: TreeRegistrationResponse
    farmer_details: FarmerDetails


class TreeStatusUpdateRequest(BaseModel):
    status: TreeRegistrationStatus
    remarks: Optional[str] = None
