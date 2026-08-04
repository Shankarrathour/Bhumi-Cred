from typing import Optional
from datetime import datetime, timezone
from beanie import Document
from pydantic import Field

class Banner(Document):
    title: str
    image_url: str
    link_url: Optional[str] = None
    redirect_type: str = Field(default="internal", description="Type of redirect: 'internal', 'external', 'none'")
    is_active: bool = True
    priority: int = Field(default=999)
    
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "banners"
