import requests
import json
import sys

BASE_URL = "http://localhost:8000/v1/govt"

def test_project_installation_workflow():
    print("==================================================")
    print("STARTING AUTOMATED PROJECT & INSTALLATION WORKFLOW TEST")
    print("==================================================")

    # Step 1: Create Project Request
    print("\n[Step 1] POST /v1/govt/projects (Create Project Request) ...")
    create_payload = {
        "title": "Satpura Wetland Agroforestry & Solar Bio-Shield",
        "project_type": "Afforestation / Miyawaki Plantation",
        "target_type": "public_asset",
        "target_id": "ASSET-9901",
        "target_name": "Gram Panchayat Satpura Biodiversity Corridor",
        "objective": "Establish 15-acre dense bio-shield and carbon sequestration zone along Narmada bank.",
        "scope_description": "Land tilling, 12,000 tree saplings, solar canopy installation, drip irrigation, and 3-year survival audit.",
        "area_acres": 15.0,
        "participants_count": 120,
        "preferred_date": "2026-10-15",
        "estimated_budget_inr": 2200000.0,
        "co_funding_type": "Govt 75% State Fund + 25% Panchayat Share",
        "documents": [
            {"title": "Panchayat Gram Sabha Resolution NOC", "url": "https://bhumicred.in/docs/noc_satpura.pdf"}
        ],
        "jurisdiction_code": "MP-HOS-PIP-01",
        "state": "Madhya Pradesh",
        "district": "Hoshangabad",
        "status": "submitted"
    }

    res = requests.post(f"{BASE_URL}/projects", json=create_payload)
    assert res.status_code in (200, 201), f"Expected 200/201, got {res.status_code}: {res.text}"
    data = res.json()
    assert data.get("success") is True, f"Response success false: {data}"
    new_proj = data["data"]
    proj_id = new_proj["id"]
    print(f"[OK] Created Project Request ID: {proj_id}")
    print(f"  - Title: {new_proj.get('title')}")
    print(f"  - Jurisdiction: {new_proj.get('jurisdiction_code')} | Area: {new_proj.get('area_acres')} Acres")
    print(f"  - Initial Status: {new_proj.get('status')} | Milestones Count: {len(new_proj.get('milestones', []))}")

    # Step 2: GET Projects with Jurisdiction Filtering
    print(f"\n[Step 2] GET /v1/govt/projects?jurisdiction_code=MP-HOS-PIP-01 ...")
    res = requests.get(f"{BASE_URL}/projects", params={"jurisdiction_code": "MP-HOS-PIP-01"})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    proj_list = res.json().get("data", [])
    print(f"[OK] Retrieved {len(proj_list)} authorized projects for jurisdiction MP-HOS-PIP-01.")
    found = any(p["id"] == proj_id for p in proj_list)
    assert found, f"Project {proj_id} not found in jurisdiction filtered response"

    # Step 3: GET Single Project Details
    print(f"\n[Step 3] GET /v1/govt/projects/{proj_id} ...")
    res = requests.get(f"{BASE_URL}/projects/{proj_id}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    p_detail = res.json().get("data", {})
    assert p_detail.get("id") == proj_id
    print(f"[OK] Retrieved single project details for {proj_id}. Progress: {p_detail.get('progress_percent')}%")

    # Step 4: Advance Project Status (Submitted -> Admin Review)
    print(f"\n[Step 4] POST /v1/govt/projects/{proj_id}/status ...")
    status_payload = {
        "status": "admin_review",
        "remarks": "Technical feasibility & environmental impact approved by State Agronomy Cell."
    }
    res = requests.post(f"{BASE_URL}/projects/{proj_id}/status", json=status_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    updated_p = res.json().get("data", {})
    assert updated_p.get("status") == "admin_review"
    print(f"[OK] Project status updated to: {updated_p.get('status')}")

    # Step 5: Award Tender & Assign Contractor
    print(f"\n[Step 5] POST /v1/govt/projects/{proj_id}/tender-assign ...")
    tender_payload = {
        "tender_ref_number": "TND-2026-MP-0988",
        "contractor_name": "Vanashree Ecological Foundation & Nursery Corp",
        "contractor_type": "Empaneled Plantation Contractor",
        "contract_amount_inr": 2050000.0,
        "mou_reference": "MOU-MP-2026-9901",
        "start_date": "2026-10-20",
        "target_completion_date": "2027-04-20"
    }
    res = requests.post(f"{BASE_URL}/projects/{proj_id}/tender-assign", json=tender_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    tender_p = res.json().get("data", {})
    assert tender_p.get("status") == "partner_assigned"
    assert tender_p.get("assigned_partner") == "Vanashree Ecological Foundation & Nursery Corp"
    print(f"[OK] Tender awarded to {tender_p.get('assigned_partner')} (Contract: INR {tender_p.get('tender_details', {}).get('contract_amount_inr'):,.0f}).")

    # Step 6: Update Milestone Progress with GPS Check-in
    print(f"\n[Step 6] POST /v1/govt/projects/{proj_id}/milestones ...")
    milestone_payload = {
        "milestone_id": "M-1",
        "status": "completed",
        "notes": "Land baseline survey, soil preparation, and compost tilling completed.",
        "gps_location": {"latitude": 22.7485, "longitude": 77.7284},
        "evidence_photos": ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop"]
    }
    res = requests.post(f"{BASE_URL}/projects/{proj_id}/milestones", json=milestone_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    m_p = res.json().get("data", {})
    print(f"[OK] Milestone M-1 marked completed with GPS check-in. Progress updated to: {m_p.get('progress_percent')}%")

    # Step 7: Final Verification & Completion Sign-off
    print(f"\n[Step 7] POST /v1/govt/projects/{proj_id}/verify-complete ...")
    res = requests.post(f"{BASE_URL}/projects/{proj_id}/verify-complete")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    completed_p = res.json().get("data", {})
    assert completed_p.get("status") == "completed"
    assert completed_p.get("progress_percent") == 100
    print(f"[OK] Project {proj_id} certified complete!")
    print(f"  - Progress: {completed_p.get('progress_percent')}%")
    print(f"  - Final Audit Report: {completed_p.get('final_report_url')}")

    # Step 8: Verify Automated Milestone & Status Notifications
    print("\n[Step 8] GET /v1/govt/notifications ...")
    res = requests.get(f"{BASE_URL}/notifications")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    notifs = res.json().get("data", [])
    print(f"[OK] Retrieved {len(notifs)} government notifications.")
    if len(notifs) > 0:
        latest = notifs[0]
        notif_msg = str(latest.get('message', '')).replace('₹', 'INR ')
        print(f"  - Latest Notification: [{latest.get('type')}] {latest.get('title')} -> {notif_msg}")

    print("\n==================================================")
    print("ALL PROJECT & INSTALLATION WORKFLOW TESTS PASSED PERFECTLY!")
    print("==================================================")

if __name__ == "__main__":
    test_project_installation_workflow()
