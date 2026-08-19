from fastapi import APIRouter
from app.routes.auth import router as auth_router
from app.routes.admin_auth import router as admin_auth_router
from app.routes.farmer_profile import router as farmer_profile_router
from app.routes.admin_farmers import router as admin_farmers_router
from app.routes.projects import router as projects_router
from app.routes.admin_projects import router as admin_projects_router
from app.routes.admin_sales import router as admin_sales_router
from app.routes.wallet import router as wallet_router
from app.routes.admin_wallet import router as admin_wallet_router
from app.homescreen.routes import router as homescreen_router
from app.routes.registration import router as registration_router
from app.routes.admin_lands import router as admin_lands_router
from app.routes.farmer_green_family import router as farmer_green_family_router
from app.routes.admin_green_family import router as admin_green_family_router

from app.routes.marketplace import router as marketplace_router
from app.routes.tree_registration import router as tree_registration_router
from app.routes.admin_tree_registrations import router as admin_tree_registrations_router
from app.routes.notifications import router as notifications_router
from app.routes.admin_notifications import router as admin_notifications_router
from app.routes.admin_activity_logs import router as admin_activity_logs_router
from app.routes.admin_roles import router as admin_roles_router
from app.routes.locations import router as locations_router

api_router = APIRouter()

# ── Phase 1: Authentication & Roles (RBAC) ───────────────────────────────────
api_router.include_router(auth_router)
api_router.include_router(admin_auth_router)
api_router.include_router(admin_roles_router)

# ── Phase 2: Farmer Profile & Onboarding ─────────────────────────────────────
api_router.include_router(farmer_profile_router)

# ── Phase 3.1: Admin Farmer Management ───────────────────────────────────────
api_router.include_router(admin_farmers_router)
api_router.include_router(admin_projects_router)
api_router.include_router(projects_router)
api_router.include_router(admin_sales_router)
api_router.include_router(wallet_router)
api_router.include_router(admin_lands_router)

# ── Phase 3.2: Wallet & Withdrawals ──────────────────────────────────────────
api_router.include_router(admin_wallet_router)
# ── Phase 4: Homescreen & Ecological Dashboard ───────────────────────────────
api_router.include_router(locations_router)
api_router.include_router(homescreen_router)

# ── BhumiCred Registry Multi-step Registration ───────────────────────────────
api_router.include_router(registration_router)

# ── Phase 5: Green Family Cover ──────────────────────────────────────────────
api_router.include_router(farmer_green_family_router)
api_router.include_router(admin_green_family_router)

# ── Phase 6: Vendor Marketplace ───────────────────────────────────────
from app.routes.admin_orders import router as admin_orders_router

api_router.include_router(admin_orders_router)

# ── Phase 6: General ─────────────────────────────────────────────────────────
api_router.include_router(marketplace_router)

# ── Phase 4: Categories ───────────────────────────────────────────────────────
from app.routes.category import router as category_router
api_router.include_router(category_router)

# ── Phase 5: Products ─────────────────────────────────────────────────────────
from app.routes.product import router as product_router
api_router.include_router(product_router)

# ── Phase 6: Recommendations ──────────────────────────────────────────────────
from app.routes.recommendation import router as recommendation_router
api_router.include_router(recommendation_router)

# ── Phase 7: Wishlist ─────────────────────────────────────────────────────────
from app.routes.wishlist import router as wishlist_router
api_router.include_router(wishlist_router)

# ── Phase 8: Cart ─────────────────────────────────────────────────────────────
from app.routes.cart import router as cart_router
api_router.include_router(cart_router)

# ── Phase 9: Checkout ─────────────────────────────────────────────────────────
from app.routes.checkout import router as checkout_router
api_router.include_router(checkout_router)

# ── Phase 10: Orders ──────────────────────────────────────────────────────────
from app.routes.order import router as order_router
api_router.include_router(order_router)



# ── Phase 14: Admin Product Approval ──────────────────────────────────────────
from app.routes.admin_product import router as admin_product_router
api_router.include_router(admin_product_router)

# ── Phase 15: Admin Dashboard ─────────────────────────────────────────────────
from app.routes.admin_dashboard import router as admin_dashboard_router
api_router.include_router(admin_dashboard_router)


# -- Phase 17: Agri Financial Hub -----------------------------------------------
from app.routes.agri import router as agri_router
api_router.include_router(agri_router)

# -- Phase 18: Admin Agri Financial Hub -----------------------------------------
from app.routes.admin_agri import router as admin_agri_router
api_router.include_router(admin_agri_router)

# ── Phase 4: Tree Insurance ──────────────────────────────────────────────────
api_router.include_router(tree_registration_router)
api_router.include_router(admin_tree_registrations_router)
from app.routes.admin_tree_plans import router as admin_tree_plans_router
from app.routes.mobile_tree_plans import router as mobile_tree_plans_router
api_router.include_router(admin_tree_plans_router)
api_router.include_router(mobile_tree_plans_router)

from app.routes.admin_climate_risk_insurance import router as admin_climate_risk_insurance_router
from app.routes.climate_risk_insurance import router as climate_risk_insurance_router
api_router.include_router(admin_climate_risk_insurance_router)
api_router.include_router(climate_risk_insurance_router)

# Phase 5: Notifications
api_router.include_router(notifications_router)
api_router.include_router(admin_notifications_router)

# ── Admin Activity Logs ───────────────────────────────────────────────────────
api_router.include_router(admin_activity_logs_router)


# ── CMS User Dashboard ────────────────────────────────────────────────────────
from app.routes.cms_user_dashboard import router as cms_user_dashboard_router
api_router.include_router(cms_user_dashboard_router)
from app.routes.banners import mobile_router as banners_mobile_router
from app.routes.banners import admin_router as banners_admin_router
from app.routes.uploads import router as uploads_router

api_router.include_router(banners_mobile_router)
api_router.include_router(banners_admin_router)
api_router.include_router(uploads_router)

# ── Module 19: Admin System Settings ─────────────────────────────────────────
from app.routes.admin_settings import router as admin_settings_router
api_router.include_router(admin_settings_router)

# ── Module 20: Support Tickets (Farmer/Vendor) ────────────────────────────────
from app.routes.vendor_support import router as vendor_support_router
api_router.include_router(vendor_support_router)

# ── Module 21: Soil Testing & Reports ─────────────────────────────────────────
from app.routes.soil_testing import router as soil_testing_router
api_router.include_router(soil_testing_router)

# ── Module 22: Admin MRV Operations Center ───────────────────────────────────
from app.routes.admin_mrv import router as admin_mrv_router
api_router.include_router(admin_mrv_router)

# ── Module 23: Referrals & Rewards ───────────────────────────────────────────
from app.routes.referrals import router as referrals_router
api_router.include_router(referrals_router)

# ── Module 24: Farmer Eco Badges & Cabinet ────────────────────────────────────
from app.routes.farmer_badges import router as farmer_badges_router
api_router.include_router(farmer_badges_router)
