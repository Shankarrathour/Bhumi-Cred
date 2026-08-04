import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from bson import ObjectId
from datetime import datetime

from app.main import app
from app.models.farmer import Farmer
from app.dependencies.auth import get_current_farmer

@pytest_asyncio.fixture(scope="function", autouse=True)
async def init_database():
    from app.database.connection import connect_db, disconnect_db
    await connect_db()
    yield
    await disconnect_db()

@pytest.mark.asyncio
async def test_multi_step_registration_flow():
    # Setup test farmer
    farmer = Farmer(
        id=ObjectId("000000000000000000000002"),
        mobile="9999999999",
        full_name="Test Farmer",
        sustainability_score=85,
        total_trees=12,
        wallet_balance=1250.0,
        district="Bhopal",
    )

    # Override authentication dependency
    app.dependency_overrides[get_current_farmer] = lambda: farmer

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            
            # Step 1: POST /v1/registration/step-1
            step1_data = {
                "belongs_to_self": True,
                "farmer_name": "Test Farmer Name",
                "father_guardian_name": "Test Guardian",
                "mobile_number": "9999999999"
            }
            r1 = await client.post("/v1/registration/step-1", json=step1_data)
            assert r1.status_code == 201
            res1 = r1.json()
            assert res1["success"] is True
            reg_id = res1["data"]["id"]
            assert res1["data"]["current_step"] == 1
            assert res1["data"]["farmer_name"] == "Test Farmer Name"

            # Step 2: PUT /v1/registration/{registration_id}/step-2
            step2_data = {
                "total_area": 10.5,
                "unit": "Acre",
                "multiple_crops": True,
                "soil_composition": "Clayey",
                "water_availability": "Well Water",
                "tree_stock_count": 50,
                "plantation_area": 5.0,
                "plantation_species": ["Teak", "Mango"]
            }
            r2 = await client.put(f"/v1/registration/{reg_id}/step-2", json=step2_data)
            assert r2.status_code == 200
            res2 = r2.json()
            assert res2["success"] is True
            assert res2["data"]["current_step"] == 2
            assert res2["data"]["tree_stock_count"] == 50

            # Step 3: PUT /v1/registration/{registration_id}/step-3
            step3_data = {
                "state": "Madhya Pradesh",
                "district": "Bhopal",
                "tehsil": "Huzur",
                "village": "Rural Bhopal",
                "gram_panchayat": "Bhopal GP",
                "post": "Bhopal Post",
                "pincode": "462001",
                "latitude": 23.2599,
                "longitude": 77.4126
            }
            r3 = await client.put(f"/v1/registration/{reg_id}/step-3", json=step3_data)
            assert r3.status_code == 200
            res3 = r3.json()
            assert res3["success"] is True
            assert res3["data"]["current_step"] == 3

            # Step 4: PUT /v1/registration/{registration_id}/step-4
            step4_data = {
                "boundary_points": [
                    {"latitude": 23.233245, "longitude": 77.432155},
                    {"latitude": 23.233875, "longitude": 77.435774},
                    {"latitude": 23.231995, "longitude": 77.437991}
                ],
                "boundary_locked": True
            }
            r4 = await client.put(f"/v1/registration/{reg_id}/step-4", json=step4_data)
            assert r4.status_code == 200
            res4 = r4.json()
            assert res4["success"] is True
            assert res4["calculated_area"]["acre"] > 0

            # GET Step 4
            r4_get = await client.get(f"/v1/registration/{reg_id}/step-4")
            assert r4_get.status_code == 200
            assert len(r4_get.json()["boundary_points"]) == 3

            # Step 5: PUT /v1/registration/{registration_id}/step-5
            step5_data = {
                "preferred_date": "2026-08-01",
                "preferred_time_slot": "Morning",
                "landmark": "Near old temple",
                "special_instructions": "Call before arriving"
            }
            r5 = await client.put(f"/v1/registration/{reg_id}/step-5", json=step5_data)
            assert r5.status_code == 200
            res5 = r5.json()
            assert res5["success"] is True
            assert res5["data"]["current_step"] == 5

            # Step 6: PUT /v1/registration/{registration_id}/step-6
            step6_data = {
                "tree_insurance": True
            }
            r6 = await client.put(f"/v1/registration/{reg_id}/step-6", json=step6_data)
            assert r6.status_code == 200
            res6 = r6.json()
            assert res6["success"] is True
            assert res6["data"]["tree_insurance"] is True

            # Step 7: GET /v1/registration/{registration_id}/invoice
            r7 = await client.get(f"/v1/registration/{reg_id}/invoice")
            assert r7.status_code == 200
            res7 = r7.json()
            assert res7["success"] is True
            assert res7["data"]["grand_total"] > 0
            assert res7["data"]["insurance_charges"] > 0

            # Step 8: POST /v1/registration/{registration_id}/submit
            r8 = await client.post(f"/v1/registration/{reg_id}/submit")
            assert r8.status_code == 200
            res8 = r8.json()
            assert res8["success"] is True
            assert res8["data"]["registration_number"].startswith("BCR-")
            assert res8["data"]["current_status"] == "submitted"

            # Test Resume: GET /v1/registration/resume
            r_resume = await client.get("/v1/registration/resume")
            # Note: since we submitted it, status is submitted, let's make sure it fetches or resumes appropriately.
            # Actually, resume finds status == "draft", so it might raise NOT_FOUND now that it's submitted.
            # Let's verify that too.
            assert r_resume.status_code == 404

    finally:
        app.dependency_overrides.pop(get_current_farmer, None)
