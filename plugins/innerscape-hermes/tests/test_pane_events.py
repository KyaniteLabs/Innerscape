"""The agent-to-Desktop contract sends bounded identifiers, never reflection text."""

import importlib.util
import json
import os
import subprocess
import sys
from types import ModuleType

import pytest

from conftest import PLUGIN_DIR, FakeCtx


@pytest.fixture
def api():
    # Event tests stop at the API boundary; HTTP behavior has its own suite.
    return {"requests": [], "override": {}}


@pytest.fixture
def plugin(hermes_home, runtime, api, monkeypatch):
    spec = importlib.util.spec_from_file_location("innerscape_event_tests", PLUGIN_DIR / "__init__.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod._ctx = FakeCtx()
    monkeypatch.setattr(mod, "_raw_token", lambda: "")
    def offline(*_, **__):
        raise OSError("event tests have no HTTP server")
    monkeypatch.setattr(mod._OPENER, "open", offline)
    def call(method, path, body=None):
        api["requests"].append((method, path, body))
        if path in api["override"]:
            status, data, _ = api["override"][path]
            return {"ok": status < 400, "status": status, "data": data, "error": "refused"}
        data = {
            "/api/v1/checkins": {"id": "ci_1"},
            "/api/v1/journal/entries": {"id": "je_1"},
            "/api/v1/capture": {"id": "cap_1"},
            "/api/v1/review/daily-summary": {"emotionalCheckIns": 1},
            "/api/v1/context/current": {"checkIn": {"id": "ci_0"}},
        }[path]
        return {"ok": True, "status": 201 if method == "POST" else 200, "data": data}
    monkeypatch.setattr(mod, "_api", call)
    return mod


@pytest.fixture
def bridge(monkeypatch):
    calls = []
    hermes = ModuleType("hermes_cli")
    events = ModuleType("hermes_cli.plugin_events")
    events.broadcast_plugin_event = lambda *args: calls.append(args)
    monkeypatch.setitem(sys.modules, "tui_gateway.server", ModuleType("tui_gateway.server"))
    monkeypatch.setitem(sys.modules, "hermes_cli", hermes)
    monkeypatch.setitem(sys.modules, "hermes_cli.plugin_events", events)
    return events, calls


@pytest.mark.parametrize("surface", ["tool", "slash"])
def test_successful_saves_emit_only_record_ids(plugin, bridge, surface):
    _, calls = bridge
    if surface == "tool":
        assert json.loads(plugin._tool_checkin({"energy": 40, "valence": "neutral", "feeling": "private",
                                              "body_note": "private body", "user_confirmed": True}))["ok"]
        assert json.loads(plugin._tool_journal({"content": "private journal", "tags": ["private tag"],
                                              "user_confirmed": True}))["ok"]
        assert json.loads(plugin._tool_capture({"content": "private inbox", "user_confirmed": True}))["ok"]
    else:
        assert "Saved" in plugin._slash("checkin 40 neutral private")
        assert "Saved" in plugin._slash("journal private journal")
        assert "Parked" in plugin._slash("capture private inbox")
    assert calls == [
        ("innerscape", "checkin.updated", {"id": "ci_1"}),
        ("innerscape", "journal.updated", {"id": "je_1"}),
        ("innerscape", "capture.updated", {"id": "cap_1"}),
    ]


def test_refused_failed_and_unconfirmed_saves_emit_nothing(plugin, bridge, api):
    _, calls = bridge
    assert not json.loads(plugin._tool_checkin({"energy": 101, "valence": "neutral", "user_confirmed": True}))["ok"]
    assert not json.loads(plugin._tool_journal({"content": "private"}))["ok"]
    api["override"]["/api/v1/capture"] = (500, {"error": "refused"}, {})
    assert not json.loads(plugin._tool_capture({"content": "private", "user_confirmed": True}))["ok"]
    api["override"]["/api/v1/journal/entries"] = (201, {}, {})
    assert not json.loads(plugin._tool_journal({"content": "private", "user_confirmed": True}))["ok"]
    assert calls == []


def test_reading_today_does_not_cause_a_refresh_loop(plugin, bridge):
    _, calls = bridge
    assert json.loads(plugin._tool_today())["ok"]
    assert calls == []


@pytest.mark.parametrize("view", ["today", "checkin", "journal", "unstuck"])
def test_registered_show_tool_requests_real_sections_without_server_access(plugin, bridge, api, view):
    _, calls = bridge
    ctx = FakeCtx()
    plugin.register(ctx)
    assert "innerscape_show" in ctx.tools
    tool = ctx.tools["innerscape_show"]
    assert tool["schema"]["parameters"]["properties"]["view"]["enum"] == ["today", "checkin", "journal", "unstuck"]
    result = json.loads(tool["handler"]({"view": view, "item_id": "isc-journal"}))
    assert result["ok"] and view in result["message"]
    assert "open and enabled" in result["message"]
    assert calls == [("innerscape", "view.set", {"view": view, "item_id": "isc-journal"})]
    assert api["requests"] == []


def test_broadcast_in_non_tui_process_does_not_import_real_hermes_gateway():
    source = os.environ.get("HERMES_V023_SOURCE")
    tui_source = os.environ.get("HERMES_V023_TUI_SOURCE", source)
    if not source or not os.path.isfile(os.path.join(source, "hermes_cli", "plugin_events.py")):
        pytest.skip("HERMES_V023_SOURCE must point to the real Hermes source tree")
    if not tui_source or not os.path.isfile(os.path.join(tui_source, "tui_gateway", "server.py")):
        pytest.skip("HERMES_V023_TUI_SOURCE must point to the real Hermes TUI source tree")
    env = dict(os.environ, PYTHONPATH=os.pathsep.join((source, tui_source, os.environ.get("PYTHONPATH", ""))))
    script = r"""
import importlib.util, sys
spec = importlib.util.spec_from_file_location('innerscape_real_hermes_probe', sys.argv[1])
plugin = importlib.util.module_from_spec(spec)
spec.loader.exec_module(plugin)
before = sys.stdout
assert 'tui_gateway.server' not in sys.modules
plugin._broadcast_pane_event('view.set', {'view': 'journal'})
assert sys.stdout is before
assert 'tui_gateway.server' not in sys.modules
"""
    subprocess.run([sys.executable, "-B", "-c", script, str(PLUGIN_DIR / "__init__.py")],
                   check=True, env=env, capture_output=True, text=True)


@pytest.mark.parametrize("args", [None, [], {}, {"view": "inbox"}, {"view": 7}, {"view": {}},
    {"view": "x" * 1000}, {"view": "today", "item_id": ""}, {"view": "today", "item_id": 4},
    {"view": "today", "item_id": "x" * 129}, {"view": "today", "item_id": "../private"},
    {"view": "today", "item_id": "private\ntext"}, {"view": "today", "content": "private"}])
def test_show_rejects_invalid_inputs_as_tool_errors(plugin, bridge, args):
    _, calls = bridge
    result = json.loads(plugin._tool_show(args))
    assert not result["ok"] and result.get("error")
    assert calls == []


def test_show_omits_optional_item_and_respects_local_surface_gate(plugin, bridge, monkeypatch):
    _, calls = bridge
    result = json.loads(plugin._tool_show({"view": "today"}))
    assert result["ok"]
    assert calls == [("innerscape", "view.set", {"view": "today"})]
    calls.clear()
    monkeypatch.setenv("HERMES_PLATFORM", "telegram")
    assert not json.loads(plugin._tool_show({"view": "today"}))["ok"]
    assert calls == []


@pytest.mark.parametrize("event,payload", [
    ("unknown.updated", {}), ("x" * 129, {}), ("view.set", {"view": "nope"}),
    ("checkin.updated", {"id": "x" * 129}), ("checkin.updated", {"id": "/private/item"}),
    ("journal.updated", {"id": "je_1", "content": "private"}), ("capture.updated", []),
])
def test_event_helper_rejects_unknown_or_unbounded_payloads(plugin, bridge, event, payload):
    _, calls = bridge
    plugin._broadcast_pane_event(event, payload)
    assert calls == []


def test_unsafe_server_id_is_omitted_but_the_page_still_refreshes(plugin, bridge, api):
    _, calls = bridge
    api["override"]["/api/v1/journal/entries"] = (201, {"id": "/private/item"}, {})
    assert json.loads(plugin._tool_journal({"content": "private", "user_confirmed": True}))["ok"]
    assert calls == [("innerscape", "journal.updated", {})]


def test_guarded_import_without_hermes_still_allows_saves_and_show(plugin, monkeypatch):
    monkeypatch.setitem(sys.modules, "hermes_cli", None)
    monkeypatch.setitem(sys.modules, "hermes_cli.plugin_events", None)
    spec = importlib.util.spec_from_file_location("innerscape_without_hermes", PLUGIN_DIR / "__init__.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod._ctx = plugin._ctx
    monkeypatch.setattr(mod, "_api", plugin._api)
    assert json.loads(mod._tool_journal({"content": "private", "user_confirmed": True}))["ok"]
    result = json.loads(mod._tool_show({"view": "journal"}))
    assert result["ok"] and "open and enabled" in result["message"]


def test_broken_bridge_does_not_turn_a_saved_record_into_an_error(plugin, bridge):
    events, _ = bridge
    def broken(*_):
        raise RuntimeError("transport unavailable")
    events.broadcast_plugin_event = broken
    assert json.loads(plugin._tool_capture({"content": "private", "user_confirmed": True}))["ok"]
    assert json.loads(plugin._tool_show({"view": "unstuck"}))["ok"]


def test_today_exposes_the_rendered_latest_record_id(plugin):
    assert plugin.today()["latest_checkin"]["id"] == "ci_0"


def test_status_and_help_explain_the_persons_enable_step(plugin):
    for output in (plugin._slash("status"), plugin._slash("help")):
        assert "Capabilities -> Plugins" in output
        assert "person" in output and "open" in output


def test_desktop_routes_share_the_save_events(plugin, bridge):
    pytest.importorskip("fastapi")
    _, calls = bridge
    spec = importlib.util.spec_from_file_location("innerscape_event_routes", PLUGIN_DIR / "dashboard" / "plugin_api.py")
    routes = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(routes)
    routes._agent = plugin
    assert routes.checkin(routes.CheckIn(energy=50, valence="neutral"))["ok"]
    assert routes.journal(routes.Journal(content="private", confirmed=True))["ok"]
    assert calls == [("innerscape", "checkin.updated", {"id": "ci_1"}),
                     ("innerscape", "journal.updated", {"id": "je_1"})]
