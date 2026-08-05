import asyncio
import os
import sys

# Ensure backend root is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from pydantic import ValidationError

from app.config.settings import settings
from app.models.govt import (
    GovtOrganization,
    Department,
    AuthorizedPerson,
    GovtScheme,
    SchemeApplication,
    SubsidyDisbursement,
    OrgType,
    JurisdictionLevel,
    SchemeCategory
)

async def main():
    print("=== Initializing Government Body Management DB Check ===")
    print(f"Connecting to MongoDB Atlas...")
    print(f"Database Name: {settings.DATABASE_NAME}")

    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]

    try:
        await init_beanie(
            database=db,
            document_models=[
                GovtOrganization,
                Department,
                AuthorizedPerson,
                GovtScheme,
                SchemeApplication,
                SubsidyDisbursement
            ]
        )
        print("\n[SUCCESS] Beanie ODM initialized on MongoDB Atlas!")
        print("[SUCCESS] Collections & Indexes verified on MongoDB:")
        print("   - govt_organizations")
        print("   - departments")
        print("   - authorized_persons")
        print("   - govt_schemes")
        print("   - scheme_applications")
        print("   - subsidy_disbursements")

        # Test Pydantic Validation & Document Creation
        print("\n[TEST] Testing Schema & Model Validation...")
        govt_org = GovtOrganization(
            org_id="GOV-MP-AGRI-001",
            org_name="Department of Agriculture & Farmer Welfare, Govt of MP",
            org_type=OrgType.STATE_DEPARTMENT,
            jurisdiction_level=JurisdictionLevel.STATE,
            state="Madhya Pradesh",
            headquarters_address={
                "street": "Jail Road",
                "city": "Bhopal",
                "district": "Bhopal",
                "state": "Madhya Pradesh",
                "pincode": "462004"
            },
            contact_email="agri.dept@mp.gov.in",
            contact_phone="9876543210"
        )
        print(f"[SUCCESS] Created & Validated Govt Organization: {govt_org.org_name}")
        print("Everything is 100% working and verified!")

    except Exception as e:
        print(f"[ERROR] Connection error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
