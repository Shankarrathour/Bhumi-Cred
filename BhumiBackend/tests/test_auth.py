"""
Phase 1 — Auth endpoint smoke tests.
Run with:  pytest tests/ -v
Requires a running MongoDB instance (set MONGODB_URI in .env or environment).
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.main import app


_CLEAN_MOBILES = [
    "9100000001", "9100000002", "9100000003",
    "9100000004", "9100000005", "9100000006",
]


@pytest_asyncio.fixture(scope="function", autouse=True)
async def init_database():
    from app.database.connection import connect_db, disconnect_db
    await connect_db()
    yield
    await disconnect_db()


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c


@pytest_asyncio.fixture
async def clean_client():
    """Client with pre-test farmer cleanup — ensures register/login tests are idempotent."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        from app.models.farmer import Farmer
        for mobile in _CLEAN_MOBILES:
            farmer = await Farmer.find_one(Farmer.mobile == mobile)
            if farmer:
                await farmer.delete()
        yield c


# ── Health ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ── Farmer Auth ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_send_otp_valid_mobile(client: AsyncClient):
    r = await client.post("/v1/auth/send-otp", json={"mobile": "9876543210"})
    assert r.status_code == 200
    data = r.json()
    assert data["mobile"] == "9876543210"
    # otp_debug only present in development
    assert "otp_debug" in data


@pytest.mark.asyncio
async def test_send_otp_invalid_mobile(client: AsyncClient):
    r = await client.post("/v1/auth/send-otp", json={"mobile": "12345"})
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_verify_otp_flow(client: AsyncClient):
    # Step 1 — send OTP
    send_r = await client.post("/v1/auth/send-otp", json={"mobile": "9000000001"})
    assert send_r.status_code == 200
    otp = send_r.json().get("otp_debug")
    assert otp, "otp_debug missing — is ENVIRONMENT=development?"

    # Step 2 — verify OTP
    verify_r = await client.post(
        "/v1/auth/verify-otp", json={"mobile": "9000000001", "otp": otp}
    )
    assert verify_r.status_code == 200
    body = verify_r.json()
    assert "tokens" in body
    assert body["tokens"]["access_token"]
    assert body["tokens"]["refresh_token"]
    assert body["farmer"]["mobile"] == "9000000001"


@pytest.mark.asyncio
async def test_verify_otp_wrong_otp(client: AsyncClient):
    await client.post("/v1/auth/send-otp", json={"mobile": "9000000002"})
    r = await client.post(
        "/v1/auth/verify-otp", json={"mobile": "9000000002", "otp": "000000"}
    )
    assert r.status_code == 400
    assert r.json()["error_code"] == "OTP_INVALID"


# ── Admin Auth ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_admin_login_valid(client: AsyncClient):
    r = await client.post(
        "/v1/admin/auth/login",
        json={"email": "admin@bhumi.in", "password": "Admin@1234"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["tokens"]["access_token"]
    assert body["admin"]["email"] == "admin@bhumi.in"


@pytest.mark.asyncio
async def test_admin_login_wrong_password(client: AsyncClient):
    r = await client.post(
        "/v1/admin/auth/login",
        json={"email": "admin@bhumi.in", "password": "wrongpassword"},
    )
    assert r.status_code == 401
    assert r.json()["error_code"] == "INVALID_CREDENTIALS"


@pytest.mark.asyncio
async def test_admin_verify_requires_token(client: AsyncClient):
    r = await client.get("/v1/admin/auth/verify")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_admin_verify_with_token(client: AsyncClient):
    login_r = await client.post(
        "/v1/admin/auth/login",
        json={"email": "admin@bhumi.in", "password": "Admin@1234"},
    )
    token = login_r.json()["tokens"]["access_token"]

    verify_r = await client.get(
        "/v1/admin/auth/verify",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert verify_r.status_code == 200
    assert verify_r.json()["email"] == "admin@bhumi.in"


# ── Register send-otp ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_send_otp_new_mobile(clean_client: AsyncClient):
    r = await clean_client.post("/v1/auth/register/send-otp", json={"mobile": "9100000001"})
    assert r.status_code == 200
    data = r.json()
    assert data["mobile"] == "9100000001"
    assert "otp_debug" in data


@pytest.mark.asyncio
async def test_register_send_otp_existing_mobile(clean_client: AsyncClient):
    # First registration succeeds
    r1 = await clean_client.post("/v1/auth/register/send-otp", json={"mobile": "9100000002"})
    assert r1.status_code == 200
    # Second attempt must fail
    r2 = await clean_client.post("/v1/auth/register/send-otp", json={"mobile": "9100000002"})
    assert r2.status_code == 409
    assert r2.json()["error_code"] == "MOBILE_ALREADY_REGISTERED"


@pytest.mark.asyncio
async def test_register_send_otp_invalid_mobile(client: AsyncClient):
    r = await client.post("/v1/auth/register/send-otp", json={"mobile": "12345"})
    assert r.status_code == 422


# ── Login send-otp ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_login_send_otp_nonexistent_mobile(clean_client: AsyncClient):
    r = await clean_client.post("/v1/auth/login/send-otp", json={"mobile": "9100000003"})
    assert r.status_code == 404
    assert r.json()["error_code"] == "MOBILE_NOT_REGISTERED"


@pytest.mark.asyncio
async def test_login_send_otp_existing_mobile(clean_client: AsyncClient):
    # Create farmer via register endpoint
    await clean_client.post("/v1/auth/register/send-otp", json={"mobile": "9100000004"})
    # Login must succeed
    r = await clean_client.post("/v1/auth/login/send-otp", json={"mobile": "9100000004"})
    assert r.status_code == 200
    data = r.json()
    assert data["mobile"] == "9100000004"
    assert "otp_debug" in data


@pytest.mark.asyncio
async def test_login_send_otp_invalid_mobile(client: AsyncClient):
    r = await client.post("/v1/auth/login/send-otp", json={"mobile": "99"})
    assert r.status_code == 422


# ── Full register → verify flow ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_verify_otp_flow(clean_client: AsyncClient):
    send_r = await clean_client.post("/v1/auth/register/send-otp", json={"mobile": "9100000005"})
    assert send_r.status_code == 200
    otp = send_r.json().get("otp_debug")
    assert otp, "otp_debug missing — is ENVIRONMENT=development?"

    verify_r = await clean_client.post(
        "/v1/auth/verify-otp", json={"mobile": "9100000005", "otp": otp}
    )
    assert verify_r.status_code == 200
    body = verify_r.json()
    assert body["tokens"]["access_token"]
    assert body["farmer"]["mobile"] == "9100000005"


# ── Full login → verify flow ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_login_verify_otp_flow(clean_client: AsyncClient):
    # Setup: register the mobile first
    await clean_client.post("/v1/auth/register/send-otp", json={"mobile": "9100000006"})

    # Login: sends new OTP (invalidates the registration OTP)
    login_r = await clean_client.post("/v1/auth/login/send-otp", json={"mobile": "9100000006"})
    assert login_r.status_code == 200
    otp = login_r.json().get("otp_debug")
    assert otp, "otp_debug missing — is ENVIRONMENT=development?"

    verify_r = await clean_client.post(
        "/v1/auth/verify-otp", json={"mobile": "9100000006", "otp": otp}
    )
    assert verify_r.status_code == 200
    body = verify_r.json()
    assert body["tokens"]["access_token"]
    assert body["farmer"]["mobile"] == "9100000006"
