"""Backend tests for Control Tower Shipment marketing site - /api/leads endpoint."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Read from frontend/.env fallback
    envp = "/app/frontend/.env"
    if os.path.exists(envp):
        for line in open(envp):
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")


@pytest.fixture
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def test_root(api):
    r = api.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    assert r.json().get("message") == "Hello World"


def test_create_lead_valid(api):
    payload = {
        "name": "TEST User",
        "email": "test_lead@example.com",
        "company": "TEST Co",
        "role": "Ops",
        "shipment_volume": "100/mo",
        "message": "hello",
    }
    r = api.post(f"{BASE_URL}/api/leads", json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "success"
    assert isinstance(body["id"], str) and len(body["id"]) > 0
    assert "emailed" in body
    assert isinstance(body["emailed"], bool)


def test_create_lead_minimal(api):
    r = api.post(f"{BASE_URL}/api/leads", json={
        "name": "TEST Min", "email": "min@example.com", "company": "TESTMin"
    })
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "success"


def test_lead_invalid_email(api):
    r = api.post(f"{BASE_URL}/api/leads", json={
        "name": "x", "email": "not-an-email", "company": "c"
    })
    assert r.status_code == 422


def test_lead_missing_required(api):
    r = api.post(f"{BASE_URL}/api/leads", json={"email": "a@b.com"})
    assert r.status_code == 422


def test_status_check_flow(api):
    r = api.post(f"{BASE_URL}/api/status", json={"client_name": "TEST_client"})
    assert r.status_code == 200
    got = api.get(f"{BASE_URL}/api/status")
    assert got.status_code == 200
    assert any(c["client_name"] == "TEST_client" for c in got.json())
