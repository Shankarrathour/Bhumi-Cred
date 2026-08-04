from typing import Optional
from pydantic import BaseModel, field_validator

from app.validators.indian import validate_pincode


class AddressSchema(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    tehsil: Optional[str] = None
    village: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    full_address: Optional[str] = None
    gram_panchayat: Optional[str] = None
    vikash_khand: Optional[str] = None

    @field_validator("pincode")
    @classmethod
    def validate_pincode_field(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_pincode(v)
        return v


class UpdateAddressRequest(BaseModel):
    current_address: Optional[AddressSchema] = None
    permanent_address: Optional[AddressSchema] = None


class AddressResponse(BaseModel):
    current_address: AddressSchema
    permanent_address: Optional[AddressSchema] = None
