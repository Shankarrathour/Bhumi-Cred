from typing import Optional
from datetime import datetime
from pydantic import BaseModel, field_validator

from app.models.family_member import Relationship


class CreateFamilyMemberRequest(BaseModel):
    name: str
    relationship: Relationship
    age: Optional[int] = None
    occupation: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters.")
        return v

    @field_validator("age")
    @classmethod
    def validate_age(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 0 or v > 120):
            raise ValueError("Age must be between 0 and 120.")
        return v


class UpdateFamilyMemberRequest(BaseModel):
    name: Optional[str] = None
    relationship: Optional[Relationship] = None
    age: Optional[int] = None
    occupation: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 2:
                raise ValueError("Name must be at least 2 characters.")
        return v

    @field_validator("age")
    @classmethod
    def validate_age(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 0 or v > 120):
            raise ValueError("Age must be between 0 and 120.")
        return v


class FamilyMemberResponse(BaseModel):
    id: str
    name: str
    relationship: Relationship
    age: Optional[int] = None
    occupation: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
