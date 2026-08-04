import re
from typing import List
from app.repositories.category import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.models.category import Category
from app.core.exceptions import AppException
from fastapi import status

def generate_slug(text: str) -> str:
    # Convert to lowercase
    text = text.lower()
    # Replace non-alphanumeric characters with hyphens
    text = re.sub(r'[^a-z0-9]+', '-', text)
    # Remove leading and trailing hyphens
    text = text.strip('-')
    return text

class CategoryService:
    def __init__(self, repository: CategoryRepository):
        self.repository = repository

    async def create_category(self, category_data: CategoryCreate) -> Category:
        # Check if name exists
        existing_name = await self.repository.get_by_name(category_data.name)
        if existing_name:
            raise AppException(
                status_code=status.HTTP_409_CONFLICT,
                error_code="CATEGORY_ALREADY_EXISTS",
                detail="A category with this name already exists.",
            )

        # Generate and validate slug
        slug = generate_slug(category_data.name)
        existing_slug = await self.repository.get_by_slug(slug)
        if existing_slug:
            raise AppException(
                status_code=status.HTTP_409_CONFLICT,
                error_code="SLUG_ALREADY_EXISTS",
                detail="A category with this generated slug already exists. Please use a different name.",
            )

        return await self.repository.create(category_data, slug)

    async def get_all_categories(self, include_inactive: bool = False) -> List[Category]:
        return await self.repository.get_all(include_inactive=include_inactive)

    async def get_category_by_id(self, category_id: str) -> Category:
        category = await self.repository.get_by_id(category_id)
        if not category:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                error_code="CATEGORY_NOT_FOUND",
                detail="Category not found.",
            )
        return category

    async def get_category_by_slug(self, slug: str) -> Category:
        category = await self.repository.get_by_slug(slug)
        if not category:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                error_code="CATEGORY_NOT_FOUND",
                detail="Category not found.",
            )
        return category

    async def update_category(self, category_id: str, update_data: CategoryUpdate) -> Category:
        category = await self.get_category_by_id(category_id)

        new_slug = None
        if update_data.name and update_data.name != category.name:
            # Check name uniqueness
            existing_name = await self.repository.get_by_name(update_data.name)
            if existing_name and str(existing_name.id) != str(category.id):
                raise AppException(
                    status_code=status.HTTP_409_CONFLICT,
                    error_code="CATEGORY_ALREADY_EXISTS",
                    detail="A category with this name already exists.",
                )
            
            # Check slug uniqueness
            new_slug = generate_slug(update_data.name)
            existing_slug = await self.repository.get_by_slug(new_slug)
            if existing_slug and str(existing_slug.id) != str(category.id):
                raise AppException(
                    status_code=status.HTTP_409_CONFLICT,
                    error_code="SLUG_ALREADY_EXISTS",
                    detail="A category with this generated slug already exists.",
                )

        return await self.repository.update(category, update_data, new_slug=new_slug)

    async def delete_category(self, category_id: str) -> dict:
        category = await self.get_category_by_id(category_id)
        await self.repository.delete(category)
        return {"success": True, "message": "Category deleted successfully"}

    async def seed_default_categories(self):
        default_categories = [
            {"name": "Saplings", "icon": "leaf", "display_order": 1, "description": "High-quality saplings for farming."},
            {"name": "Seeds", "icon": "seedling", "display_order": 2, "description": "Various seeds for a bountiful harvest."},
            {"name": "Fertilizers", "icon": "flask", "display_order": 3, "description": "Nutrients and fertilizers to boost growth."},
            {"name": "Farming Tools", "icon": "hammer", "display_order": 4, "description": "Tools and implements for daily farming."},
            {"name": "Irrigation", "icon": "water", "display_order": 5, "description": "Watering and irrigation systems."},
            {"name": "Pesticides", "icon": "bug", "display_order": 6, "description": "Crop protection and pest control."},
            {"name": "Equipment", "icon": "tractor", "display_order": 7, "description": "Heavy machinery and farming equipment."}
        ]
        
        for cat_data in default_categories:
            slug = generate_slug(cat_data["name"])
            existing = await self.repository.get_by_slug(slug)
            if not existing:
                create_data = CategoryCreate(**cat_data)
                await self.repository.create(create_data, slug)
