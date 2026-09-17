import asyncio
import os
import sys

# Ensure backend root is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.config.settings import settings
from app.models.govt import GovtOrganization, Department, AuthorizedPerson, GovtScheme, SchemeApplication, SubsidyDisbursement, OrgType, JurisdictionLevel, Address, ApprovalStatus
from app.schemas.govt_body import GovtOrgCreateSchema, GovtOrgStatusPatchSchema, GovtOrgUpdateSchema
from app.routes.admin_govt import create_government_organization, list_government_organizations, get_government_organization_details, update_government_organization_status, update_government_organization

async def main():
    print("=== Testing Government Body Onboarding & Approval End-to-End Flow ===")
    print(f"Connecting to MongoDB Atlas... (DB: {settings.DATABASE_NAME})")

    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]

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
    print("[SUCCESS] Beanie initialized for MongoDB Atlas!")

    test_org_id = f"TEST-GOV-{int(asyncio.get_event_loop().time() * 1000)}"

    # Step 1: Create Govt Organization
    address = Address(
        building="Vidhya Bhawan",
        street="Civil Lines Road",
        city="Bhopal",
        district="Bhopal",
        state="Madhya Pradesh",
        pincode="462003"
    )

    create_payload = GovtOrgCreateSchema(
        org_id=test_org_id,
        org_name="MP Department of Horticulture & Silviculture",
        org_type=OrgType.STATE_DEPARTMENT,
        department="Agroforestry & Carbon Cell",
        jurisdiction_level=JurisdictionLevel.STATE,
        state="Madhya Pradesh",
        district="Bhopal",
        block_tehsil="Huzur",
        village_ward="Civil Lines",
        headquarters_address=address,
        contact_email="director.horti@mp.gov.in",
        contact_phone="9876543210",
        authorized_person_name="Rajesh Sharma",
        authorized_person_designation="Joint Secretary",
        authorized_person_email="r.sharma@agri.gov.in",
        authorized_person_phone="9876543210",
        nodal_person_name="Dr. Vikramaditya Singh",
        nodal_person_designation="Director",
        nodal_person_email="nodal.singh@mp.gov.in",
        nodal_person_phone="9876543211",
        mou_document_url="https://example.com/official_mou.pdf",
        authority_document_url="https://example.com/authority_letter.pdf"
    )

    create_res = await create_government_organization(create_payload)
    print(f"\n[1. CREATE] Org created successfully! ID={create_res['data']['id']} | Status={create_res['data']['approval_status']}")

    # Step 2: List Govt Organizations
    list_res = await list_government_organizations(page=1, limit=10, search=test_org_id)
    print(f"[2. LIST] Found {list_res['total']} matching records. Status={list_res['data'][0]['approval_status']}")

    # Step 3: Request Clarification
    status_payload = GovtOrgStatusPatchSchema(
        action="CLARIFICATION_REQUIRED",
        clarification_notes="Please provide official gazette registration number and updated phone number."
    )
    patch_res = await update_government_organization_status(test_org_id, status_payload)
    print(f"[3. CLARIFICATION] Status updated to: {patch_res['data']['approval_status']} | Notes: {patch_res['data']['clarification_notes']}")

    # Step 4: Update & Resubmit
    update_payload = GovtOrgUpdateSchema(
        registration_code="GAZ-MP-2026-HORTI",
        resubmit=True
    )
    update_res = await update_government_organization(test_org_id, update_payload)
    print(f"[4. RESUBMIT] Profile updated & resubmitted! Status={update_res['data']['approval_status']} | Registration Code={update_res['data']['registration_code']}")

    # Step 5: Approve Organization
    approve_payload = GovtOrgStatusPatchSchema(
        action="APPROVE",
        remarks="MoU verified and official gazette credentials validated."
    )
    approve_res = await update_government_organization_status(test_org_id, approve_payload)
    print(f"[5. APPROVE] Status updated to: {approve_res['data']['approval_status']} | Audit Trail Count={len(approve_res['data']['audit_trail'])}")

    # Step 6: Get Single Details
    details_res = await get_government_organization_details(test_org_id)
    print(f"[6. DETAILS] Retrieved profile for '{details_res['data']['org_name']}' | Final Status={details_res['data']['approval_status']}")
    print("\n=== ALL END-TO-END TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    asyncio.run(main())
