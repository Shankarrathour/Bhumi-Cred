from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class BannerBase(BaseModel):
    title: str
    image_url: str
    link_url: Optional[str] = None
    redirect_type: Optional[str] = "internal"
    is_active: Optional[bool] = True
    priority: Optional[int] = 999
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class BannerCreate(BannerBase):
    pass

class BannerUpdate(BaseModel):
    title: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    redirect_type: Optional[str] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class BannerResponse(BannerBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
