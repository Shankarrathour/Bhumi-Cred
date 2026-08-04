import logging
from typing import Optional
from app.repositories.product import ProductRepository
from app.services.product import ProductService
from app.schemas.product import AdminPendingProductResponse, AdminPendingProductListResponse, AdminProductStatusUpdateResponse
from app.models.product import ProductStatus
from app.core.exceptions import AppException
from app.services.notification_service import NotificationService
from fastapi import status

logger = logging.getLogger(__name__)

class AdminProductApprovalService:
    def __init__(self, product_repo: ProductRepository, product_service: ProductService, notification_service: NotificationService):
        self.product_repo = product_repo
        self.product_service = product_service
        self.notification_service = notification_service

    async def get_pending_products(
        self,
        page: int,
        limit: int,
        search: Optional[str] = None,
        vendor_id: Optional[str] = None,
        category_id: Optional[str] = None
    ) -> AdminPendingProductListResponse:
        products, total = await self.product_repo.get_pending_products(
            page, limit, search, vendor_id, category_id
        )
        total_pages = (total + limit - 1) // limit

        items = []
        for p in products:
            resp = await self.product_service._build_response(p)
            items.append(AdminPendingProductResponse.model_validate(resp))

        return AdminPendingProductListResponse(
            items=items,
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1
        )

    async def list_products(
        self,
        page: int,
        limit: int,
        search: Optional[str] = None,
        vendor_id: Optional[str] = None,
        category_id: Optional[str] = None,
        status: Optional[ProductStatus] = None,
    ) -> AdminPendingProductListResponse:
        """List products of any (or a specific) status for the moderation table."""
        products, total = await self.product_repo.get_all_for_admin(
            page, limit, search, vendor_id, category_id, status
        )
        total_pages = (total + limit - 1) // limit if total else 1

        items = []
        for p in products:
            resp = await self.product_service._build_response(p)
            items.append(AdminPendingProductResponse.model_validate(resp))

        return AdminPendingProductListResponse(
            items=items,
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1
        )

    async def get_pending_product(self, product_id: str) -> AdminPendingProductResponse:
        product = await self.product_repo.get_pending_product(product_id)
        if not product:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, error_code="PRODUCT_NOT_FOUND", detail="Pending product not found")
            
        resp = await self.product_service._build_response(product)
        # Validate from the model instance itself, not resp.model_dump(): category_id
        # is `Field(exclude=True)` on ProductResponse, so dumping to a dict first drops
        # that required field and 422s. Attribute access (ProductResponse.Config has
        # from_attributes=True) still sees it fine.
        return AdminPendingProductResponse.model_validate(resp)
        # return AdminPendingProductResponse.model_validate(resp.model_dump())

    def _is_valid_transition(self, current_status: ProductStatus, new_status: ProductStatus) -> bool:
        valid_transitions = {
            ProductStatus.PENDING: [ProductStatus.APPROVED, ProductStatus.REJECTED],
            ProductStatus.APPROVED: [ProductStatus.SUSPENDED],
            ProductStatus.SUSPENDED: [ProductStatus.APPROVED],
            ProductStatus.REJECTED: [ProductStatus.APPROVED],
        }
        return new_status in valid_transitions.get(current_status, [])

    async def _update_status(self, product_id: str, admin_id: str, new_status: ProductStatus, action_msg: str) -> AdminProductStatusUpdateResponse:
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise AppException(status_code=status.HTTP_404_NOT_FOUND, error_code="PRODUCT_NOT_FOUND", detail="Product not found")
            
        if not self._is_valid_transition(product.status, new_status):
            raise AppException(
                status_code=status.HTTP_409_CONFLICT,
                error_code="INVALID_TRANSITION",
                detail=f"Cannot transition product from {product.status.value} to {new_status.value}."
            )
            
        updated_product = await self.product_repo.update_status(
            product=product,
            new_status=new_status,
            changed_by=f"ADMIN:{admin_id}",
            remarks=action_msg
        )
        
        return AdminProductStatusUpdateResponse(
            product_id=str(updated_product.id),
            status=updated_product.status,
            message=f"Product successfully {new_status.value}",
            updated_at=updated_product.updated_at
        )

    async def approve_product(self, product_id: str, admin_id: str) -> AdminProductStatusUpdateResponse:
        product = await self.product_repo.get_by_id(product_id)
        resp = await self._update_status(product_id, admin_id, ProductStatus.APPROVED, "Approved by Admin")
        if product and product.vendor_id:
            try:
                await self.notification_service.create_vendor_notification(
                    str(product.vendor_id),
                    "Marketplace Listing Approved",
                    "Your marketplace listing has been approved and is now live.",
                    type="marketplace",
                )
            except Exception:
                logger.exception(f"Failed to create listing-approved notification for product {product_id}")
        return resp

    async def reject_product(self, product_id: str, admin_id: str) -> AdminProductStatusUpdateResponse:
        product = await self.product_repo.get_by_id(product_id)
        resp = await self._update_status(product_id, admin_id, ProductStatus.REJECTED, "Rejected by Admin")
        if product and product.vendor_id:
            try:
                await self.notification_service.create_vendor_notification(
                    str(product.vendor_id),
                    "Marketplace Listing Rejected",
                    "Your marketplace listing has been rejected. Please review and update it.",
                    type="marketplace",
                )
            except Exception:
                logger.exception(f"Failed to create listing-rejected notification for product {product_id}")
        return resp

    async def suspend_product(self, product_id: str, admin_id: str) -> AdminProductStatusUpdateResponse:
        return await self._update_status(product_id, admin_id, ProductStatus.SUSPENDED, "Suspended by Admin")

    async def restore_product(self, product_id: str, admin_id: str) -> AdminProductStatusUpdateResponse:
        return await self._update_status(product_id, admin_id, ProductStatus.APPROVED, "Restored by Admin")
