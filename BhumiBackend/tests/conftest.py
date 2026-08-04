from contextlib import contextmanager
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bson import ObjectId
from fastapi.testclient import TestClient

from app.dependencies.auth import get_current_admin
from app.dependencies.services import get_admin_farmer_service
from app.main import app
from app.models.admin_user import AdminUser, AdminRole
from app.services.admin_farmer_service import AdminFarmerService


def _make_admin(role: AdminRole) -> MagicMock:
    admin = MagicMock(spec=AdminUser)
    admin.id = ObjectId("000000000000000000000001")
    admin.role = role
    admin.is_active = True
    return admin


@pytest.fixture
def mock_farmer_service() -> AsyncMock:
    return AsyncMock(spec=AdminFarmerService)


@contextmanager
def _patch_db():
    with (
        patch("app.main.connect_db", new_callable=AsyncMock),
        patch("app.main.disconnect_db", new_callable=AsyncMock),
        patch(
            "app.services.admin_auth_service.AdminAuthService.seed_super_admin",
            new_callable=AsyncMock,
        ),
    ):
        yield


@contextmanager
def _build_client(admin_mock, svc_mock):
    app.dependency_overrides[get_current_admin] = lambda: admin_mock
    app.dependency_overrides[get_admin_farmer_service] = lambda: svc_mock
    try:
        with _patch_db():
            with TestClient(app) as tc:
                yield tc
    finally:
        app.dependency_overrides.pop(get_current_admin, None)
        app.dependency_overrides.pop(get_admin_farmer_service, None)


@pytest.fixture
def client(mock_farmer_service):
    with _build_client(_make_admin(AdminRole.SUPER_ADMIN), mock_farmer_service) as tc:
        yield tc


@pytest.fixture
def operations_client(mock_farmer_service):
    with _build_client(_make_admin(AdminRole.OPERATIONS_ADMIN), mock_farmer_service) as tc:
        yield tc


@pytest.fixture
def finance_client(mock_farmer_service):
    with _build_client(_make_admin(AdminRole.FINANCE_MANAGER), mock_farmer_service) as tc:
        yield tc


@pytest.fixture
def support_client(mock_farmer_service):
    with _build_client(_make_admin(AdminRole.SUPPORT_MANAGER), mock_farmer_service) as tc:
        yield tc


@pytest.fixture
def no_auth_client():
    with _patch_db():
        with TestClient(app) as tc:
            yield tc
