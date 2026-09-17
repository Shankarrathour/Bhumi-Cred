import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/v1/govt"
API_BASE_URL = "http://127.0.0.1:8000/api/v1/govt"

def test_govt_treasury_dbt_workflow():
    print("=== STARTING GOVERNMENT TREASURY, BUDGET ALLOCATION & DBT INTEGRATION TEST ===")

    # 1. Fetch initial Treasury Summary & 6 Metric Balances
    res = requests.get(f"{BASE_URL}/treasury/summary")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()["data"]["summary"]
    
    assert "available_balance_inr" in data
    assert "allocated_balance_inr" in data
    assert "pending_disbursements_inr" in data
    assert "disbursed_total_inr" in data
    assert "failed_disbursements_inr" in data
    assert "reversed_total_inr" in data
    
    initial_avail = data["available_balance_inr"]
    initial_alloc = data["allocated_balance_inr"]
    print(f"[OK] Treasury Summary fetched. Escrow Available: INR {initial_avail:,.0f} | Allocated: INR {initial_alloc:,.0f}.")

    # Also test /api/v1/govt/treasury/summary path alias
    res_alias = requests.get(f"{API_BASE_URL}/treasury/summary")
    assert res_alias.status_code == 200, f"Expected 200 for API alias, got {res_alias.status_code}"
    print(f"[OK] Alias route /api/v1/govt/treasury/summary verified.")

    # 2. Allocate Budget to Scheme
    alloc_payload = {
        "allocated_amount_inr": 2500000.0,
        "allocation_type": "State Agriculture Sub-Grant FY 2026-27",
        "fiscal_year": "FY 2026-27",
        "notes": "Allocated ₹2.5M to PM-KISAN for upcoming DBT quarter."
    }
    res = requests.post(f"{BASE_URL}/schemes/sch_pmkisan/allocate", json=alloc_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    alloc_res = res.json()
    new_summary = alloc_res["treasury_summary"]
    assert new_summary["available_balance_inr"] == initial_avail - 2500000.0
    assert new_summary["allocated_balance_inr"] == initial_alloc + 2500000.0
    print(f"[OK] Scheme Budget Allocated: INR 2,500,000 to sch_pmkisan. New Escrow Available: INR {new_summary['available_balance_inr']:,.0f}.")

    # 3. Disburse DBT Payout Batch (4 Beneficiaries)
    dbt_payload = {
        "scheme_id": "sch_pmkisan",
        "scheme_name": "PM-KISAN (Kisan Samman Nidhi)",
        "beneficiary_ids": ["FAR-101", "FAR-102", "FAR-103", "FAR-104"],
        "amount_per_farmer_inr": 2000.0,
        "purpose": "PM-KISAN DBT Installment #2",
        "payment_gateway": "PFMS_DBT"
    }
    res = requests.post(f"{BASE_URL}/dbt/disburse", json=dbt_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    dbt_res = res.json()
    batch_id = dbt_res["batch_id"]
    txns = dbt_res["transactions"]
    assert len(txns) == 4
    assert dbt_res["total_disbursed_inr"] == 8000.0
    print(f"[OK] DBT Batch Payout Disbursed: Batch {batch_id} (INR 8,000 total across 4 beneficiaries).")

    # 4. Check Individual Transaction Status & Verify KYC/Bank Data Masking
    txn_1_id = txns[0]["transaction_id"]
    txn_2_id = txns[1]["transaction_id"]
    txn_3_id = txns[2]["transaction_id"]
    
    res = requests.get(f"{BASE_URL}/dbt/status/{txn_1_id}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    txn_detail = res.json()["data"]
    assert txn_detail["status"] == "INITIATED"
    assert "XXXX-XXXX" in txn_detail["beneficiary"]["aadhaar_masked"]
    assert "Masked" in txn_detail["beneficiary"]["bank_masked"]
    print(f"[OK] Verified KYC/Bank Data Masking: Aadhaar {txn_detail['beneficiary']['aadhaar_masked']}, Bank {txn_detail['beneficiary']['bank_masked']}.")

    # 5. Status Transitions
    # Txn 1: INITIATED -> SUCCESS
    res = requests.post(f"{BASE_URL}/dbt/status/{txn_1_id}", json={"status": "SUCCESS", "remarks": "PFMS UTR Settled."})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    updated_1 = res.json()["data"]
    assert updated_1["status"] == "SUCCESS"
    assert "UTR-PFMS" in updated_1["utr_number"]
    print(f"[OK] Txn 1 {txn_1_id}: INITIATED -> SUCCESS (UTR: {updated_1['utr_number']}).")

    # Txn 2: INITIATED -> FAILED
    res = requests.post(f"{BASE_URL}/dbt/status/{txn_2_id}", json={"status": "FAILED", "failure_reason": "NPCI Bank Account Inactive"})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    updated_2 = res.json()["data"]
    assert updated_2["status"] == "FAILED"
    print(f"[OK] Txn 2 {txn_2_id}: INITIATED -> FAILED (Reason: {updated_2['failure_reason']}).")

    # Txn 3: INITIATED -> SUCCESS -> REVERSED
    res = requests.post(f"{BASE_URL}/dbt/status/{txn_3_id}", json={"status": "SUCCESS"})
    assert res.status_code == 200
    res = requests.post(f"{BASE_URL}/dbt/status/{txn_3_id}", json={"status": "REVERSED", "failure_reason": "Account Closed Refund"})
    assert res.status_code == 200
    updated_3 = res.json()["data"]
    assert updated_3["status"] == "REVERSED"
    print(f"[OK] Txn 3 {txn_3_id}: SUCCESS -> REVERSED (Refunded to Escrow).")

    # 6. Run Automated Bank Reconciliation
    res = requests.post(f"{BASE_URL}/dbt/reconcile", json={"scheme_id": "sch_pmkisan", "notes": "Run automated reconciliation."})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    recon_res = res.json()
    assert recon_res["reconciled_count"] >= 1
    assert recon_res["refunded_amount_inr"] >= 2000.0
    print(f"[OK] Bank Reconciliation Completed: Reconciled {recon_res['reconciled_count']} failed transfers (Refunded INR {recon_res['refunded_amount_inr']:,.0f} to Escrow).")

    # 7. Final Treasury Summary Assertion
    res = requests.get(f"{BASE_URL}/treasury/summary")
    final_summary = res.json()["data"]["summary"]
    print(f"[OK] Final Treasury Balance Verified. Available: INR {final_summary['available_balance_inr']:,.0f} | Disbursed: INR {final_summary['disbursed_total_inr']:,.0f} | Reversed: INR {final_summary['reversed_total_inr']:,.0f}.")

    print("\n=== ALL TESTS FOR GOVERNMENT TREASURY, BUDGET ALLOCATION & DBT PASSED PERFECTLY ===")

if __name__ == "__main__":
    test_govt_treasury_dbt_workflow()
