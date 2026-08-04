from typing import List
from fastapi import APIRouter, Depends, Query
from app.schemas.product import ProductCardResponse
from app.services.recommendation import CropRecommendationService, SoilRecommendationService
from app.repositories.product import ProductRepository
from app.repositories.category import CategoryRepository

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

def get_crop_recommendation_service() -> CropRecommendationService:
    product_repo = ProductRepository()
    category_repo = CategoryRepository()
    return CropRecommendationService(product_repo, category_repo)

def get_soil_recommendation_service() -> SoilRecommendationService:
    product_repo = ProductRepository()
    category_repo = CategoryRepository()
    return SoilRecommendationService(product_repo, category_repo)

@router.get("/crop", response_model=List[ProductCardResponse])
async def get_crop_recommendations(
    crop: str = Query(..., description="Crop name to get product recommendations for", example="Wheat"),
    service: CropRecommendationService = Depends(get_crop_recommendation_service)
):
    """
    Get product recommendations based on a specific crop.
    Public endpoint. No authentication required.
    """
    return await service.get_crop_recommendations(crop)

@router.get("/soil", response_model=List[ProductCardResponse])
async def get_soil_recommendations(
    soil: str = Query(..., description="Soil type to get product recommendations for", example="Alluvial"),
    service: SoilRecommendationService = Depends(get_soil_recommendation_service)
):
    """
    Get product recommendations based on a specific soil type.
    Public endpoint. No authentication required.
    """
    return await service.get_soil_recommendations(soil)
