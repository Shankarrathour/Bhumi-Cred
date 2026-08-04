from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime, timezone
from app.schemas.vendor import ProductCreateRequest, ProductResponse
from app.models.product import Product
from app.dependencies.auth import CurrentVendor

router = APIRouter(prefix="/vendor/products", tags=["Vendor Products"])

@router.post("", response_model=ProductResponse)
async def create_product(request: ProductCreateRequest, current_vendor: CurrentVendor):
    if current_vendor.status != "Active":
        raise HTTPException(status_code=403, detail="Store is not approved yet.")
        
    product = Product(
        vendor_id=str(current_vendor.id),
        name=request.name,
        category=request.category,
        price=request.price,
        stock=request.stock,
        image_url=request.image_url,
        description=request.description,
        status="Pending"
    )
    await product.insert()
    
    return ProductResponse(
        id=str(product.id),
        vendor_id=product.vendor_id,
        name=product.name,
        category=product.category,
        price=product.price,
        stock=product.stock,
        image_url=product.image_url,
        description=product.description,
        status=product.status,
        created_at=product.created_at
    )

@router.get("", response_model=List[ProductResponse])
async def list_vendor_products(current_vendor: CurrentVendor):
    products = await Product.find({"vendor_id": str(current_vendor.id)}).to_list()
    return [
        ProductResponse(
            id=str(p.id),
            vendor_id=p.vendor_id,
            name=p.name,
            category=p.category,
            price=p.price,
            stock=p.stock,
            image_url=p.image_url,
            description=p.description,
            status=p.status,
            created_at=p.created_at
        ) for p in products
    ]

@router.delete("/{product_id}")
async def delete_product(product_id: str, current_vendor: CurrentVendor):
    product = await Product.get(product_id)
    if not product or product.vendor_id != str(current_vendor.id):
        raise HTTPException(status_code=404, detail="Product not found")
    
    await product.delete()
    return {"success": True, "message": "Product deleted successfully"}
