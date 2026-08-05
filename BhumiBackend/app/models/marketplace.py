from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Dict, Any
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field, EmailStr
from pymongo import IndexModel, ASCENDING, DESCENDING


# ── Enums ──────────────────────────────────────────────────────────────────────

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"

class ShippingStatus(str, Enum):
    LABEL_CREATED = "label_created"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    RETURNED = "returned"

class ReturnStatus(str, Enum):
    REQUESTED = "requested"
    APPROVED = "approved"
    PICKED_UP = "picked_up"
    REFUNDED = "refunded"
    REJECTED = "rejected"

class DiscountType(str, Enum):
    PERCENTAGE = "percentage"
    FLAT = "flat"


# ── Embedded Schemas ─────────────────────────────────────────────────────────

class ShippingAddress(BaseModel):
    full_name: str
    phone_number: str = Field(..., pattern=r"^[6-9]\d{9}$")
    street_address: str
    village_or_city: str
    district: str
    state: str
    pincode: str = Field(..., pattern=r"^\d{6}$")


# ── Top-Level Beanie Document Collections ───────────────────────────────────

class MarketplaceSubscription(Document):
    subscription_id: str = Field(..., description="Unique Sub ID, e.g., SUB-SEED-2026-01")
    farmer_id: PydanticObjectId
    product_id: PydanticObjectId
    frequency_months: int = Field(default=1, ge=1)
    next_delivery_date: datetime
    auto_debit_wallet: bool = True
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "marketplace_subscriptions"
        indexes = [
            IndexModel([("subscription_id", ASCENDING)], unique=True),
            IndexModel([("farmer_id", ASCENDING), ("status", ASCENDING)])
        ]


class MarketplaceVendorPayout(Document):
    payout_id: str = Field(..., description="Unique Payout ID, e.g., VPO-2026-08-01")
    vendor_id: PydanticObjectId
    settlement_period_start: datetime
    settlement_period_end: datetime
    total_sales_inr: float = Field(..., ge=0)
    commission_deducted_inr: float = Field(default=0.0, ge=0)
    tds_deducted_inr: float = Field(default=0.0, ge=0)
    net_payout_inr: float = Field(..., ge=0)
    payout_status: str = "disbursed"
    gateway_payout_ref: Optional[str] = None
    disbursed_at: Optional[datetime] = None

    class Settings:
        name = "marketplace_vendor_payouts"
        indexes = [
            IndexModel([("payout_id", ASCENDING)], unique=True),
            IndexModel([("vendor_id", ASCENDING), ("disbursed_at", DESCENDING)])
        ]


class MarketplaceWishlist(Document):
    wishlist_id: str = Field(..., description="Unique Wishlist ID, e.g., WSH-FARM-001")
    farmer_id: PydanticObjectId
    product_ids: List[PydanticObjectId] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "marketplace_wishlists"
        indexes = [
            IndexModel([("wishlist_id", ASCENDING)], unique=True),
            IndexModel([("farmer_id", ASCENDING)], unique=True)
        ]


class MarketplaceVendor(Document):
    vendor_id: str = Field(..., description="Unique Vendor ID, e.g., VND-2026-0042")
    company_name: str
    store_name: str
    contact_email: EmailStr
    contact_phone: str = Field(..., pattern=r"^[6-9]\d{9}$")
    gstin: Optional[str] = None
    pan_number: Optional[str] = None
    fssai_license_number: Optional[str] = None
    organic_certifying_body: Optional[str] = None
    rating: float = Field(default=5.0, ge=1.0, le=5.0)
    total_products_count: int = 0
    is_verified: bool = True

    # Audit & Soft Delete
    created_by_id: Optional[PydanticObjectId] = None
    updated_by_id: Optional[PydanticObjectId] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by_id: Optional[PydanticObjectId] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    async def soft_delete(self, deleted_by: Optional[PydanticObjectId] = None):
        """Soft delete vendor profile."""
        self.is_deleted = True
        self.is_verified = False
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by_id = deleted_by
        self.updated_at = datetime.now(timezone.utc)
        await self.save()

    class Settings:
        name = "marketplace_vendors"
        indexes = [
            IndexModel([("vendor_id", ASCENDING)], unique=True),
            IndexModel([("gstin", ASCENDING)], unique=True, sparse=True),
            IndexModel([("is_deleted", ASCENDING)]),
            IndexModel([("store_name", "text")])
        ]


