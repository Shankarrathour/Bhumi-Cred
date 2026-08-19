import logging
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional
from fastapi import UploadFile
from app.repositories.product import ProductRepository
from app.repositories.category import CategoryRepository
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductCategoryResponse,
    ProductListResponse,
    VendorProductResponse,
    VendorProductListResponse,
    VendorProductUpdate,
)
from app.models.product import Product
from app.services.inventory import InventoryService
from app.integrations.cloudinary_service import CloudinaryService
from app.utils.upload import ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES
from app.config.settings import settings
from app.repositories.notification import NotificationRepository
from app.services.notification_service import NotificationService
from beanie import PydanticObjectId
from app.core.exceptions import AppException
from fastapi import status

logger = logging.getLogger(__name__)

def generate_slug(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = text.strip('-')
    return text

class ProductService:
    def __init__(self, product_repo: ProductRepository, category_repo: CategoryRepository):
        self.product_repo = product_repo
        self.category_repo = category_repo

    async def _build_response(self, product: Product) -> ProductResponse:
        # Fetch category
        category = await self.category_repo.get_by_id(str(product.category_id))
        category_data = ProductCategoryResponse(id=str(product.category_id), name="Unknown Category", slug="unknown")
        if category:
            category_data = ProductCategoryResponse(id=str(category.id), name=category.name, slug=category.slug)
            
        # Convert product to dict for response building
        product_dict = product.model_dump()
        product_dict["id"] = str(product.id)
        product_dict["category"] = category_data
        product_dict["category_id"] = str(product.category_id)
            
        return ProductResponse.model_validate(product_dict)

    async def create_product(self, product_data: ProductCreate) -> ProductResponse:
        # Validate Category
        category = await self.category_repo.get_by_id(str(product_data.category_id))
        if not category or not category.is_active:
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code="INVALID_CATEGORY",
                detail="Category does not exist or is inactive.",
            )

        # Validate Name uniqueness
        existing_name = await self.product_repo.get_by_name(product_data.name)
        if existing_name:
            raise AppException(
                status_code=status.HTTP_409_CONFLICT,
                error_code="PRODUCT_NAME_EXISTS",
                detail="A product with this name already exists.",
            )

        # Validate SKU uniqueness
        existing_sku = await self.product_repo.get_by_sku(product_data.sku)
        if existing_sku:
            raise AppException(
                status_code=status.HTTP_409_CONFLICT,
                error_code="PRODUCT_SKU_EXISTS",
                detail="A product with this SKU already exists.",
            )

        # Generate slug
        slug = generate_slug(product_data.name)
        existing_slug = await self.product_repo.get_by_slug(slug)
        if existing_slug:
            raise AppException(
                status_code=status.HTTP_409_CONFLICT,
                error_code="PRODUCT_SLUG_EXISTS",
                detail="A product with this generated slug already exists. Please use a different name.",
            )

        product = await self.product_repo.create(product_data, slug)
        return await self._build_response(product)

    async def _build_card_response(self, product: Product) -> Any: # ProductCardResponse
        from app.schemas.product import ProductCardResponse
        
        category = await self.category_repo.get_by_id(str(product.category_id))
        category_data = ProductCategoryResponse(id=str(product.category_id), name="Unknown Category", slug="unknown")
        if category:
            category_data = ProductCategoryResponse(id=str(category.id), name=category.name, slug=category.slug)
            
        product_dict = product.model_dump()
        product_dict["id"] = str(product.id)
        product_dict["category"] = category_data
        return ProductCardResponse.model_validate(product_dict)

    async def get_all_products(
        self,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        category_id: Optional[str] = None,
        category_slug: Optional[str] = None,
        featured: Optional[bool] = None,
        sort: Optional[str] = "newest",
    ) -> Any: # ProductListResponse
        from app.schemas.product import ProductListResponse
        import math

        if category_slug and not category_id:
            category = await self.category_repo.get_by_slug(category_slug)
            if not category:
                # Category doesn't exist, return empty
                return ProductListResponse(
                    items=[], page=page, limit=limit,
                    total=0, total_pages=0, has_next=False, has_previous=False
                )
            category_id = str(category.id)

        products, total = await self.product_repo.get_all(
            page=page, limit=limit, search=search,
            category_id=category_id, featured=featured, sort=sort
        )
        
        responses = [await self._build_card_response(p) for p in products]
        total_pages = math.ceil(total / limit) if total > 0 else 0
        has_next = page < total_pages
        has_previous = page > 1
        
        return ProductListResponse(
            items=responses,
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
            has_next=has_next,
            has_previous=has_previous
        )

    async def get_product_by_id(self, product_id: str) -> ProductResponse:
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                error_code="PRODUCT_NOT_FOUND",
                detail="Product not found.",
            )
        return await self._build_response(product)

    async def get_product_by_slug(self, slug: str) -> ProductResponse:
        product = await self.product_repo.get_by_slug(slug)
        if not product:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                error_code="PRODUCT_NOT_FOUND",
                detail="Product not found.",
            )
        return await self._build_response(product)

    async def update_product(self, product_id: str, update_data: ProductUpdate) -> ProductResponse:
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                error_code="PRODUCT_NOT_FOUND",
                detail="Product not found.",
            )

        new_slug = None
        if update_data.name and update_data.name != product.name:
            existing_name = await self.product_repo.get_by_name(update_data.name)
            if existing_name and str(existing_name.id) != str(product.id):
                raise AppException(
                    status_code=status.HTTP_409_CONFLICT,
                    error_code="PRODUCT_NAME_EXISTS",
                    detail="A product with this name already exists.",
                )
            
            new_slug = generate_slug(update_data.name)
            existing_slug = await self.product_repo.get_by_slug(new_slug)
            if existing_slug and str(existing_slug.id) != str(product.id):
                raise AppException(
                    status_code=status.HTTP_409_CONFLICT,
                    error_code="PRODUCT_SLUG_EXISTS",
                    detail="A product with this generated slug already exists.",
                )

        if update_data.sku and update_data.sku != product.sku:
            existing_sku = await self.product_repo.get_by_sku(update_data.sku)
            if existing_sku and str(existing_sku.id) != str(product.id):
                raise AppException(
                    status_code=status.HTTP_409_CONFLICT,
                    error_code="PRODUCT_SKU_EXISTS",
                    detail="A product with this SKU already exists.",
                )

        if update_data.category_id and str(update_data.category_id) != str(product.category_id):
            category = await self.category_repo.get_by_id(str(update_data.category_id))
            if not category or not category.is_active:
                raise AppException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    error_code="INVALID_CATEGORY",
                    detail="Category does not exist or is inactive.",
                )

        updated_product = await self.product_repo.update(product, update_data, new_slug=new_slug)
        return await self._build_response(updated_product)

    async def delete_product(self, product_id: str) -> dict:
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                error_code="PRODUCT_NOT_FOUND",
                detail="Product not found.",
            )
        await self.product_repo.delete(product)
        return {"success": True, "message": "Product deleted successfully"}

