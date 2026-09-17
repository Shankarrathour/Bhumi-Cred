import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/v1/govt"

def test_govt_marketplace_workflow():
    print("=== STARTING GOVERNMENT MARKETPLACE & SUBSIDY MODULE INTEGRATION TEST ===")

    # 1. Browse catalog with category filtering
    categories = ["Seeds", "Saplings", "Agricultural products", "Government-supported items"]
    for cat in categories:
        res = requests.get(f"{BASE_URL}/marketplace/products", params={"category": cat})
        assert res.status_code == 200, f"Expected 200 for category {cat}, got {res.status_code}: {res.text}"
        data = res.json()
        assert data["success"] is True
        assert data["count"] > 0
        print(f"[OK] Category '{cat}': {data['count']} items found.")

    # 2. Search query filtering
    res = requests.get(f"{BASE_URL}/marketplace/products", params={"search": "solar"})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    search_data = res.json()
    assert search_data["success"] is True
    print(f"[OK] Search query 'solar': {search_data['count']} matching items.")

    # 3. Product detail lookup
    res = requests.get(f"{BASE_URL}/marketplace/products/PROD-GOV-010")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    prod_detail = res.json()["data"]
    assert prod_detail["id"] == "PROD-GOV-010"
    assert prod_detail["subsidy_percent"] == 80.0
    print(f"[OK] Fetched detail for {prod_detail['name']} (Scheme: {prod_detail['scheme_code']}, Subsidy: {prod_detail['subsidy_percent']}%).")

    # 4. Subsidy Eligibility & Price Breakdown Verification
    verify_payload = {
        "farmer_id": "FAR-101",
        "farmer_name": "Ramkumar Sharma",
        "scheme_code": "PM-KUSUM",
        "product_id": "PROD-GOV-010",
        "quantity": 1
    }
    res = requests.post(f"{BASE_URL}/marketplace/verify-subsidy", json=verify_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    sub_verif = res.json()
    assert sub_verif["is_eligible"] is True
    assert sub_verif["total_product_price_inr"] == 250000.0
    assert sub_verif["government_contribution_inr"] == 200000.0
    assert sub_verif["farmer_payable_amount_inr"] == 50000.0
    print(f"[OK] Subsidy Verified: Total INR {sub_verif['total_product_price_inr']:,.0f} | Govt Contribution: INR {sub_verif['government_contribution_inr']:,.0f} | Farmer Payable: INR {sub_verif['farmer_payable_amount_inr']:,.0f}")

    # 5. Subsidy Voucher Generation
    voucher_payload = {
        "farmer_id": "FAR-101",
        "farmer_name": "Ramkumar Sharma",
        "scheme_code": "PM-KUSUM",
        "product_id": "PROD-GOV-010",
        "quantity": 1,
        "subsidy_amount_inr": 200000.0
    }
    res = requests.post(f"{BASE_URL}/marketplace/vouchers/generate", json=voucher_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    vch_data = res.json()["data"]
    vch_code = vch_data["voucher_code"]
    print(f"[OK] Generated Subsidy Voucher: {vch_code} (Value: INR {vch_data['subsidy_amount_inr']:,.0f}).")

    # 6. Subsidized Checkout Execution
    checkout_payload = {
        "farmer_id": "FAR-101",
        "farmer_name": "Ramkumar Sharma",
        "scheme_code": "PM-KUSUM",
        "cart_items": [
            {"product_id": "PROD-GOV-010", "quantity": 1},
            {"product_id": "PROD-GOV-001", "quantity": 2}
        ],
        "voucher_code": vch_code,
        "delivery_address": "Gram Panchayat Krishi Bhavan, Pipariya Tehsil, Hoshangabad, MP"
    }
    res = requests.post(f"{BASE_URL}/marketplace/checkout", json=checkout_payload)
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    checkout_res = res.json()["data"]
    order_id = checkout_res["id"]
    order_num = checkout_res["order_number"]
    assert checkout_res["total_government_subsidy_inr"] > 0
    assert checkout_res["total_farmer_payable_inr"] > 0
    print(f"[OK] Subsidized Order Placed: {order_num} ({order_id}) - Govt Subsidy: INR {checkout_res['total_government_subsidy_inr']:,.0f}.")

    # 7. Order Detail & Delivery Tracking Inspection
    res = requests.get(f"{BASE_URL}/marketplace/orders/{order_id}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    ord_detail = res.json()["data"]
    assert ord_detail["status"] == "Placed"
    print(f"[OK] Order Detail Verified: {len(ord_detail['line_items'])} line items.")

    # 8. Advance Order Delivery Status (Placed -> Approved -> Dispatched -> Delivered)
    statuses = ["Approved", "Dispatched", "Delivered"]
    for st in statuses:
        res = requests.post(f"{BASE_URL}/marketplace/orders/{order_id}/status", json={"status": st, "remarks": f"Transitioned to {st}."})
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        updated = res.json()["data"]
        assert updated["status"] == st
        print(f"[OK] Order Delivery Status Updated: {st}.")

    # 9. Verify Order Notifications Dispatch
    res = requests.get(f"{BASE_URL}/notifications")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    notifs = res.json()["data"]
    order_notifs = [n for n in notifs if "Order" in n.get("title", "")]
    assert len(order_notifs) >= 1
    print(f"[OK] Notifications Verified: {len(order_notifs)} order notifications recorded.")

    print("\n=== ALL TESTS FOR GOVERNMENT MARKETPLACE & SUBSIDY MODULE PASSED PERFECTLY ===")

if __name__ == "__main__":
    test_govt_marketplace_workflow()
