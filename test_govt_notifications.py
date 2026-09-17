import requests
import json
import os
import time

BASE_URL = "http://127.0.0.1:8000/v1/govt"

def run_test():
    print("==========================================================")
    print("  TESTING GOVERNMENT NOTIFICATIONS & DEEP-LINK WORKFLOW   ")
    print("==========================================================")

    # 1. Fetch All Notifications & Verify Seeded Triggers
    print("\n1. Testing GET /v1/govt/notifications...")
    res = requests.get(f"{BASE_URL}/notifications")
    assert res.status_code == 200, f"Failed fetch notifications: {res.text}"
    resp_data = res.json()
    assert resp_data.get("success") == True, "Failed success flag"
    notifs = resp_data.get("data", [])
    print(f"   [OK] Total Notifications: {len(notifs)} (Unread Count: {resp_data.get('unread_count')})")

    # 2. Test All 13 Mandatory Notification Triggers
    print("\n2. Testing All 13 Mandatory Notification Triggers...")
    triggers = [
        ("account_status", "GovtAccount"),
        ("campaign_status", "GovtCampaigns"),
        ("project_assignment", "GovtProjects"),
        ("project_milestone", "GovtProjects"),
        ("soil_schedule", "GovtSoilTesting"),
        ("soil_report_ready", "GovtReportDetailView"),
        ("insurance_policy", "GovtInsurance"),
        ("insurance_claim", "GovtInsurance"),
        ("document_expiry", "GovtDocuments"),
        ("payment_settlement", "GovtTreasury"),
        ("carbon_status", "GovtCarbonCreditWorkflowView"),
        ("campaign_update", "GovtCampaigns"),
        ("dbt_status", "GovtTreasury"),
    ]

    for trigger_key, expected_screen in triggers:
        res = requests.post(f"{BASE_URL}/notifications/trigger-test/{trigger_key}")
        assert res.status_code == 200, f"Failed trigger test for {trigger_key}: {res.text}"
        trig_res = res.json()
        assert trig_res.get("success") == True, f"Failed trigger {trigger_key}"
        item = trig_res.get("data", {})
        
        # Verify structure
        assert item.get("notification_type") == trigger_key, f"Incorrect notification_type for {trigger_key}"
        assert item.get("target_screen") == expected_screen, f"Target screen mismatch for {trigger_key}: got {item.get('target_screen')}, expected {expected_screen}"
        assert item.get("deep_link", "").startswith("bhumicred://govt"), f"Invalid deep link for {trigger_key}: {item.get('deep_link')}"
        assert item.get("priority") in ["HIGH", "MEDIUM", "LOW"], f"Invalid priority: {item.get('priority')}"
        assert "navigation_params" in item, "Missing navigation_params dict"

        print(f"   [OK] Trigger '{trigger_key}': Screen -> {item.get('target_screen')} | DeepLink -> {item.get('deep_link')}")

    # 3. Test Mark as Read Endpoint
    print("\n3. Testing PUT /v1/govt/notifications/{id}/read...")
    first_id = notifs[0]["id"]
    res = requests.put(f"{BASE_URL}/notifications/{first_id}/read")
    assert res.status_code == 200, f"Failed mark read: {res.text}"
    print(f"   [OK] Notification {first_id} marked as read successfully.")

    # 4. Test Mark All as Read Endpoint
    print("\n4. Testing PUT /v1/govt/notifications/read-all...")
    res = requests.put(f"{BASE_URL}/notifications/read-all")
    assert res.status_code == 200, f"Failed mark all read: {res.text}"
    read_all_resp = res.json()
    assert read_all_resp.get("unread_count") == 0, "Unread count should be 0 after read-all"
    print("   [OK] All notifications marked as read.")

    # 5. Test Filtering by Category and Priority
    print("\n5. Testing Category and Priority Filtering...")
    res = requests.get(f"{BASE_URL}/notifications?category=soil_testing")
    assert res.status_code == 200, f"Failed category filter: {res.text}"
    filtered = res.json().get("data", [])
    print(f"   [OK] Category 'soil_testing' filter returned {len(filtered)} items.")

    res = requests.get(f"{BASE_URL}/notifications?priority=HIGH")
    assert res.status_code == 200, f"Failed priority filter: {res.text}"
    high_p = res.json().get("data", [])
    print(f"   [OK] Priority 'HIGH' filter returned {len(high_p)} items.")

    print("\n==========================================================")
    print("  ALL GOVERNMENT NOTIFICATION TESTS PASSED 100%!           ")
    print("==========================================================")

if __name__ == "__main__":
    run_test()
