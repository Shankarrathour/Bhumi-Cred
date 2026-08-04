from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class CategoryBase(BaseModel):
    name: str = Field(..., max_length=100)
    icon: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    display_order: int = 0
    is_active: bool = True

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    icon: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

from typing import Annotated, Any
from pydantic import BeforeValidator

StrObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if v else v)]

class CategoryResponse(CategoryBase):
    id: StrObjectId
    slug: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
