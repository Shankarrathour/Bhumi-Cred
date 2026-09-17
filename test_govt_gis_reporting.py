import requests
import json
import os
import time

BASE_URL = "http://127.0.0.1:8000/v1/govt"

def run_test():
    print("==========================================================")
    print("  TESTING GOVERNMENT GIS & DYNAMIC REPORTING WORKFLOW     ")
    print("==========================================================")

    # 1. Test GIS Layers for 8 Layer Types & Filtering
    print("\n1. Testing GIS Layers Endpoint (All 8 Layer Types)...")
    res = requests.get(f"{BASE_URL}/gis/layers?district=Hoshangabad&jurisdiction_code=MP-IND-461")
    assert res.status_code == 200, f"Failed GIS layers fetch: {res.text}"
    gis_resp = res.json()
    gis_data = gis_resp.get("data") or gis_resp.get("layers") or {}
    
    layer_keys = [
        "public_assets",
        "farmers",
        "land",
        "projects",
        "trees",
        "soil_activity",
        "insurance_activity",
        "carbon_activity"
    ]
    for key in layer_keys:
        assert key in gis_data, f"Missing GIS layer '{key}' in response."
        print(f"   [OK] GIS Layer '{key}': {len(gis_data[key])} features returned.")

    # 2. Test Dynamic Report Categories (All 9 Categories)
    print("\n2. Testing Dynamic Government Reports Summary...")
    res = requests.get(f"{BASE_URL}/reports/categories")
    assert res.status_code == 200, f"Failed reports summary: {res.text}"
    summary = res.json()
    assert summary.get("success") == True, "Failed success flag."
    categories = summary.get("categories", [])
    print(f"   [OK] Retrieved {len(categories)} report categories.")

    # 3. Test Detail Views for All 9 Required Report Categories
    print("\n3. Testing Report Details for All 9 Categories & KYC Masking...")
    report_cats = [
        "asset_inventory",
        "farmer_participation",
        "soil_testing",
        "tree_insurance",
        "project_progress",
        "campaigns",
        "carbon_activity",
        "compliance",
        "expenditure"
    ]

    for cat in report_cats:
        res = requests.get(f"{BASE_URL}/reports/detail/{cat}?district=Hoshangabad&date_range=Last%2030%20Days")
        assert res.status_code == 200, f"Failed report detail for {cat}: {res.text}"
        detail = res.json()
        assert detail.get("success") == True, f"Failed detail for {cat}"
        print(f"   [OK] Category '{cat}': Title: '{detail.get('title')}' ({len(detail.get('items', []))} items)")
        
        # Verify KYC Masking on items
        items = detail.get("items", [])
        for item in items:
            for field, val in item.items():
                if isinstance(val, str):
                    assert not val.startswith("9876543210"), f"Unmasked phone exposed in {cat}: {val}"
                    assert not ("1234 5678" in val), f"Unmasked Aadhaar exposed in {cat}: {val}"

    # 4. Test Real PDF Report Generation Backend
    print("\n4. Testing Real Backend PDF Report Generation...")
    res = requests.get(f"{BASE_URL}/reports/export/pdf?category=asset_inventory")
    assert res.status_code == 200, f"Failed PDF export: {res.text}"
    assert res.headers.get("content-type") == "application/pdf", f"Unexpected content-type: {res.headers.get('content-type')}"
    pdf_bytes = res.content
    assert len(pdf_bytes) > 100, "Generated PDF is empty or invalid."
    assert pdf_bytes.startswith(b"%PDF"), "PDF stream header invalid."
    print(f"   [OK] Real PDF File Generated Successfully ({len(pdf_bytes)} bytes, Content-Type: application/pdf).")

    # 5. Test Real CSV Export Backend
    print("\n5. Testing Real Backend CSV Data Export...")
    res = requests.get(f"{BASE_URL}/reports/export/csv?category=farmer_participation")
    assert res.status_code == 200, f"Failed CSV export: {res.text}"
    assert "text/csv" in res.headers.get("content-type", ""), f"Unexpected content-type: {res.headers.get('content-type')}"
    csv_text = res.text
    assert len(csv_text) > 50, "Generated CSV is empty."
    assert "FMR-" in csv_text or "REF ID" in csv_text or "ref_id" in csv_text or "id" in csv_text, "CSV content missing record identifiers."
    print(f"   [OK] Real CSV File Generated Successfully ({len(csv_text)} bytes, Content-Type: text/csv).")

    # 6. Test Real GeoJSON GIS Export Backend
    print("\n6. Testing Real Backend GeoJSON Export...")
    res = requests.get(f"{BASE_URL}/gis/export/geojson?district=Hoshangabad")
    assert res.status_code == 200, f"Failed GeoJSON export: {res.text}"
    assert "application/geo+json" in res.headers.get("content-type", "") or "json" in res.headers.get("content-type", ""), f"Unexpected content-type: {res.headers.get('content-type')}"
    geojson_obj = res.json()
    assert geojson_obj.get("type") == "FeatureCollection", "GeoJSON type is not FeatureCollection."
    features = geojson_obj.get("features", [])
    print(f"   [OK] Real GeoJSON Exported Successfully ({len(features)} spatial features).")

    # 7. Test Export JSON Trigger Handler (Generates Real File on Disk)
    print("\n7. Testing Export Sanitized Request Handler...")
    export_payload = {
        "report_category": "expenditure",
        "report_name": "Institutional Treasury & DBT Expenditure Payouts",
        "format": "pdf",
        "date_range": "Last 30 Days",
        "filters": {"district": "Hoshangabad", "jurisdiction_code": "MP-IND-461"}
    }
    res = requests.post(f"{BASE_URL}/reports/export", json=export_payload)
    assert res.status_code == 200, f"Failed report export post: {res.text}"
    export_res = res.json()
    assert export_res.get("success") == True, "Failed export success."
    down_url = export_res.get("download_url")
    print(f"   [OK] Export Generated: {export_res.get('export_id')} -> Download URL: {down_url}")

    # 8. Verify Static File Serving for Generated Download URL
    print("\n8. Verifying Real File Download via Static Path...")
    res = requests.get(f"http://127.0.0.1:8000{down_url}")
    assert res.status_code == 200, f"Failed to download generated static file: {res.text}"
    print(f"   [OK] File downloaded from static URL successfully ({len(res.content)} bytes).")

    print("\n==========================================================")
    print("  ALL GOVERNMENT GIS & REPORTING TESTS PASSED 100%!        ")
    print("==========================================================")

if __name__ == "__main__":
    run_test()
