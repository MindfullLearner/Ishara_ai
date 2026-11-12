"""Focused auth authorization tests; all data stays in an in-memory SQLite DB."""
import os

# Ensure importing the application cannot initialize an engine from a local or
# live database URL. Requests use the in-memory test engine via dependency override.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ.setdefault("JWT_SECRET_KEY", "test-only-secret-not-for-production")

import pytest
import jwt
from fastapi import Depends, FastAPI, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from main import (
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
    app,
    assert_not_last_active_administrator,
    create_access_token,
    get_current_user,
    get_db,
    require_admin,
)
from models import Base, User
from schemas import SignupRequest


@pytest.fixture
def test_context():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    session = session_factory()

    def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db
    yield session
    app.dependency_overrides.clear()
    session.close()
    engine.dispose()


def add_user(db: Session, *, role="user", status="active") -> User:
    from main import password_hash

    user = User(
        full_name="Test User",
        email=f"{role}-{status}-{db.query(User).count()}@example.com",
        password_hash=password_hash.hash("SecurePass1"),
        role=role,
        status=status,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_active_user_can_login(test_context):
    user = add_user(test_context)
    client = TestClient(app)

    response = client.post(
        "/api/auth/login",
        json={"email": user.email, "password": "SecurePass1"},
    )

    assert response.status_code == 200
    assert response.json()["access_token"]


def test_legacy_null_password_can_login_without_crashing(test_context):
    user = User(
        username="legacy-user",
        full_name="Legacy User",
        email="legacy@example.com",
        sequence_hash="preserve-this-sequence-hash",
        password_hash=None,
        role="user",
        status="active",
        is_verified=False,
    )
    test_context.add(user)
    test_context.commit()

    response = TestClient(app).post(
        "/api/auth/login",
        json={"email": user.email, "password": "any-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


def test_legacy_password_recovery_preserves_sequence_hash(test_context, monkeypatch):
    from main import password_hash
    import main

    user = User(
        username="legacy-reset",
        full_name="Legacy Reset",
        email="legacy-reset@example.com",
        sequence_hash="legacy-sequence-hash",
        password_hash=None,
        role="user",
        status="active",
        is_verified=False,
    )
    test_context.add(user)
    test_context.commit()
    sent = {}
    monkeypatch.setattr(main, "send_password_reset_email", lambda target, token: sent.update(token=token))
    client = TestClient(app)

    response = client.post(
        "/api/auth/forgot-password",
        json={"email": user.email},
    )
    assert response.status_code == 200
    assert sent.get("token")

    response = client.post(
        "/api/auth/reset-password",
        json={"token": sent["token"], "new_password": "NewSecure1"},
    )
    assert response.status_code == 200
    test_context.refresh(user)
    assert password_hash.verify("NewSecure1", user.password_hash)
    assert user.is_verified is True
    assert user.reset_token_hash is None
    assert user.reset_token_expires is None
    assert user.sequence_hash == "legacy-sequence-hash"


def test_signup_creates_active_unverified_user(test_context, monkeypatch):
    import main

    monkeypatch.setattr(main, "send_verification_email", lambda user, token: None)
    response = TestClient(app).post(
        "/api/auth/signup",
        json={
            "full_name": "New Account",
            "email": "new-account@example.com",
            "password": "SecurePass1",
        },
    )
    assert response.status_code == 201
    user = test_context.query(User).filter_by(email="new-account@example.com").one()
    assert user.role == "user"
    assert user.status == "active"
    assert user.is_verified is False
    assert user.password_hash
    assert user.username is None
    assert user.sequence_hash is None
    assert user.failed_login_attempts == 0


def test_suspended_user_cannot_login(test_context):
    user = add_user(test_context, status="suspended")
    client = TestClient(app)

    response = client.post(
        "/api/auth/login",
        json={"email": user.email, "password": "SecurePass1"},
    )

    assert response.status_code == 403


@pytest.mark.parametrize(
    ("account_status", "verified", "expected_detail"),
    [
        ("active", False, "Please verify your email before signing in."),
        ("pending", True, "Your account is pending administrator approval."),
        (
            "suspended",
            True,
            "Your account is suspended. Please contact the administrator.",
        ),
    ],
)
def test_login_distinguishes_unverified_pending_and_suspended_accounts(
    test_context, account_status, verified, expected_detail
):
    user = add_user(test_context, status=account_status)
    user.is_verified = verified
    test_context.commit()

    response = TestClient(app).post(
        "/api/auth/login",
        json={"email": user.email, "password": "SecurePass1"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == expected_detail
    assert "access_token" not in response.json()


def test_existing_token_is_rejected_after_suspension(test_context):
    user = add_user(test_context)
    token = create_access_token(user.id)
    user.status = "suspended"
    test_context.commit()
    client = TestClient(app)

    response = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 401


@pytest.mark.parametrize(
    ("account_status", "verified", "expected_detail"),
    [
        ("active", False, "Email verification required."),
        ("pending", True, "Account is not active."),
        ("suspended", True, "Account is not active."),
    ],
)
def test_unverified_pending_and_suspended_users_cannot_access_apis(
    test_context, account_status, verified, expected_detail
):
    user = add_user(test_context, status=account_status)
    user.is_verified = verified
    test_context.commit()
    token = create_access_token(user.id)

    response = TestClient(app).get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 401
    assert response.json()["detail"] == expected_detail


def test_verified_active_user_can_access_api(test_context):
    user = add_user(test_context, status="active")
    token = create_access_token(user.id)

    response = TestClient(app).get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200


def make_admin_test_app():
    test_app = FastAPI()
    test_app.dependency_overrides[get_db] = app.dependency_overrides[get_db]

    @test_app.get("/api/admin/probe")
    def admin_probe(admin: User = Depends(require_admin)):
        return {"id": admin.id, "role": admin.role}

    return test_app


def test_admin_can_access_admin_route(test_context):
    admin = add_user(test_context, role="admin")
    client = TestClient(make_admin_test_app())
    token = create_access_token(admin.id)

    response = client.get(
        "/api/admin/probe", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert response.json()["role"] == "admin"


def test_pending_admin_cannot_access_admin_route(test_context):
    admin = add_user(test_context, role="admin", status="pending")
    client = TestClient(make_admin_test_app())
    token = create_access_token(admin.id)

    response = client.get(
        "/api/admin/probe", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 401


@pytest.mark.parametrize("account_status", ["pending", "suspended"])
def test_password_reset_does_not_activate_pending_or_suspended_accounts(
    test_context, account_status
):
    from datetime import datetime, timedelta, timezone
    from main import hash_token

    user = User(
        full_name="Legacy Account",
        email=f"legacy-{account_status}@example.com",
        password_hash=None,
        role="admin" if account_status == "pending" else "user",
        status=account_status,
        is_verified=False,
        reset_token_hash=hash_token("one-time-reset-token"),
        reset_token_expires=datetime.now(timezone.utc) + timedelta(minutes=20),
    )
    test_context.add(user)
    test_context.commit()

    response = TestClient(app).post(
        "/api/auth/reset-password",
        json={"token": "one-time-reset-token", "new_password": "NewSecure1"},
    )

    assert response.status_code == 200
    test_context.refresh(user)
    assert user.status == account_status
    assert user.is_verified is True
    assert user.password_hash
    token = create_access_token(user.id)
    api_response = TestClient(app).get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert api_response.status_code == 401


def test_regular_user_is_denied_admin_route(test_context):
    user = add_user(test_context)
    client = TestClient(make_admin_test_app())
    token = create_access_token(user.id)

    response = client.get(
        "/api/admin/probe", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 403


def test_client_supplied_admin_role_claim_is_ignored(test_context):
    user = add_user(test_context)
    forged_role_token = jwt.encode(
        {"sub": str(user.id), "role": "admin"},
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )
    client = TestClient(make_admin_test_app())

    response = client.get(
        "/api/admin/probe",
        headers={"Authorization": f"Bearer {forged_role_token}"},
    )

    assert response.status_code == 403


def test_unauthenticated_admin_request_returns_401(test_context):
    client = TestClient(make_admin_test_app())

    response = client.get("/api/admin/probe")

    assert response.status_code == 401


def admin_headers(user: User):
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


def test_admin_test_and_list_and_get_user(test_context):
    admin = add_user(test_context, role="admin")
    target = add_user(test_context)
    client = TestClient(app)
    headers = admin_headers(admin)

    assert client.get("/api/admin/test", headers=headers).status_code == 200

    listing = client.get("/api/admin/users", headers=headers)
    assert listing.status_code == 200
    assert {item["id"] for item in listing.json()} == {admin.id, target.id}

    detail = client.get(f"/api/admin/users/{target.id}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["email"] == target.email


@pytest.mark.parametrize(
    ("method", "path", "payload"),
    [
        ("get", "/api/admin/test", None),
        ("get", "/api/admin/users", None),
        ("get", "/api/admin/users/999", None),
        (
            "put",
            "/api/admin/users/999",
            {"full_name": "Other User", "email": "other@example.com", "role": "admin", "status": "active"},
        ),
        ("patch", "/api/admin/users/999/status", {"status": "active"}),
        ("delete", "/api/admin/users/999", None),
    ],
)
@pytest.mark.parametrize("authenticated", [False, True], ids=["unauthenticated", "regular-user"])
def test_all_admin_endpoints_reject_non_admins(
    test_context, method, path, payload, authenticated
):
    headers = admin_headers(add_user(test_context)) if authenticated else {}
    response = TestClient(app).request(
        method,
        path,
        json=payload,
        headers=headers,
    )

    assert response.status_code == (403 if authenticated else 401)


def test_admin_can_update_user_and_duplicate_email_conflicts(test_context):
    admin = add_user(test_context, role="admin")
    target = add_user(test_context)
    other = add_user(test_context)
    client = TestClient(app)
    headers = admin_headers(admin)

    response = client.put(
        f"/api/admin/users/{target.id}",
        headers=headers,
        json={
            "full_name": "Updated Person",
            "email": "updated@example.com",
            "role": "admin",
            "status": "active",
        },
    )
    assert response.status_code == 200
    assert response.json()["full_name"] == "Updated Person"
    assert response.json()["role"] == "admin"

    duplicate = client.put(
        f"/api/admin/users/{target.id}",
        headers=headers,
        json={
            "full_name": "Updated Person",
            "email": other.email,
            "role": "user",
            "status": "active",
        },
    )
    assert duplicate.status_code == 409


@pytest.mark.parametrize(
    "payload",
    [
        {"full_name": " ", "email": "valid@example.com", "role": "user", "status": "active"},
        {"full_name": "Valid Name", "email": "invalid", "role": "user", "status": "active"},
        {"full_name": "Valid Name", "email": "valid@example.com", "role": "owner", "status": "active"},
        {"full_name": "Valid Name", "email": "valid@example.com", "role": "user", "status": "deleted"},
    ],
)
def test_update_user_validation_returns_422(test_context, payload):
    admin = add_user(test_context, role="admin")
    target = add_user(test_context)

    response = TestClient(app).put(
        f"/api/admin/users/{target.id}",
        headers=admin_headers(admin),
        json=payload,
    )

    assert response.status_code == 422


def test_status_can_be_suspended_and_reactivated(test_context):
    admin = add_user(test_context, role="admin")
    target = add_user(test_context)
    client = TestClient(app)
    url = f"/api/admin/users/{target.id}/status"

    suspended = client.patch(url, headers=admin_headers(admin), json={"status": "suspended"})
    assert suspended.status_code == 200
    assert suspended.json()["status"] == "suspended"

    active = client.patch(url, headers=admin_headers(admin), json={"status": "active"})
    assert active.status_code == 200
    assert active.json()["status"] == "active"


def test_admin_cannot_remove_or_suspend_self(test_context):
    admin = add_user(test_context, role="admin")
    client = TestClient(app)
    headers = admin_headers(admin)
    own_url = f"/api/admin/users/{admin.id}"

    update = client.put(
        own_url,
        headers=headers,
        json={"full_name": admin.full_name, "email": admin.email, "role": "user", "status": "active"},
    )
    suspend = client.patch(
        f"{own_url}/status", headers=headers, json={"status": "suspended"}
    )
    delete = client.delete(own_url, headers=headers)

    assert update.status_code == 400
    assert suspend.status_code == 400
    assert delete.status_code == 400
    assert test_context.get(User, admin.id).role == "admin"
    assert test_context.get(User, admin.id).status == "active"


def test_last_active_administrator_guard_rejects_direct_removal(test_context):
    admin = add_user(test_context, role="admin")

    with pytest.raises(HTTPException) as error:
        assert_not_last_active_administrator(test_context, admin)

    assert getattr(error.value, "status_code", None) == 400
    assert "last active administrator" in error.value.detail


@pytest.mark.parametrize("operation", ["demote", "suspend", "delete"])
def test_two_active_administrators_can_change_another_admin(test_context, operation):
    actor = add_user(test_context, role="admin")
    target = add_user(test_context, role="admin")
    client = TestClient(app)
    headers = admin_headers(actor)
    target_url = f"/api/admin/users/{target.id}"

    if operation == "demote":
        response = client.put(
            target_url,
            headers=headers,
            json={
                "full_name": target.full_name,
                "email": target.email,
                "role": "user",
                "status": "active",
            },
        )
        assert response.status_code == 200
        assert response.json()["role"] == "user"
    elif operation == "suspend":
        response = client.patch(
            f"{target_url}/status",
            headers=headers,
            json={"status": "suspended"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "suspended"
    else:
        response = client.delete(target_url, headers=headers)
        assert response.status_code == 204
        assert test_context.get(User, target.id) is None

    assert test_context.get(User, actor.id).role == "admin"
    assert test_context.get(User, actor.id).status == "active"


@pytest.mark.parametrize(
    ("method", "suffix", "payload"),
    [
        ("get", "", None),
        ("put", "", {"full_name": "Other User", "email": "other@example.com", "role": "user", "status": "active"}),
        ("patch", "/status", {"status": "suspended"}),
        ("delete", "", None),
    ],
)
def test_admin_user_mutations_return_404_for_missing_ids(test_context, method, suffix, payload):
    admin = add_user(test_context, role="admin")
    client = TestClient(app)
    response = client.request(
        method,
        f"/api/admin/users/999{suffix}",
        headers=admin_headers(admin),
        json=payload,
    )
    assert response.status_code == 404


def test_admin_user_delete_and_invalid_path_id(test_context):
    admin = add_user(test_context, role="admin")
    target = add_user(test_context)
    client = TestClient(app)
    headers = admin_headers(admin)

    assert client.get("/api/admin/users/not-an-id", headers=headers).status_code == 422
    deleted = client.delete(f"/api/admin/users/{target.id}", headers=headers)
    assert deleted.status_code == 204
    assert client.get(f"/api/admin/users/{target.id}", headers=headers).status_code == 404


def test_signup_schema_rejects_client_selected_role():
    with pytest.raises(ValueError):
        SignupRequest(
            full_name="Test User",
            email="new-user@example.com",
            password="SecurePass1",
            role="admin",
        )
