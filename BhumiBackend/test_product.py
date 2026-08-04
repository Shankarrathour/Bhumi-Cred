import asyncio
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
from app.models.product import Product
from app.schemas.product import ProductCreate
from app.routes.vendor_product import get_vendor_product_service
from beanie import init_beanie, PydanticObjectId
from app.models.category import Category

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    await init_beanie(database=client.get_database("bhumi"), document_models=[Product, Category])
    
    unique_suffix = str(uuid.uuid4())[:8]
    data_dict = {
        "name": f"Test_{unique_suffix}",
        "description": "Desc",
        "category_id": "6a54d3e55f3f1d51b8d47efb",
        "sku": f"SKU_{unique_suffix}",
        "price": 200,
        "original_price": 2000,
        "stock_quantity": 100,
        "unit": "piece"
    }
    try:
        service = get_vendor_product_service()
        data = ProductCreate(**data_dict)
        response = await service.create_product("6a54d3e55f3f1d51b8d47efb", data)
        print("Success:", response)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Error:", type(e), e)

asyncio.run(main())
