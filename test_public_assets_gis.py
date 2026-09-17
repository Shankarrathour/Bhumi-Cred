import requests
import sys

BASE_URL = "http://127.0.0.1:8000/v1"

def run_tests():
    print("=== STARTING PUBLIC ASSETS & GIS API VERIFICATION TESTS ===")

    # 1. List Public Assets
    print("\n1. Testing GET /govt/assets ...")
    r = requests.get(f"{BASE_URL}/govt/assets")
    print("Status:", r.status_code)
    if r.status_code != 200:
        print("FAILED list assets:", r.text)
        sys.exit(1)
    assets = r.json().get("data", [])
    print(f"Retrieved {len(assets)} public assets.")

    # 2. Add New Public Asset (Draft)
    print("\n2. Testing POST /govt/assets (Create Draft Asset) ...")
    draft_payload = {
        "name": "Test Miyawaki Demonstration Forest",
        "category": "Park",
        "authority": "Gram Panchayat Sehore",
        "area_acres": 6.8,
        "street_address": "Test Forest Road",
        "village_ward": "Sehore West",
        "district": "Hoshangabad",
        "state": "Madhya Pradesh",
        "pincode": "466001",
        "khasra_number": "99/4",
        "mature_trees_count": 1200,
        "saplings_count": 500,
        "condition": "Excellent",
        "description": "Test afforestation biodiversity plot.",
        "gps_coords": {"latitude": 23.2045, "longitude": 77.0891},
        "polygon": [
            {"lat": 23.2050, "lng": 77.0880},
            {"lat": 23.2050, "lng": 77.0900},
            {"lat": 23.2030, "lng": 77.0900},
            {"lat": 23.2030, "lng": 77.0880}
        ],
        "is_draft": True
    }
    r = requests.post(f"{BASE_URL}/govt/assets", json=draft_payload)
    print("Status:", r.status_code)
    if r.status_code != 201:
        print("FAILED create draft asset:", r.text)
        sys.exit(1)
    created_draft = r.json().get("data")
    asset_id = created_draft.get("id")
    print(f"Created Draft Asset ID: {asset_id}, Status: {created_draft.get('status')}")

    # 3. Get Details & Verify Eligibility Locks on Draft
    print(f"\n3. Testing GET /govt/assets/{asset_id} (Check Locks) ...")
    r = requests.get(f"{BASE_URL}/govt/assets/{asset_id}")
    print("Status:", r.status_code)
    details = r.json().get("data", {})
    print(f"Asset Status: {details.get('status')}")
    print(f"Insurance Eligible: {details.get('is_eligible_for_insurance')}")
    print(f"Carbon Eligible: {details.get('is_eligible_for_carbon')}")
    assert details.get('is_eligible_for_insurance') is False, "Draft asset should be locked for insurance"

    # 4. Update Status to Approved
    print(f"\n4. Testing PATCH /govt/assets/{asset_id}/status -> Approved ...")
    patch_payload = {"status": "Approved", "remarks": "Sentinel-2 satellite MRV boundary audit complete."}
    r = requests.patch(f"{BASE_URL}/govt/assets/{asset_id}/status", json=patch_payload)
    print("Status:", r.status_code)
    if r.status_code != 200:
        print("FAILED status update:", r.text)
        sys.exit(1)
    print("Status updated successfully.")

    # 5. Verify Locks Unlocked after Approval
    r = requests.get(f"{BASE_URL}/govt/assets/{asset_id}")
    details = r.json().get("data", {})
    print(f"Updated Asset Status: {details.get('status')}")
    print(f"Insurance Eligible: {details.get('is_eligible_for_insurance')}")
    print(f"Carbon Eligible: {details.get('is_eligible_for_carbon')}")
    assert details.get('is_eligible_for_insurance') is True, "Approved asset should be eligible for insurance"

    # 6. Test Land Allocation to Farmer
    print(f"\n6. Testing POST /govt/assets/{asset_id}/allocate-farmer ...")
    alloc_payload = {
        "farmer_id": "FAR-101",
        "farmer_name": "Ramkumar Sharma",
        "allocated_acres": 2.5,
        "purpose": "Agroforestry & Community Stewardship",
        "allocation_term_years": 3
    }
    r = requests.post(f"{BASE_URL}/govt/assets/{asset_id}/allocate-farmer", json=alloc_payload)
    print("Status:", r.status_code)
    if r.status_code != 201:
        print("FAILED land allocation:", r.text)
        sys.exit(1)
    print("Land Allocation Success:", r.json().get("message"))

    # 7. Test Encroachment Alert Logging
    print(f"\n7. Testing POST /govt/assets/{asset_id}/encroachment-alert ...")
    alert_payload = {
        "alert_type": "Unauthorized Tree Clearing / Fence Breach",
        "severity": "critical",
        "description": "Satellite Sentinel anomaly detected unauthorized perimeter clearing near sector 4."
    }
    r = requests.post(f"{BASE_URL}/govt/assets/{asset_id}/encroachment-alert", json=alert_payload)
    print("Status:", r.status_code)
    if r.status_code != 201:
        print("FAILED encroachment alert:", r.text)
        sys.exit(1)
    print("Encroachment Alert Success:", r.json().get("message"))

    print("\n[SUCCESS] ALL PUBLIC ASSETS & GIS TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
