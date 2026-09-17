import requests
import sys

BASE_URL = "http://127.0.0.1:8000/v1"

def run_tests():
    print("=== STARTING GOVERNMENT SOIL TESTING WORKFLOW & ANALYTICS TESTS ===")

    # 1. Order Soil Test for Approved Public Asset connected to Scheme
    print("\n1. Testing POST /govt/soil-tests (Order Scheme Soil Test) ...")
    order_payload = {
        "target_type": "public_asset",
        "target_id": "AST-101",
        "target_name": "Narmada Riverbank Green Belt & Miyawaki Park",
        "test_type": "Standard NPK + Soil Organic Carbon (SOC)",
        "sample_count": 10,
        "location_address": "Pipariya, Hoshangabad",
        "district": "Hoshangabad",
        "state": "Madhya Pradesh",
        "preferred_date": "2026-09-20",
        "scheme_program": "PM-Soil Health Card & Organic Fertilizer Subsidy",
        "notes": "Panchayat grant funded soil health audit."
    }
    r = requests.post(f"{BASE_URL}/govt/soil-tests", json=order_payload)
    print("Status:", r.status_code)
    if r.status_code != 201:
        print("FAILED order soil test:", r.text)
        sys.exit(1)
    created_req = r.json().get("data", {})
    test_id = created_req.get("id")
    print(f"Created Soil Test Order ID: {test_id}, Status: {created_req.get('status')}")

    # 2. Assign Lab, Partner & Officer (Transition: Submitted -> Scheduled)
    print(f"\n2. Testing POST /govt/soil-tests/{test_id}/assign ...")
    assign_payload = {
        "assigned_partner": "Gramin Seva Agriculture Partner",
        "assigned_lab": "MP Krishi Vigyan Kendra Soil Testing Lab",
        "assigned_field_officer": "Vikram Rathore (KVK Soil Specialist)",
        "scheduled_date": "2026-09-20"
    }
    r = requests.post(f"{BASE_URL}/govt/soil-tests/{test_id}/assign", json=assign_payload)
    print("Status:", r.status_code)
    if r.status_code != 200:
        print("FAILED assign lab:", r.text)
        sys.exit(1)
    assigned_data = r.json().get("data", {})
    print(f"Assigned Status: {assigned_data.get('status')}, Lab: {assigned_data.get('assigned_lab')}")

    # 3. Field Officer Collect Samples (Transition: Scheduled -> Sample Collected)
    print(f"\n3. Testing POST /govt/soil-tests/{test_id}/collect-sample ...")
    sample_payload = {
        "actual_sample_count": 10,
        "collection_notes": "Collected 10 core samples at 0-15cm and 15-30cm depths across 4 quadrant nodes.",
        "gps_checkin": {"latitude": 22.7543, "longitude": 78.3582}
    }
    r = requests.post(f"{BASE_URL}/govt/soil-tests/{test_id}/collect-sample", json=sample_payload)
    print("Status:", r.status_code)
    if r.status_code != 200:
        print("FAILED collect samples:", r.text)
        sys.exit(1)
    print("Sample Collected Status:", r.json().get("data", {}).get("status"))

    # 4. Lab Results & Soil Health Card Generation (Transition: Sample Collected -> Report Ready)
    print(f"\n4. Testing POST /govt/soil-tests/{test_id}/lab-results ...")
    lab_payload = {
        "nitrogen_kg_ha": 290.0,
        "nitrogen_rating": "Medium (290 kg/ha)",
        "phosphorus_kg_ha": 16.5,
        "phosphorus_rating": "Medium (16.5 kg/ha)",
        "potassium_kg_ha": 320.0,
        "potassium_rating": "High (320 kg/ha)",
        "soc_percent": 0.84,
        "ph_value": 7.2,
        "soil_texture": "Clay Loam with Optimal Organic Sponge",
        "recommendations": "Apply organic bio-fertilizer and vermicompost to maintain healthy carbon sponge.",
        "report_pdf_url": f"/reports/{test_id}_Certified_Health_Card.pdf"
    }
    r = requests.post(f"{BASE_URL}/govt/soil-tests/{test_id}/lab-results", json=lab_payload)
    print("Status:", r.status_code)
    if r.status_code != 200:
        print("FAILED lab results:", r.text)
        sys.exit(1)
    res_data = r.json().get("data", {})
    print(f"Report Ready Status: {res_data.get('status')}")
    print(f"Certified SOC %: {res_data.get('npk_results', {}).get('soc_percent')}%")

    # 5. Test Notifications Dispatch
    print("\n5. Testing GET /govt/notifications (Verify Automated Notifications) ...")
    r = requests.get(f"{BASE_URL}/govt/notifications")
    print("Status:", r.status_code)
    if r.status_code == 200:
        notifs = r.json().get("data", [])
        print(f"Total Government Notifications: {len(notifs)}")
        titles = [str(n.get("title")).encode('ascii', 'ignore').decode('ascii') for n in notifs[:5]]
        print("Recent Notification Titles:", titles)

    # 6. Test Bulk Scheme Approvals
    print("\n6. Testing POST /govt/soil-tests/bulk-approve ...")
    bulk_payload = {
        "request_ids": [test_id],
        "action": "APPROVE",
        "scheme_name": "PM-Soil Health Card & Organic Fertilizer Subsidy"
    }
    r = requests.post(f"{BASE_URL}/govt/soil-tests/bulk-approve", json=bulk_payload)
    print("Status:", r.status_code)
    if r.status_code != 200:
        print("FAILED bulk approve:", r.text)
        sys.exit(1)
    print("Bulk Approval Success:", r.json().get("message"))

    # 7. Test District Soil Health Index Analytics
    print("\n7. Testing GET /govt/soil-tests/analytics/district ...")
    r = requests.get(f"{BASE_URL}/govt/soil-tests/analytics/district?district=Hoshangabad")
    print("Status:", r.status_code)
    if r.status_code != 200:
        print("FAILED district analytics:", r.text)
        sys.exit(1)
    analytics = r.json().get("data", {})
    print(f"District: {analytics.get('district')}")
    print(f"Average SOC %: {analytics.get('average_soc_percent')}%")
    print(f"Average pH: {analytics.get('average_ph_level')}")
    print(f"Health Card Coverage: {analytics.get('health_card_coverage_percent')}%")

    # 8. Test Soil Health Card Campaign Manager
    print("\n8. Testing POST /govt/soil-health-campaigns ...")
    campaign_payload = {
        "title": "Hoshangabad District Soil Health Drive",
        "target_villages": "Rehada, Pipariya, Sehore, Babai",
        "target_cards_count": 500,
        "scheme_program": "PM-Soil Health Card & Organic Fertilizer Subsidy",
        "allocated_budget_inr": 250000.0,
        "start_date": "2026-09-01",
        "end_date": "2026-12-31"
    }
    r = requests.post(f"{BASE_URL}/govt/soil-health-campaigns", json=campaign_payload)
    print("Status:", r.status_code)
    if r.status_code != 201:
        print("FAILED create soil health campaign:", r.text)
        sys.exit(1)
    print("Created Soil Campaign ID:", r.json().get("data", {}).get("id"))

    print("\n[SUCCESS] ALL GOVERNMENT SOIL TESTING WORKFLOW & ANALYTICS TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
