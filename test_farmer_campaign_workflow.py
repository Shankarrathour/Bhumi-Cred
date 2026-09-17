import requests
import sys

BASE_URL = "http://127.0.0.1:8000/v1"

def run_tests():
    print("=== STARTING GOVERNMENT FARMER MANAGEMENT & CAMPAIGN WORKFLOW TESTS ===")

    # 1. Test Jurisdiction Farmers Listing
    print("\n1. Testing GET /govt/farmers (Default Directory) ...")
    r = requests.get(f"{BASE_URL}/govt/farmers")
    print("Status:", r.status_code)
    if r.status_code != 200:
        print("FAILED list farmers:", r.text)
        sys.exit(1)
    farmers = r.json().get("data", [])
    print(f"Retrieved {len(farmers)} jurisdiction farmers.")
    assert len(farmers) > 0, "Farmer directory should return records"

    first_farmer = farmers[0]
    farmer_id = first_farmer.get("id")
    print(f"Sample Farmer: {first_farmer.get('name')} (ID: {farmer_id})")

    # Verify PII Data Masking
    contact_masked = first_farmer.get("contact_masked", "")
    aadhaar_masked = first_farmer.get("aadhaar_masked", "")
    bank_masked = first_farmer.get("bank_masked", "")
    print(f"Masked Phone: {contact_masked}")
    print(f"Masked Aadhaar: {aadhaar_masked}")
    print(f"Masked Bank: {bank_masked}")
    assert "•" in contact_masked or "X" in contact_masked or "Masked" in contact_masked, "Contact must be masked"
    assert "X" in aadhaar_masked, "Aadhaar must be masked"
    assert "Masked" in bank_masked or "•" in bank_masked or "X" in bank_masked, "Bank details must be masked"

    # 2. Test Multi-criteria Filtering
    print("\n2. Testing GET /govt/farmers with Multi-criteria Filters ...")
    r = requests.get(f"{BASE_URL}/govt/farmers?land_size=5-10&project_status=Enrolled&soil_status=Verified")
    print("Filter Status:", r.status_code)
    if r.status_code == 200:
        filtered = r.json().get("data", [])
        print(f"Filtered Farmers Count: {len(filtered)}")

    # 3. Test Farmer Details API
    print(f"\n3. Testing GET /govt/farmers/{farmer_id} (Full Profile) ...")
    r = requests.get(f"{BASE_URL}/govt/farmers/{farmer_id}")
    print("Status:", r.status_code)
    if r.status_code != 200:
        print("FAILED farmer details:", r.text)
        sys.exit(1)
    details = r.json().get("data", {})
    print(f"Parcels Count: {len(details.get('land_parcels', []))}")
    print(f"Projects Count: {len(details.get('projects', []))}")
    print(f"Soil Reports Count: {len(details.get('soil_reports', []))}")
    print(f"Insurance Policies Count: {len(details.get('insurance_policies', []))}")

    # 4. Test Campaigns Listing & Dashboard Progress
    print("\n4. Testing GET /govt/campaigns (Campaign Dashboard) ...")
    r = requests.get(f"{BASE_URL}/govt/campaigns")
    print("Status:", r.status_code)
    if r.status_code != 200:
        print("FAILED list campaigns:", r.text)
        sys.exit(1)
    campaigns = r.json().get("data", [])
    print(f"Retrieved {len(campaigns)} onboarding campaigns.")

    # 5. Propose New Campaign (Draft)
    print("\n5. Testing POST /govt/campaigns (Propose New Drive) ...")
    campaign_payload = {
        "title": "Hoshangabad Miyawaki Agroforestry Outreach Drive",
        "category": "Farmer Onboarding",
        "target_area": "Hoshangabad Riparian Zone",
        "target_villages": "Sehore, Pipariya, Babai",
        "target_farmers": 200,
        "objective": "Aggregating 200 farmers for indigenous Miyawaki afforestation.",
        "start_date": "2026-09-15",
        "end_date": "2026-11-15",
        "notes": "Panchayat grant sanctioned drive.",
        "document_name": "Gram_Sabha_Outreach_Sanction.pdf",
        "is_draft": True
    }
    r = requests.post(f"{BASE_URL}/govt/campaigns", json=campaign_payload)
    print("Status:", r.status_code)
    if r.status_code != 201:
        print("FAILED create campaign:", r.text)
        sys.exit(1)
    created_campaign = r.json().get("data", {})
    campaign_id = created_campaign.get("id")
    print(f"Created Campaign ID: {campaign_id}, Status: {created_campaign.get('status')}")

    # 6. Resubmit Campaign
    print(f"\n6. Testing PUT /govt/campaigns/{campaign_id} (Resubmit Proposal) ...")
    update_payload = {
        "title": "Hoshangabad Miyawaki Agroforestry Outreach Drive (Updated)",
        "target_farmers": 250,
        "is_draft": False
    }
    r = requests.put(f"{BASE_URL}/govt/campaigns/{campaign_id}", json=update_payload)
    print("Status:", r.status_code)
    if r.status_code != 200:
        print("FAILED update campaign:", r.text)
        sys.exit(1)
    print("Updated Campaign Status:", r.json().get("data", {}).get("status"))

    # 7. Admin Status Transition
    print(f"\n7. Testing PATCH /govt/campaigns/{campaign_id}/status -> Approved ...")
    status_payload = {"status": "Approved", "remarks": "Approved by Central Operations under Panchayat Outreach Scheme."}
    r = requests.patch(f"{BASE_URL}/govt/campaigns/{campaign_id}/status", json=status_payload)
    print("Status:", r.status_code)

    # 8. Assign Field Partner
    print(f"\n8. Testing POST /govt/campaigns/{campaign_id}/assign-partner ...")
    partner_payload = {
        "assigned_partner": "Gramin Seva NGO Foundation",
        "assigned_field_officer": "Vikram Rathore (Outreach Lead)",
        "notes": "Assigned 10 field workers for door-to-door OTP onboarding."
    }
    r = requests.post(f"{BASE_URL}/govt/campaigns/{campaign_id}/assign-partner", json=partner_payload)
    print("Status:", r.status_code)
    print("Assign Partner Message:", r.json().get("message"))

    # 9. Dispatch Farmer Invitations
    print(f"\n9. Testing POST /govt/campaigns/{campaign_id}/invite ...")
    r = requests.post(f"{BASE_URL}/govt/campaigns/{campaign_id}/invite")
    print("Status:", r.status_code)
    if r.status_code != 200:
        print("FAILED invite farmers:", r.text)
        sys.exit(1)
    updated_progress = r.json().get("data", {}).get("progress", {})
    print("Updated Campaign Progress Metrics:", updated_progress)
    assert updated_progress.get("farmers_invited") > 0, "Farmers invited count should increase"

    print("\n[SUCCESS] ALL GOVERNMENT FARMER MANAGEMENT & CAMPAIGN TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
