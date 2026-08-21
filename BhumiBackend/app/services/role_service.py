import logging
from typing import Dict, List
from app.models.role import Role, ModulePermissions

logger = logging.getLogger(__name__)

BRD_MODULES = [
    "dashboard",
    "user_management",
    "farmer_management",
    "government_management",
    "partner_management",
    "land_management",
    "document_center",
    "project_management",
    "gis_management",
    "carbon_registry",
    "tree_insurance",
    "marketplace",
    "wallet_payments",
    "mrv_center",
    "drone_survey",
    "satellite_monitoring",
    "ai_land_verification",
    "carbon_exchange",
    "tender_govt_schemes",
    "csr_management",
    "investor_esg",
    "command_center",
    "reports",
    "notification_center",
    "support_center",
    "cms",
    "rbac",
    "audit_logs",
    "system_settings",
]


class RoleService:
    @staticmethod
    async def seed_default_roles() -> None:
        """Idempotent seeding of 11 default BRD system roles with full 15-action matrix."""
        full_access = ModulePermissions(
            view=True, create=True, edit=True, delete=True,
            approve=True, reject=True, assign=True, export=True,
            download=True, print_doc=True, send_notification=True,
            manage_wallet=True, manage_payments=True, access_reports=True, publish=True
        )
        read_only = ModulePermissions(
            view=True, create=False, edit=False, delete=False,
            approve=False, reject=False, assign=False, export=True,
            download=True, print_doc=True, send_notification=False,
            manage_wallet=False, manage_payments=False, access_reports=True, publish=False
        )

        system_roles_def = [
            {
                "name": "Super Admin",
                "code": "super_admin",
                "description": "Complete System Control",
                "permissions": {m: full_access for m in BRD_MODULES},
            },
            {
                "name": "Operations Admin",
                "code": "operations_admin",
                "description": "Daily operations approval for farmers, land, and projects",
                "permissions": {
                    "farmer_management": ModulePermissions(view=True, create=True, edit=True, delete=True, approve=True, reject=True, assign=True, export=True, download=True, send_notification=True),
                    "government_management": ModulePermissions(view=True, approve=True, reject=True, export=True),
                    "partner_management": ModulePermissions(view=True, approve=True, reject=True, export=True),
                    "land_management": ModulePermissions(view=True, approve=True, reject=True, assign=True, export=True),
                    "document_center": ModulePermissions(view=True, approve=True, reject=True, download=True),
                    "project_management": ModulePermissions(view=True, assign=True, export=True),
                    "dashboard": ModulePermissions(view=True, access_reports=True),
                },
            },
            {
                "name": "KYC Admin",
                "code": "kyc_admin",
                "description": "Identity verification (Aadhaar, PAN, Bank, Docs)",
                "permissions": {
                    "document_center": ModulePermissions(view=True, approve=True, reject=True, export=True, download=True),
                    "farmer_management": ModulePermissions(view=True, edit=True, approve=True, reject=True),
                    "user_management": ModulePermissions(view=True),
                    "dashboard": ModulePermissions(view=True),
                },
            },
            {
                "name": "GIS Admin",
                "code": "gis_admin",
                "description": "Land mapping, Polygons, Satellite & Duplicate detection",
                "permissions": {
                    "land_management": ModulePermissions(view=True, edit=True, approve=True, reject=True, assign=True, export=True),
                    "gis_management": ModulePermissions(view=True, create=True, edit=True, approve=True, export=True),
                    "satellite_monitoring": ModulePermissions(view=True, create=True, edit=True, export=True),
                    "drone_survey": ModulePermissions(view=True, create=True, export=True),
                    "ai_land_verification": ModulePermissions(view=True, approve=True, reject=True),
                    "command_center": ModulePermissions(view=True),
                },
            },
            {
                "name": "Project Admin",
                "code": "project_admin",
                "description": "Carbon projects, Farmer & Land assignments, MRV tracking",
                "permissions": {
                    "project_management": ModulePermissions(view=True, create=True, edit=True, assign=True, export=True, download=True),
                    "carbon_registry": ModulePermissions(view=True, create=True, edit=True, export=True),
                    "mrv_center": ModulePermissions(view=True, create=True, edit=True, assign=True, export=True),
                    "farmer_management": ModulePermissions(view=True, assign=True),
                    "land_management": ModulePermissions(view=True, assign=True),
                },
            },
            {
                "name": "Insurance Admin",
                "code": "insurance_admin",
                "description": "Tree insurance policies, claims, and surveyor assignment",
                "permissions": {
                    "tree_insurance": ModulePermissions(view=True, create=True, edit=True, approve=True, reject=True, assign=True, export=True, access_reports=True),
                    "reports": ModulePermissions(view=True, export=True, access_reports=True),
                },
            },
            {
                "name": "Marketplace Admin",
                "code": "marketplace_admin",
                "description": "Products, Vendors, Orders, Inventory & Shipping",
                "permissions": {
                    "marketplace": ModulePermissions(view=True, create=True, edit=True, delete=True, approve=True, reject=True, export=True, publish=True),
                    "partner_management": ModulePermissions(view=True, approve=True, reject=True),
                },
            },
            {
                "name": "Finance Admin",
                "code": "finance_admin",
                "description": "Wallets, Payments, Withdrawals, Invoices, Settlements",
                "permissions": {
                    "wallet_payments": ModulePermissions(view=True, edit=True, approve=True, reject=True, export=True, manage_wallet=True, manage_payments=True),
                    "reports": ModulePermissions(view=True, export=True, access_reports=True),
                    "investor_esg": ModulePermissions(view=True, export=True, access_reports=True),
                },
            },
            {
                "name": "Support Admin",
                "code": "support_admin",
                "description": "Tickets, Chat, Complaints, and Escalations",
                "permissions": {
                    "support_center": ModulePermissions(view=True, create=True, edit=True, assign=True, export=True),
                    "notification_center": ModulePermissions(view=True, create=True, send_notification=True),
                },
            },
            {
                "name": "Content Admin",
                "code": "content_admin",
                "description": "App banners, blogs, CMS, FAQs, Terms & Privacy",
                "permissions": {
                    "cms": ModulePermissions(view=True, create=True, edit=True, delete=True, publish=True),
                    "notification_center": ModulePermissions(view=True, create=True, send_notification=True, publish=True),
                },
            },
            {
                "name": "Auditor",
                "code": "auditor",
                "description": "Read-only access for compliance and audit logs",
                "permissions": {m: read_only for m in BRD_MODULES},
            },
        ]

        for role_data in system_roles_def:
            existing = await Role.find_one(Role.code == role_data["code"])
            if not existing:
                role = Role(
                    name=role_data["name"],
                    code=role_data["code"],
                    description=role_data["description"],
                    is_system_role=True,
                    is_active=True,
                    permissions=role_data["permissions"],
                )
                await role.insert()
                logger.info("Seeded default system role: %s", role_data["code"])
            else:
                # Update existing system roles with full 15-action matrix
                existing.permissions = role_data["permissions"]
                await existing.save()
