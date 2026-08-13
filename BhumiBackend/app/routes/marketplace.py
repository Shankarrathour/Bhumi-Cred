from fastapi import APIRouter
from typing import List
from pydantic import BaseModel
from app.models.product import Product

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])

class MarketplaceProductResponse(BaseModel):
    id: str
    name: str
    category: str
    price: float
    originalPrice: float
    rating: float
    image: str
    description: str
    vendor: str
    distance: str
    inStock: bool

@router.get("/products", response_model=List[MarketplaceProductResponse])
async def get_marketplace_products():
    products = await Product.find_all().to_list()
    
    response = []
    for p in products:
        vendor_name = getattr(p, "brand", None) or "Bhumi Store"
        
        # Category resolution
        category_name = getattr(p, "category", "General")
        if p.category_id:
            try:
                from app.models.category import Category
                cat = await Category.get(p.category_id)
                if cat and cat.name:
                    category_name = cat.name
            except Exception:
                pass
        
        image_url = p.primary_image or (p.images[0] if p.images else "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80")
        stock_qty = getattr(p, "stock_quantity", getattr(p, "stock", 0))

        response.append(MarketplaceProductResponse(
            id=str(p.id),
            name=p.name,
            category=category_name,
            price=p.price,
            originalPrice=getattr(p, "original_price", p.price * 1.2),
            rating=getattr(p, "rating", 4.5),
            image=image_url,
            description=p.description if p.description else "",
            vendor=vendor_name,
            distance="2.5 km",
            inStock=stock_qty > 0
        ))
        
    return response
