from fastapi import APIRouter, HTTPException, Depends
from typing import List
from beanie import PydanticObjectId
from datetime import datetime, timezone

from app.models.banner import Banner
from app.schemas.banner import BannerCreate, BannerUpdate, BannerResponse

# Router for mobile/public access (read-only)
mobile_router = APIRouter(prefix="/banners", tags=["Banners (Mobile)"])

# Router for admin access (CRUD)
admin_router = APIRouter(prefix="/admin/banners", tags=["Banners (Admin)"])


@mobile_router.get("", response_model=List[BannerResponse])
@mobile_router.get("/", response_model=List[BannerResponse])
async def get_active_banners():
    """
    Fetch all active banners for the mobile application.
    Sorted by priority (ascending), so priority 1 comes before 999.
    """
    banners = await Banner.find(Banner.is_active == True).sort("+priority").to_list()
    
    # Format for response
    response_banners = []
    for b in banners:
        b_dict = b.dict(by_alias=True)
        b_dict["id"] = str(b.id)
        response_banners.append(BannerResponse(**b_dict))
        
    return response_banners


@admin_router.get("", response_model=List[BannerResponse])
@admin_router.get("/", response_model=List[BannerResponse])
async def get_all_banners():
    """
    Fetch all banners (active and inactive) for the CMS admin panel.
    """
    banners = await Banner.find_all().sort("-created_at").to_list()
    
    response_banners = []
    for b in banners:
        b_dict = b.dict(by_alias=True)
        b_dict["id"] = str(b.id)
        response_banners.append(BannerResponse(**b_dict))
        
    return response_banners


@admin_router.post("/", response_model=BannerResponse)
async def create_banner(banner_data: BannerCreate):
    """
    Create a new promotional banner.
    """
    new_banner = Banner(**banner_data.dict())
    await new_banner.insert()
    
    b_dict = new_banner.dict(by_alias=True)
    b_dict["id"] = str(new_banner.id)
    return BannerResponse(**b_dict)


@admin_router.put("/{banner_id}", response_model=BannerResponse)
async def update_banner(banner_id: PydanticObjectId, banner_data: BannerUpdate):
    """
    Update an existing banner.
    """
    banner = await Banner.get(banner_id)
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
        
    update_data = banner_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(banner, key, value)
        
    banner.updated_at = datetime.now(timezone.utc)
    await banner.save()
    
    b_dict = banner.dict(by_alias=True)
    b_dict["id"] = str(banner.id)
    return BannerResponse(**b_dict)


@admin_router.delete("/{banner_id}", status_code=204)
async def delete_banner(banner_id: PydanticObjectId):
    """
    Delete a banner.
    """
    banner = await Banner.get(banner_id)
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
        
    await banner.delete()
    return None
