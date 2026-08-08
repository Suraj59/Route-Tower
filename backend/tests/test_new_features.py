"""Tests for Route Tower NEW features: normalize-csv, alerts."""
import os
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://control-tower-19.preview.emergentagent.com"


@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestNormalizeCsv:
    def test_normalize_csv_basic(self, api_client):
        csv = "ref,from,to,mode,status\nA1,Osaka,Rotterdam,sea,in transit\nA2,Delhi,Dubai,air,customs hold"
        r = api_client.post(f"{BASE_URL}/api/ai/normalize-csv", json={"csv": csv}, timeout=60)
        assert r.status_code == 200, r.text
        b = r.json()
        assert b["status"] == "success"
        assert b["count"] > 0
        assert isinstance(b["shipments"], list)
        for s in b["shipments"]:
            for k in ("origin", "destination", "mode", "status", "eta", "stops", "id"):
                assert k in s, f"missing {k}"
            assert str(s["id"]).startswith("CT-")
            assert isinstance(s["stops"], list) and len(s["stops"]) >= 2
            for st in s["stops"]:
                assert isinstance(st.get("lat"), (int, float))
                assert isinstance(st.get("lng"), (int, float))


class TestAlerts:
    def test_alerts_flags_risky(self, api_client):
        shipments = [
            {"id": "CT-1", "status": "delayed", "mode": "Ocean", "origin": "Shenzhen", "destination": "Hamburg", "eta": "Aug 24, 2026", "current": "Held at Rotterdam customs", "carrier": "Maersk"},
            {"id": "CT-2", "status": "held", "mode": "Air", "origin": "Delhi", "destination": "Dubai", "eta": "Aug 20, 2026", "current": "Customs hold", "carrier": "Emirates"},
            {"id": "CT-3", "status": "in_transit", "mode": "Road", "origin": "Chicago", "destination": "Toronto", "eta": "Sep 15, 2026", "current": "On highway", "carrier": "XPO"},
            {"id": "CT-4", "status": "delivered", "mode": "Air", "origin": "SFO", "destination": "LHR", "eta": "Aug 01, 2026", "current": "Delivered", "carrier": "United"},
        ]
        r = api_client.post(f"{BASE_URL}/api/ai/alerts", json={"shipments": shipments}, timeout=60)
        assert r.status_code == 200, r.text
        b = r.json()
        assert b["status"] == "success"
        assert isinstance(b["alerts"], list)
        # delivered should be excluded
        ids = [a["id"] for a in b["alerts"]]
        assert "CT-4" not in ids
        # at least one at-risk found
        assert len(b["alerts"]) >= 1
        for a in b["alerts"]:
            assert a["risk"] in ("high", "medium")
            assert isinstance(a.get("probability"), int)
            assert 0 <= a["probability"] <= 100
            assert isinstance(a.get("reason"), str) and a["reason"]
            assert isinstance(a.get("action"), str) and a["action"]
