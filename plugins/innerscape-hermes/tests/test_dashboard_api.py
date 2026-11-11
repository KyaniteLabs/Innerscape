"""The Desktop page's backend routes (dashboard/plugin_api.py) against the fake Innerscape API."""

from __future__ import annotations

import importlib.util
import json
from datetime import datetime
from pathlib import Path

import pytest

fastapi = pytest.importorskip("fastapi")
from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

DASH = Path(__file__).resolve().parents[1] / "dashboard"


@pytest.fixture
def dash(plugin):
    spec = importlib.util.spec_from_file_location("innerscape_dashboard_api", DASH / "plugin_api.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod._agent = plugin  # the fixture's agent half, pointed at the fake server
    app = FastAPI()
    app.include_router(mod.router, prefix="/api/plugins/innerscape")
    return TestClient(app)


def test_manifest_hides_the_tab_and_names_the_api():
    m = json.loads((DASH / "manifest.json").read_text())
    assert m["name"] == "innerscape" and m["tab"] == {"hidden": True} and m["api"] == "plugin_api.py"


def test_agent_half_loads_by_path():
    spec = importlib.util.spec_from_file_location("innerscape_dashboard_api_load", DASH / "plugin_api.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    agent = mod._agent_half()
    assert agent.VALENCES == ("pleasant", "unpleasant", "neutral")


def test_status_reports_server_and_token(dash):
    r = dash.get("/api/plugins/innerscape/status").json()
    assert r["server"] == "up" and r["token_set"] is True and r["ok"] is True


def test_today_has_counts_and_the_users_words_only(dash):
    r = dash.get("/api/plugins/innerscape/today").json()
    assert r["counts"]["emotionalCheckIns"] == 2
    assert r["latest_checkin"] == {"at": "2026-11-10T09:00:00.000Z", "at_local": datetime.fromisoformat("2026-11-10T09:00:00+00:00").astimezone().strftime("%Y-%m-%d %H:%M"), "is_today": False,
                                   "energy": 22, "valence": "unpleasant", "feeling": "foggy"}
    assert "reading" not in r and "computedState" not in json.dumps(r)


def test_checkin_saves_what_the_form_sent(dash, api):
    r = dash.post("/api/plugins/innerscape/checkin", json={"energy": 64, "valence": "neutral", "feeling": "steady", "body_note": None})
    assert r.status_code == 200 and r.json()["ok"] is True and "reading" not in r.json()
    sent = [q for q in api.requests if q["path"] == "/api/v1/checkins"][-1]["body"]
    assert sent == {"energyLevel": 64, "valence": "neutral", "source": "manual", "feelingLabel": "steady"}


@pytest.mark.parametrize("body", [
    {"energy": 101, "valence": "neutral"},
    {"energy": 50, "valence": "great"},
    {"energy": 50, "valence": "neutral", "feeling": "x" * 51},
    {"energy": 50, "valence": "neutral", "body_note": "x" * 501},
])
def test_checkin_rejects_bad_input_before_any_request(dash, api, body):
    assert dash.post("/api/plugins/innerscape/checkin", json=body).status_code == 422
    assert not any(q["path"] == "/api/v1/checkins" for q in api.requests)


def test_journal_needs_the_dialogs_confirmation(dash, api):
    r = dash.post("/api/plugins/innerscape/journal", json={"content": "a quiet morning", "tags": []})
    assert r.status_code == 422
    assert not any(q["path"] == "/api/v1/journal/entries" for q in api.requests)


def test_journal_saves_the_exact_text_once_confirmed(dash, api):
    text = "  a quiet morning\nthen rain  "
    r = dash.post("/api/plugins/innerscape/journal", json={"content": text, "tags": ["rain", "rain"], "confirmed": True})
    assert r.status_code == 200 and r.json()["ok"] is True
    sent = [q for q in api.requests if q["path"] == "/api/v1/journal/entries"][-1]["body"]
    assert sent == {"content": text, "tags": ["rain"]}


def test_refused_token_comes_back_as_a_readable_error(dash, api, monkeypatch):
    monkeypatch.setenv("INNERSCAPE_TOKEN", "wrong.token.value")
    r = dash.post("/api/plugins/innerscape/checkin", json={"energy": 40, "valence": "pleasant"}).json()
    assert r["ok"] is False and "expired or wrong" in r["error"] and "wrong.token.value" not in r["error"]
