import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/v1/govt"

def test_campaign_workflow():
    print("=== STARTING FARMER CAMPAIGN MODULE WORKFLOW TEST ===")

    # 1. Fetch initial campaigns list
    res = requests.get(f"{BASE_URL}/campaigns", params={"jurisdiction_code": "MP-HOS-PIP-01"})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["success"] is True
    print(f"[OK] Fetched {len(data['data'])} existing campaigns with jurisdiction scoping.")

    # 2. Create new On-Demand Campaign (Soil Testing / Onboarding)
    new_campaign_payload = {
        "title": "Hoshangabad Smart Agroforestry & Soil Health Drive",
        "category": "Soil Testing",
        "objective": "Conduct 300 spectrometer soil NPK baseline audits and distribute 10,000 teak saplings.",
        "target_area": "Narmada Basin Agro Corridor",
        "target_villages": "Rehada, Pipariya, Babai, Bankhedi",
        "target_farmers": 300,
        "start_date": "2026-09-15",
        "end_date": "2026-12-31",
        "expected_outputs": "300 Soil Cards, 10,000 Teak Saplings Planted",
        "allocated_budget_inr": 750000.0,
        "tree_planting_target": 10000,
        "jurisdiction_code": "MP-HOS-PIP-01",
        "state": "Madhya Pradesh",
        "district": "Hoshangabad",
        "is_draft": False
    }
    res = requests.post(f"{BASE_URL}/campaigns", json=new_campaign_payload)
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    create_res = res.json()
    assert create_res["success"] is True
    cmp_id = create_res["data"]["id"]
    print(f"[OK] Created Campaign: {cmp_id} - {create_res['data']['title']} (Status: {create_res['data']['status']})")

    # 3. Update Campaign Status to Admin Approval
    status_payload = {
        "status": "Admin Approval",
        "remarks": "Approved under State Subsidized Agroforestry Outreach Scheme."
    }
    res = requests.post(f"{BASE_URL}/campaigns/{cmp_id}/status", json=status_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    status_res = res.json()
    assert status_res["data"]["status"] == "Admin Approval"
    print(f"[OK] Transitioned status to Admin Approval.")

    # 4. Assign Partner & Nodal Field Officer
    assign_payload = {
        "assigned_partner": "MP Krishi Vigyan Kendra (KVK)",
        "assigned_field_officer": "Dr. S. K. Verma (Lead Agronomist)",
        "notes": "Mobilized KVK field team and spectrometer kit."
    }
    res = requests.post(f"{BASE_URL}/campaigns/{cmp_id}/assign-partner", json=assign_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    assign_res = res.json()
    assert assign_res["data"]["assigned_partner"] == "MP Krishi Vigyan Kendra (KVK)"
    assert assign_res["data"]["status"] == "Resources Assigned"
    print(f"[OK] Assigned Partner & Field Lead (Status: {assign_res['data']['status']}).")

    # 5. Release Budget Tranche #1
    budget_payload = {
        "amount_inr": 375000.0,
        "tranche_number": 1,
        "milestone_verified": "Spectrometer Equipment Mobilization & Initial Village Baseline",
        "notes": "50% initial disbursement for sampling tools and sapling procurement."
    }
    res = requests.post(f"{BASE_URL}/campaigns/{cmp_id}/release-budget", json=budget_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    budget_res = res.json()
    assert budget_res["data"]["released_budget_inr"] == 375000.0
    assert len(budget_res["data"]["budget_tranches"]) == 1
    print(f"[OK] Disbursed Budget Tranche 1: INR {budget_res['data']['released_budget_inr']:,.0f}.")

    # 6. Update Tree Tracker Progress
    tree_payload = {
        "trees_planted_add": 4200,
        "species_list": ["Teak / Sagwan", "Mahua", "Neem"],
        "gps_location": {"latitude": 22.7512, "longitude": 78.3610},
        "evidence_photos": ["https://bhumicred.in/photos/tree_check_1.jpg"]
    }
    res = requests.post(f"{BASE_URL}/campaigns/{cmp_id}/tree-tracker", json=tree_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    tree_res = res.json()
    assert tree_res["data"]["tree_planting_achieved"] == 4200
    print(f"[OK] Logged Tree Planting Progress: 4,200 saplings verified.")

    # 7. Generate Final Certified Campaign Report
    res = requests.post(f"{BASE_URL}/campaigns/{cmp_id}/generate-report")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    report_res = res.json()
    assert report_res["data"]["status"] == "Completed"
    assert "https://bhumicred.in/reports/" in report_res["final_report_url"]
    print(f"[OK] Generated Final Certified Campaign Report: {report_res['final_report_url']}")

    # 8. Fetch Detail and Verify Audit Trail
    res = requests.get(f"{BASE_URL}/campaigns/{cmp_id}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    detail_res = res.json()
    assert detail_res["data"]["id"] == cmp_id
    assert len(detail_res["data"]["audit_timeline"]) >= 5
    print(f"[OK] Verified Audit Timeline: {len(detail_res['data']['audit_timeline'])} entries logged.")

    print("\n=== ALL TESTS FOR FARMER CAMPAIGN MODULE PASSED PERFECTLY ===")

if __name__ == "__main__":
    test_campaign_workflow()
