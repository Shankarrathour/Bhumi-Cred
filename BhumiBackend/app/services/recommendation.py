from typing import List
from app.repositories.product import ProductRepository
from app.repositories.category import CategoryRepository
from app.schemas.product import ProductCardResponse, ProductCategoryResponse

class BaseRecommendationService:
    def __init__(self, product_repo: ProductRepository, category_repo: CategoryRepository):
        self.product_repo = product_repo
        self.category_repo = category_repo

    async def _build_card_responses(self, products) -> List[ProductCardResponse]:
        if not products:
            return []
            
        category_ids = list({str(p.category_id) for p in products})
        categories = await self.category_repo.get_by_ids(category_ids)
        category_map = {str(c.id): c for c in categories}
        
        responses = []
        for product in products:
            c = category_map.get(str(product.category_id))
            if c:
                category_data = ProductCategoryResponse(id=str(c.id), name=c.name, slug=c.slug)
            else:
                category_data = ProductCategoryResponse(id=str(product.category_id), name="Unknown Category", slug="unknown")
                
            product_dict = product.model_dump()
            product_dict["id"] = str(product.id)
            product_dict["category"] = category_data
            responses.append(ProductCardResponse.model_validate(product_dict))
            
        return responses

class CropRecommendationService(BaseRecommendationService):
    async def get_crop_recommendations(self, crop: str) -> List[ProductCardResponse]:
        normalized_crop = crop.strip().lower()
        products = await self.product_repo.get_products_by_crop(normalized_crop)
        return await self._build_card_responses(products)

class SoilRecommendationService(BaseRecommendationService):
    async def get_soil_recommendations(self, soil: str) -> List[ProductCardResponse]:
        normalized_soil = soil.strip().lower()
        products = await self.product_repo.get_products_by_soil(normalized_soil)
        return await self._build_card_responses(products)