class MarketplaceCategory(Document):
    category_id: str = Field(..., description="Unique Category ID, e.g., CAT-SEED-01")
    category_name: str
    slug: str
    parent_category_id: Optional[str] = None
    icon_url: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True

    class Settings:
        name = "marketplace_categories"
        indexes = [
            IndexModel([("category_id", ASCENDING)], unique=True),
            IndexModel([("slug", ASCENDING)], unique=True)
        ]


class MarketplaceProduct(Document):
    product_id: str = Field(..., description="Unique Product ID, e.g., PRD-BIO-FERT-089")
    vendor_id: PydanticObjectId
    category_id: PydanticObjectId
    title: str = Field(..., min_length=2, max_length=200)
    slug: str
    description: str
    brand: str
    sku: str = Field(..., min_length=3)
    pack_size: str = "5 kg Bag"
    weight_kg: float = Field(default=5.0, gt=0)
    technical_composition: Optional[str] = None
    price_inr: float = Field(..., gt=0)
    discount_price_inr: Optional[float] = Field(None, gt=0)
    stock_quantity: int = Field(default=0, ge=0)
    is_organic_certified: bool = False
    certification_doc_url: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    rating: float = Field(default=5.0, ge=1.0, le=5.0)
    reviews_count: int = 0
    is_active: bool = True

    # Audit & Soft Delete
    created_by_id: Optional[PydanticObjectId] = None
    updated_by_id: Optional[PydanticObjectId] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by_id: Optional[PydanticObjectId] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    async def soft_delete(self, deleted_by: Optional[PydanticObjectId] = None):
        """Soft delete product."""
        self.is_deleted = True
        self.is_active = False
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by_id = deleted_by
        self.updated_at = datetime.now(timezone.utc)
        await self.save()

    class Settings:
        name = "marketplace_products"
        indexes = [
            IndexModel([("product_id", ASCENDING)], unique=True),
            IndexModel([("sku", ASCENDING)], unique=True),
            IndexModel([("vendor_id", ASCENDING), ("is_active", ASCENDING)]),
            IndexModel([("category_id", ASCENDING), ("is_active", ASCENDING)]),
            IndexModel([("is_deleted", ASCENDING), ("is_active", ASCENDING)]),
            IndexModel([("title", "text"), ("description", "text"), ("brand", "text")])
        ]


class MarketplaceInventory(Document):
    inventory_id: str = Field(..., description="Unique Inventory Ref, e.g., INV-PRD-089")
    product_id: PydanticObjectId
    vendor_id: PydanticObjectId
    warehouse_location: str = "Bhopal Hub"
    quantity_available: int = Field(..., ge=0)
    quantity_reserved: int = Field(default=0, ge=0)
    low_stock_threshold: int = 10
    last_restocked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "marketplace_inventories"
        indexes = [
            IndexModel([("inventory_id", ASCENDING)], unique=True),
            IndexModel([("product_id", ASCENDING)], unique=True)
        ]


class MarketplaceOrder(Document):
    order_number: str = Field(..., description="Unique Order No., e.g., ORD-2026-0812-0091")
    farmer_id: PydanticObjectId
    order_status: OrderStatus = OrderStatus.PENDING
    subtotal_inr: float = Field(..., ge=0)
    discount_amount_inr: float = Field(default=0.0, ge=0)
    tax_amount_inr: float = Field(default=0.0, ge=0)
    shipping_fee_inr: float = Field(default=0.0, ge=0)
    grand_total_inr: float = Field(..., ge=0)
    coupon_code: Optional[str] = None
    shipping_address: ShippingAddress
    placed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "marketplace_orders"
        indexes = [
            IndexModel([("order_number", ASCENDING)], unique=True),
            IndexModel([("farmer_id", ASCENDING), ("placed_at", DESCENDING)]),
            IndexModel([("order_status", ASCENDING), ("placed_at", DESCENDING)])
        ]