class VendorProductService:
    def __init__(
        self,
        product_repo: ProductRepository,
        category_repo: CategoryRepository,
        inventory_service: InventoryService,
        cloudinary_svc: Optional[CloudinaryService] = None,
        notification_service: Optional[NotificationService] = None,
    ):
        self.product_repo = product_repo
        self.category_repo = category_repo
        self.inventory_service = inventory_service
        self.product_service = ProductService(product_repo, category_repo)
        self._cloudinary = cloudinary_svc
        self._notifications = notification_service or NotificationService(NotificationRepository())

    async def _build_vendor_response(self, product: Product) -> VendorProductResponse:
        category = await self.category_repo.get_by_id(str(product.category_id))
        from app.schemas.product import ProductCategoryResponse
        category_data = ProductCategoryResponse(id=str(product.category_id), name="Unknown Category", slug="unknown")
        if category:
            category_data = ProductCategoryResponse(id=str(category.id), name=category.name, slug=category.slug)
            
        product_dict = product.model_dump()
        product_dict["id"] = str(product.id)
        product_dict["category"] = category_data
        product_dict["category_id"] = str(product.category_id)
            
        return VendorProductResponse.model_validate(product_dict)

    async def create_product(self, vendor_id: str, data: ProductCreate) -> VendorProductResponse:
        slug = generate_slug(data.name)
        if await self.product_repo.get_by_slug(slug):
            raise AppException(status_code=status.HTTP_409_CONFLICT, error_code="SLUG_EXISTS", detail="Product name already exists")
            
        if await self.product_repo.get_by_sku(data.sku):
            raise AppException(status_code=status.HTTP_409_CONFLICT, error_code="SKU_EXISTS", detail="SKU already exists")
            
        data_dict = data.model_dump()
        data_dict["vendor_id"] = PydanticObjectId(vendor_id)
        data_dict["slug"] = slug
        product = Product(**data_dict)
        await product.insert()

        try:
            vendor = await Vendor.get(PydanticObjectId(vendor_id))
            if vendor:
                await self._notifications.create_admin_notification(
                    "Product Added",
                    f"Vendor {vendor.vendor_id} added a new marketplace product.",
                    type="product_added",
                    actor_type="vendor",
                )
        except Exception:
            logger.exception(f"Failed to create admin notification for new product {product.id}")

        return await self._build_vendor_response(product)

    async def get_vendor_products(self, vendor_id: str, page: int, limit: int, search: str = None, status_filter: str = None) -> VendorProductListResponse:
        products, total = await self.product_repo.get_by_vendor(vendor_id, page, limit, search, status_filter)
        total_pages = (total + limit - 1) // limit
        items = [await self._build_vendor_response(p) for p in products]
        return VendorProductListResponse(
            items=items,
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1
        )

    async def get_vendor_product(self, vendor_id: str, product_id: str) -> VendorProductResponse:
        product = await self.product_repo.get_vendor_product(vendor_id, product_id)
        if not product:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, error_code="PRODUCT_NOT_FOUND", detail="Product not found")
        return await self._build_vendor_response(product)

    async def update_vendor_product(self, vendor_id: str, product_id: str, data: VendorProductUpdate) -> VendorProductResponse:
        product = await self.product_repo.get_vendor_product(vendor_id, product_id)
        if not product:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, error_code="PRODUCT_NOT_FOUND", detail="Product not found")
            
        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            return await self._build_vendor_response(product)
            
        if "name" in update_data and update_data["name"] != product.name:
            slug = generate_slug(update_data["name"])
            existing = await self.product_repo.get_by_slug(slug)
            if existing and str(existing.id) != str(product.id):
                raise AppException(status_code=status.HTTP_409_CONFLICT, error_code="SLUG_EXISTS", detail="Product name already exists")
            update_data["slug"] = slug
            
        if "sku" in update_data and update_data["sku"] != product.sku:
             existing = await self.product_repo.get_by_sku(update_data["sku"])
             if existing and str(existing.id) != str(product.id):
                  raise AppException(status_code=status.HTTP_409_CONFLICT, error_code="SKU_EXISTS", detail="SKU already exists")
                  
        updated = await self.product_repo.update(product_id, update_data)

        try:
            vendor = await Vendor.get(PydanticObjectId(vendor_id))
            if vendor:
                await self._notifications.create_admin_notification(
                    "Product Updated",
                    f"Vendor {vendor.vendor_id} updated a marketplace product.",
                    type="product_updated",
                    actor_type="vendor",
                )
        except Exception:
            logger.exception(f"Failed to create admin notification for product update {product_id}")

        return await self._build_vendor_response(updated)

    async def update_stock(self, vendor_id: str, product_id: str, quantity: int) -> VendorProductResponse:
        product = await self.product_repo.get_vendor_product(vendor_id, product_id)
        if not product:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, error_code="PRODUCT_NOT_FOUND", detail="Product not found")
            
        updated = await self.product_repo.update_stock(product_id, quantity)
        return await self._build_vendor_response(updated)

    async def upload_product_image(self, vendor_id: str, product_id: str, file: UploadFile) -> VendorProductResponse:
        """
        Upload one image for a product owned by the current vendor and append
        it to the product's image list. The first image uploaded also becomes
        primary_image/thumbnail. Mirrors the upload pattern already used for
        vendor profile photos / KYC documents (VendorAuthService.upload_photo).
        """
        product = await self.product_repo.get_vendor_product(vendor_id, product_id)
        if not product:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, error_code="PRODUCT_NOT_FOUND", detail="Product not found")

        if self._cloudinary and self._cloudinary.is_enabled:
            folder = f"bhumi/{settings.cloudinary_env}/products/{product.id}/images"
            new_asset = await self._cloudinary.upload(
                file, folder=folder, allowed_types=ALLOWED_IMAGE_TYPES, max_bytes=MAX_PHOTO_BYTES,
            )
            image_url = new_asset.secure_url
            try:
                product.images.append(image_url)
                product.image_assets.append(new_asset)
                if not product.primary_image:
                    product.primary_image = image_url
                    product.thumbnail = image_url
                product.updated_at = datetime.now(timezone.utc)
                await product.save()
            except Exception:
                await self._cloudinary.delete(new_asset)
                raise
            return await self._build_vendor_response(product)

        from app.utils.upload import upload_file
        image_url = await upload_file(file, f"products/{product.id}/images", ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES)
        product.images.append(image_url)
        if not product.primary_image:
            product.primary_image = image_url
            product.thumbnail = image_url
        product.updated_at = datetime.now(timezone.utc)
        await product.save()
        return await self._build_vendor_response(product)

    async def delete_vendor_product(self, vendor_id: str, product_id: str) -> None:
        product = await self.product_repo.get_vendor_product(vendor_id, product_id)
        if not product:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, error_code="PRODUCT_NOT_FOUND", detail="Product not found")
            
        await self.product_repo.soft_delete_vendor_product(product)
        return {"success": True, "message": "Product deleted successfully"}
