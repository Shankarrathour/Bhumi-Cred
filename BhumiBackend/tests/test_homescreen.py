import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from bson import ObjectId

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
async def test_homescreen_dashboard():
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
            # Test /dashboard
            r = await client.get("/v1/farmer/homescreen/dashboard")
            assert r.status_code == 200
            res_body = r.json()
            assert res_body["success"] is True
            data = res_body["data"]

            assert data["overview"]["eco_index"] == 85
            assert data["overview"]["wallet_balance"] == 1250.0
            assert data["pulse"]["solar_energy_absorption"] > 0
            assert len(data["journey"]) == 9
            assert len(data["milestones"]) > 0
            assert data["trends"]["nitrogen_retention_rate"] > 0

            # Test /overview
            r_overview = await client.get("/v1/farmer/homescreen/overview")
            assert r_overview.status_code == 200
            assert r_overview.json()["data"]["eco_index"] == 85

            # Test /pulse
            r_pulse = await client.get("/v1/farmer/homescreen/pulse")
            assert r_pulse.status_code == 200
            assert r_pulse.json()["data"]["solar_energy_absorption"] > 0

            # Test /journey
            r_journey = await client.get("/v1/farmer/homescreen/journey")
            assert r_journey.status_code == 200
            assert len(r_journey.json()["data"]) == 9

            # Test /milestones
            r_milestones = await client.get("/v1/farmer/homescreen/milestones")
            assert r_milestones.status_code == 200
            assert len(r_milestones.json()["data"]) > 0

            # Test /trends
            r_trends = await client.get("/v1/farmer/homescreen/trends")
            assert r_trends.status_code == 200
            assert r_trends.json()["data"]["nitrogen_retention_rate"] > 0

    finally:
        app.dependency_overrides.pop(get_current_farmer, None)
