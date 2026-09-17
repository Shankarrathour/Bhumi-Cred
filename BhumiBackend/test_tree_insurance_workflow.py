import requests
import json
import sys

BASE_URL = "http://localhost:8000/v1/govt"

def test_tree_insurance_workflow():
    print("==================================================")
    print("STARTING AUTOMATED TREE INSURANCE WORKFLOW TEST")
    print("==================================================")

    # Step 1: List Insurance Policies
    print("\n[Step 1] GET /v1/govt/insurance ...")
    res = requests.get(f"{BASE_URL}/insurance")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data.get("success") is True, f"Response success false: {data}"
    policies = data.get("data", [])
    print(f"[OK] Retrieved {len(policies)} tree insurance policies.")
    if len(policies) > 0:
        p0 = policies[0]
        sum_ins = p0.get('sum_insured_inr') or 0
        prem = p0.get('premium_annual_inr') or 0
        sub_share = p0.get('govt_subsidy_share_inr') or 0
        excl = p0.get('exclusions_list') or []
        print(f"  - Initial Policy ID: {p0.get('id')} | Asset: {p0.get('asset_name') or p0.get('entity_name')}")
        print(f"  - Sum Insured: INR {sum_ins:,.0f} | Premium: INR {prem:,.0f}")
        print(f"  - State Subsidy (75%): INR {sub_share:,.0f} | Exclusions Count: {len(excl)}")

    # Step 2: Request New Tree Insurance Policy
    print("\n[Step 2] POST /v1/govt/insurance/request ...")
    policy_payload = {
        "target_type": "approved_public_asset",
        "target_id": "ASSET-9901",
        "asset_name": "Satpura Canopy Eco-Reserve Block #3",
        "coverage_scope": "plantation_farm_coverage",
        "trees_count": 850,
        "species_list": ["Teak / Sagwan", "Banyan / Bargad", "Mahua", "Neem"],
        "location": "Pipariya Tehsil, Hoshangabad",
        "coverage_type": "Comprehensive Climate, Flood & Fire Risk",
        "sum_insured_inr": 425000.0,
        "tenure_years": 1,
        "govt_subsidy_percent": 75.0,
        "evidence_photos": ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop"],
        "contact_person": "Rajesh Sharma (Gram Nodal Officer)"
    }
    res = requests.post(f"{BASE_URL}/insurance/request", json=policy_payload)
    assert res.status_code in (200, 201), f"Expected 200/201, got {res.status_code}: {res.text}"
    new_pol_data = res.json()
    assert new_pol_data.get("success") is True, f"Policy request failed: {new_pol_data}"
    new_policy = new_pol_data["data"]
    policy_id = new_policy["id"]
    print(f"[OK] Created Policy Application: {policy_id}")
    print(f"  - Status: {new_policy.get('status')}")
    print(f"  - Calculated Premium: INR {new_policy.get('premium_annual_inr'):,.2f}")
    print(f"  - Govt Subsidy Share (75%): INR {new_policy.get('govt_subsidy_share_inr'):,.2f}")
    print(f"  - Panchayat/Farmer Share (25%): INR {new_policy.get('institutional_settlement_share_inr'):,.2f}")

    # Step 3: GET Policy Details
    print(f"\n[Step 3] GET /v1/govt/insurance/{policy_id} ...")
    res = requests.get(f"{BASE_URL}/insurance/{policy_id}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    pol_detail = res.json().get("data", {})
    assert pol_detail.get("id") == policy_id
    print(f"[OK] Retrieved policy details for {policy_id}. Trees: {pol_detail.get('trees_count')}")

    # Step 4: Nodal Officer Verification & Policy Activation
    print(f"\n[Step 4] POST /v1/govt/insurance/{policy_id}/nodal-verify ...")
    nodal_payload = {
        "nodal_officer_name": "Rajesh Sharma (Sub-Divisional Officer)",
        "approval_status": "approved",
        "remarks": "Physical verification completed. Public land ownership verified and 75% subsidy approved."
    }
    res = requests.post(f"{BASE_URL}/insurance/{policy_id}/nodal-verify", json=nodal_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    active_pol = res.json().get("data", {})
    assert active_pol.get("status") == "active", f"Expected active status, got {active_pol.get('status')}"
    print(f"[OK] Policy {policy_id} verified by Nodal Officer. Status updated to: {active_pol.get('status')}")

    # Step 5: Report Damage Claim
    print("\n[Step 5] POST /v1/govt/insurance/claims ...")
    claim_payload = {
        "policy_id": policy_id,
        "asset_name": "Satpura Canopy Eco-Reserve Block #3",
        "incident_date": "2026-09-08",
        "cause_of_damage": "Cyclone / Storm",
        "affected_trees_count": 28,
        "claimed_amount_inr": 38000.0,
        "description": "Severe storm wind gust uprooted 28 mature Teak trees along western ridge.",
        "photo_urls": ["https://images.unsplash.com/photo-1511497584788-876761c1298b?w=600&auto=format&fit=crop"],
        "gps_location": {"latitude": 22.748, "longitude": 77.728}
    }
    res = requests.post(f"{BASE_URL}/insurance/claims", json=claim_payload)
    assert res.status_code in (200, 201), f"Expected 200/201, got {res.status_code}: {res.text}"
    claim_resp = res.json()
    assert claim_resp.get("success") is True
    claim_data = claim_resp.get("data", {})
    claim_id = claim_data.get("claim_id")
    print(f"[OK] Damage claim filed: {claim_id} for INR {claim_data.get('claimed_amount_inr'):,.0f}.")
    print(f"  - Initial Claim Status: {claim_data.get('status')}")

    # Step 6: Surveyor Inspection & Nodal Sign-off Settlement
    print(f"\n[Step 6] POST /v1/govt/insurance/claims/{claim_id}/signoff ...")
    signoff_payload = {
        "surveyor_name": "Dr. S. K. Verma (ICAR Senior Tree Surveyor)",
        "nodal_officer_name": "Rajesh Sharma (SDO Nodal Officer)",
        "inspected_loss_amount_inr": 35000.0,
        "approved_claim_amount_inr": 35000.0,
        "status": "approved",
        "inspection_notes": "Physical on-site inspection verified storm windfall loss. Approved INR 35,000 claim disbursement."
    }
    res = requests.post(f"{BASE_URL}/insurance/claims/{claim_id}/signoff", json=signoff_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    settled_claim = res.json().get("data", {})
    assert settled_claim.get("status") == "settled", f"Expected settled, got {settled_claim.get('status')}"
    print(f"[OK] Claim {claim_id} inspection sign-off completed.")
    print(f"  - Final Claim Status: {settled_claim.get('status')}")
    print(f"  - Approved Payout: INR {settled_claim.get('inspection_signoff', {}).get('approved_claim_amount_inr'):,.0f}")

    # Step 7: Verify Notifications Dispatch
    print("\n[Step 7] GET /v1/govt/notifications ...")
    res = requests.get(f"{BASE_URL}/notifications")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    notifs = res.json().get("data", [])
    print(f"[OK] Retrieved {len(notifs)} government notifications.")
    if len(notifs) > 0:
        latest = notifs[0]
        notif_msg = str(latest.get('message', '')).replace('₹', 'INR ')
        print(f"  - Latest Notif: [{latest.get('type')}] {latest.get('title')} -> {notif_msg}")

    print("\n==================================================")
    print("ALL TREE INSURANCE WORKFLOW TESTS PASSED PERFECTLY!")
    print("==================================================")

if __name__ == "__main__":
    test_tree_insurance_workflow()