class MarketplaceOrderItem(Document):
    item_id: str = Field(..., description="Unique Item Ref, e.g., ITM-ORD-0091-01")
    order_id: PydanticObjectId
    product_id: PydanticObjectId
    vendor_id: PydanticObjectId
    product_name: str
    sku: str
    quantity: int = Field(..., gt=0)
    unit_price_inr: float = Field(..., ge=0)
    total_price_inr: float = Field(..., ge=0)

    class Settings:
        name = "marketplace_order_items"
        indexes = [
            IndexModel([("item_id", ASCENDING)], unique=True),
            IndexModel([("order_id", ASCENDING)]),
            IndexModel([("product_id", ASCENDING)])
        ]


class MarketplaceCoupon(Document):
    coupon_id: str = Field(..., description="Unique Coupon ID, e.g., CPN-KISAAN-20")
    coupon_code: str = Field(..., description="e.g., KISAAN20")
    discount_type: DiscountType = DiscountType.PERCENTAGE
    discount_value: float = Field(..., gt=0)
    min_order_amount_inr: float = Field(default=0.0, ge=0)
    max_discount_amount_inr: Optional[float] = None
    usage_limit: int = 1000
    used_count: int = 0
    start_date: datetime
    expiry_date: datetime
    is_active: bool = True

    class Settings:
        name = "marketplace_coupons"
        indexes = [
            IndexModel([("coupon_code", ASCENDING)], unique=True),
            IndexModel([("is_active", ASCENDING), ("expiry_date", ASCENDING)])
        ]


class MarketplaceReturn(Document):
    return_id: str = Field(..., description="Unique Return ID, e.g., RET-ORD-0091")
    order_id: PydanticObjectId
    order_item_id: PydanticObjectId
    farmer_id: PydanticObjectId
    reason: str
    return_status: ReturnStatus = ReturnStatus.REQUESTED
    refund_amount_inr: float = Field(..., ge=0)
    proof_images: List[str] = Field(default_factory=list)
    requested_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "marketplace_returns"
        indexes = [
            IndexModel([("return_id", ASCENDING)], unique=True),
            IndexModel([("order_id", ASCENDING)]),
            IndexModel([("farmer_id", ASCENDING)])
        ]


class MarketplaceReview(Document):
    review_id: str = Field(..., description="Unique Review ID, e.g., REV-PRD-089-01")
    product_id: PydanticObjectId
    farmer_id: PydanticObjectId
    rating: int = Field(..., ge=1, le=5)
    title: str
    comment: str
    images: List[str] = Field(default_factory=list)
    is_verified_buyer: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "marketplace_reviews"
        indexes = [
            IndexModel([("review_id", ASCENDING)], unique=True),
            IndexModel([("product_id", ASCENDING), ("created_at", DESCENDING)]),
            IndexModel([("farmer_id", ASCENDING)])
        ]


class MarketplacePayment(Document):
    payment_id: str = Field(..., description="Unique Payment ID, e.g., PAY-ORD-0091")
    order_id: PydanticObjectId
    farmer_id: PydanticObjectId
    payment_method: str = "Razorpay"
    payment_gateway_tx_id: Optional[str] = None
    amount_inr: float = Field(..., gt=0)
    payment_status: PaymentStatus = PaymentStatus.SUCCESS
    paid_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "marketplace_payments"
        indexes = [
            IndexModel([("payment_id", ASCENDING)], unique=True),
            IndexModel([("order_id", ASCENDING)], unique=True),
            IndexModel([("payment_gateway_tx_id", ASCENDING)], unique=True, sparse=True)
        ]


class MarketplaceShipping(Document):
    shipping_id: str = Field(..., description="Unique Shipping ID, e.g., SHP-ORD-0091")
    order_id: PydanticObjectId
    courier_partner: str = "Delhivery"
    tracking_number: Optional[str] = None
    shipping_status: ShippingStatus = ShippingStatus.IN_TRANSIT
    dispatch_date: Optional[datetime] = None
    estimated_delivery_date: Optional[datetime] = None
    actual_delivery_date: Optional[datetime] = None

    class Settings:
        name = "marketplace_shippings"
        indexes = [
            IndexModel([("shipping_id", ASCENDING)], unique=True),
            IndexModel([("order_id", ASCENDING)], unique=True),
            IndexModel([("tracking_number", ASCENDING)], unique=True, sparse=True)
        ]
