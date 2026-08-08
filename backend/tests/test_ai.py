"""Tests for Route Tower AI endpoints (Gemini 3 Flash via Emergent LLM key)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://control-tower-19.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- AI: create shipment ---
class TestAICreateShipment:
    def test_create_shipment_ocean_shenzhen_hamburg(self, api_client):
        resp = api_client.post(
            f"{BASE_URL}/api/ai/create-shipment",
            json={"prompt": "Electronics Shenzhen to Hamburg by ocean, delayed at customs"},
            timeout=60,
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body.get("status") == "success"
        s = body.get("shipment")
        assert isinstance(s, dict)
        for k in ["mode", "origin", "destination", "carrier", "tracking", "eta", "status", "current", "stops", "id"]:
            assert k in s, f"missing key {k}"
        assert s["mode"] in ["Road", "Ocean", "Air", "Rail", "Multimodal"]
        assert s["status"] in ["in_transit", "delayed", "held", "exception", "delivered"]
        assert isinstance(s["stops"], list)
        assert 3 <= len(s["stops"]) <= 6
        for st in s["stops"]:
            assert isinstance(st.get("city"), str)
            assert isinstance(st.get("country"), str)
            assert isinstance(st.get("lat"), (int, float))
            assert isinstance(st.get("lng"), (int, float))
            assert isinstance(st.get("event"), str)
        assert str(s["id"]).startswith("CT-")


# --- AI: insight ---
class TestAIInsight:
    def test_insight_returns_nonempty(self, api_client):
        shipment = {
            "id": "CT-10245",
            "mode": "Ocean",
            "origin": "Shenzhen",
            "destination": "Hamburg",
            "carrier": "Maersk",
            "tracking": "MAEU1234567",
            "eta": "Aug 24, 2026",
            "status": "delayed",
            "current": "Held at Rotterdam customs",
            "stops": [
                {"city": "Shenzhen", "country": "CN", "lat": 22.5, "lng": 114.0, "event": "PICKED UP"},
                {"city": "Rotterdam", "country": "NL", "lat": 51.9, "lng": 4.5, "event": "CUSTOMS"},
                {"city": "Hamburg", "country": "DE", "lat": 53.55, "lng": 9.99, "event": "DELIVERED"},
            ],
        }
        resp = api_client.post(
            f"{BASE_URL}/api/ai/insight",
            json={"shipment": shipment},
            timeout=60,
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body.get("status") == "success"
        assert isinstance(body.get("insight"), str)
        assert len(body["insight"].strip()) > 20

    def test_insight_with_question(self, api_client):
        shipment = {"id": "CT-10001", "mode": "Air", "origin": "SFO", "destination": "LHR",
                    "carrier": "United Cargo", "tracking": "UA123", "eta": "Aug 20, 2026",
                    "status": "in_transit", "current": "Cruising over Atlantic",
                    "stops": [{"city": "SFO", "country": "US", "lat": 37.6, "lng": -122.3, "event": "PICKED UP"}]}
        resp = api_client.post(
            f"{BASE_URL}/api/ai/insight",
            json={"shipment": shipment, "question": "What's the risk of delay?"},
            timeout=60,
        )
        assert resp.status_code == 200
        assert len(resp.json().get("insight", "")) > 10


# --- Regression: /api/leads still works ---
class TestLeadsRegression:
    def test_create_lead(self, api_client):
        resp = api_client.post(
            f"{BASE_URL}/api/leads",
            json={"name": "TEST_AIRegression", "email": "test_ai_reg@example.com", "company": "TestCo"},
            timeout=30,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body.get("status") == "success"
        assert "id" in body
