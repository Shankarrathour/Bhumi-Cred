import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/v1/govt"

def run_test():
    print("==========================================================")
    print("  TESTING GOVERNMENT CARBON CREDIT REQUEST WORKFLOW & LEDGER  ")
    print("==========================================================")

    # 1. Fetch eligible target activities (Public Assets, Projects, Land)
    print("\n1. Fetching Carbon Eligible Targets...")
    res = requests.get(f"{BASE_URL}/carbon/eligible-targets")
    assert res.status_code == 200, f"Failed eligible targets: {res.text}"
    targets = res.json().get("data", [])
    print(f"   [OK] Retrieved {len(targets)} eligible targets.")
    assert len(targets) > 0, "No carbon targets returned."
    selected_target = targets[0]
    print(f"   Selected Target: {selected_target['name']} (ID: {selected_target['id']}, Type: {selected_target['target_type']})")

    # 2. Upload baseline carbon document using file upload endpoint
    print("\n2. Testing Storage File Upload Handler...")
    upload_payload = {
        "filename": f"Baseline_Carbon_Assessment_{int(time.time())}.pdf",
        "file_type": "document"
    }
    res = requests.post(f"{BASE_URL}/upload-file", json=upload_payload)
    assert res.status_code == 201, f"Failed file upload: {res.text}"
    file_info = res.json().get("data", {})
    uploaded_doc_url = file_info.get("file_url")
    print(f"   [OK] Document uploaded successfully: {uploaded_doc_url}")

    # 3. Create Carbon Credit Request
    print("\n3. Creating Government Carbon Credit Request...")
    req_payload = {
        "target_type": selected_target["target_type"],
        "target_id": selected_target["id"],
        "target_name": selected_target["name"],
        "area_acres": selected_target.get("area_acres", 10.0),
        "objective": "Carbon sequestration, soil organic carbon enhancement & riparian biodiversity buffer.",
        "documents": [{"name": "Baseline_Carbon_Assessment.pdf", "url": uploaded_doc_url}],
        "evidence_photos": ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop"],
        "sentinel_ndvi_link": "https://sentinel.bhumicred.in/ndvi/CRB-TEST",
        "methodology": "VM0042 - Improved Agroforestry & Afforestation",
        "tree_density": "350 Trees / Acre",
        "carbon_target_tco2e": 3500.0,
        "baseline_year": 2026,
        "jurisdiction_code": "MP-IND-461"
    }
    res = requests.post(f"{BASE_URL}/carbon/requests", json=req_payload)
    assert res.status_code == 201, f"Failed create carbon request: {res.text}"
    req_data = res.json().get("data", {})
    req_id = req_data.get("id")
    print(f"   [OK] Carbon Request Created: {req_id} (Stage: {req_data.get('stage')})")

    # 4. Verify 6-Stage Workflow Transitions
    stages = ["Eligibility Validation", "Admin Review", "Verification", "Monitoring"]
    print("\n4. Progressing Request through 6-Stage Workflow...")
    for stage_name in stages:
        status_payload = {
            "new_stage": stage_name,
            "auditor_notes": f"Verified and signoff for stage {stage_name}.",
            "sentinel_ndvi_score": 0.86,
            "canopy_coverage_percent": 82.0
        }
        res = requests.post(f"{BASE_URL}/carbon/requests/{req_id}/status", json=status_payload)
        assert res.status_code == 200, f"Failed stage transition to {stage_name}: {res.text}"
        updated_req = res.json().get("data", {})
        print(f"   [OK] Advanced to stage '{updated_req.get('stage')}' (NDVI: {updated_req.get('sentinel_ndvi_score')})")

    # 5. Verify Unapproved Target Rejection Guard
    print("\n5. Testing Strict Approval Guard (Rejecting Unapproved Targets)...")
    unapproved_payload = {
        "target_type": "public_asset",
        "target_id": "AST-UNAPPROVED-999",
        "target_name": "Unapproved Private Land Clearings",
        "area_acres": 5.0,
        "objective": "Illegal encroachment test",
        "carbon_target_tco2e": 1000.0
    }
    res = requests.post(f"{BASE_URL}/carbon/requests", json=unapproved_payload)
    assert res.status_code == 400, "Unapproved target request creation should have been rejected with HTTP 400"
    print(f"   [OK] Target activity approval guard successfully rejected unapproved request.")

    # 6. Issue State Carbon Credits & Minting into Ledger
    print("\n6. Issuing Certified State Carbon Credits...")
    issue_payload = {
        "credits_to_issue": 3500.0,
        "certification_agency": "Verra (VCS) / India Carbon Registry",
        "vintage_year": 2026,
        "serial_prefix": "BC-IND-MP",
        "unit_price_inr": 1850.0,
        "auditor_notes": "Continuous satellite MRV telemetry and field baseline audit confirmed."
    }
    res = requests.post(f"{BASE_URL}/carbon/requests/{req_id}/issue-credits", json=issue_payload)
    assert res.status_code == 200, f"Failed credit issuance: {res.text}"
    issue_res = res.json().get("data", {})
    serial = issue_res.get("request", {}).get("registry_serial_number")
    print(f"   [OK] Minted 3,500 tCO2e Carbon Credits! (Registry Serial: {serial})")

    # 7. Check State Carbon Credit Ledger
    print("\n7. Fetching State Carbon Credit Ledger Summary...")
    res = requests.get(f"{BASE_URL}/carbon/ledger")
    assert res.status_code == 200, f"Failed ledger fetch: {res.text}"
    ledger = res.json().get("data", {})
    print(f"   Total Minted: {ledger.get('total_minted_credits'):,.0f} tCO2e")
    print(f"   Available Registry: {ledger.get('available_registry_credits'):,.0f} tCO2e")
    print(f"   Retired / Transferred: {ledger.get('retired_transferred_credits'):,.0f} tCO2e")
    print(f"   Total Value (INR): INR {ledger.get('estimated_carbon_value_inr'):,.0f}")
    assert ledger.get("available_registry_credits") >= 3500.0, "State ledger balance mismatch."

    # 8. Transfer & Settlement Tracking
    print("\n8. Executing Carbon Credit Transfer & Settlement...")
    transfer_payload = {
        "credits_to_transfer": 1000.0,
        "buyer_or_recipient": "Tata Power NetZero ESCROW Pool",
        "transfer_type": "TRANSFER",
        "unit_price_inr": 1850.0,
        "notes": "Corporate ESG offsetting registry settlement."
    }
    res = requests.post(f"{BASE_URL}/carbon/transfer", json=transfer_payload)
    assert res.status_code == 200, f"Failed credit transfer: {res.text}"
    transfer_res = res.json().get("data", {})
    trf_tx = transfer_res.get("transfer_transaction", {})
    print(f"   [OK] Transferred 1,000 Credits to {trf_tx.get('buyer_recipient')} (Tx ID: {trf_tx.get('tx_id')}, Serial: {trf_tx.get('serial_range')})")

    # 9. Persistent Tender Proposals
    print("\n9. Testing Persistent Tender Proposal Submission & Awarding...")
    tender_payload = {
        "tender_ref_number": f"TND-TEST-{int(time.time())}",
        "title": "Gram Panchayat Forest Bio-Shield Supply Contract",
        "project_id": "PRJ-801",
        "contractor_name": "Vanashree Ecological Foundation",
        "contractor_gstin": "23AAACV1234F1Z5",
        "proposed_budget_inr": 1650000.0,
        "technical_proposal_doc": uploaded_doc_url,
        "financial_bid_doc": uploaded_doc_url,
        "jurisdiction_code": "MP-IND-461",
        "notes": "Empaneled contractor bid for bio-shield plantation."
    }
    res = requests.post(f"{BASE_URL}/tenders", json=tender_payload)
    assert res.status_code == 201, f"Failed create tender: {res.text}"
    tender_data = res.json().get("data", {})
    tender_id = tender_data.get("id")
    print(f"   [OK] Persistent Tender Proposal Created: {tender_id}")

    res = requests.get(f"{BASE_URL}/tenders")
    assert res.status_code == 200, f"Failed list tenders: {res.text}"
    tenders_list = res.json().get("data", [])
    print(f"   [OK] Retrieved {len(tenders_list)} persistent tenders from database.")

    award_payload = {
        "contractor_name": "Vanashree Ecological Foundation",
        "awarded_amount_inr": 1650000.0,
        "notes": "Awarded by State Agronomy Committee."
    }
    res = requests.post(f"{BASE_URL}/tenders/{tender_id}/award", json=award_payload)
    assert res.status_code == 200, f"Failed award tender: {res.text}"
    print(f"   [OK] Tender {tender_id} awarded successfully!")

    # 10. Verify Notifications
    print("\n10. Checking Government System Notifications...")
    res = requests.get(f"{BASE_URL}/notifications")
    assert res.status_code == 200, f"Failed notifications fetch: {res.text}"
    notifs = res.json().get("data", [])
    print(f"   [OK] Total Notifications: {len(notifs)}")

    print("\n==========================================================")
    print("  ALL GOVERNMENT CARBON CREDIT WORKFLOW TESTS PASSED 100%! ")
    print("==========================================================")

if __name__ == "__main__":
    run_test()
