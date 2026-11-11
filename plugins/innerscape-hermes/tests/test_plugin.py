"""Behaviour of the Innerscape Hermes plugin against a fake Innerscape API."""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

from conftest import TOKEN, FakeCtx, FakeInnerscape

PLUGIN_DIR = Path(__file__).resolve().parents[1]
REPO_SKILL = PLUGIN_DIR.parents[1] / "skills" / "innerscape" / "SKILL.md"


def call(plugin, tool, args):
    return json.loads(getattr(plugin, tool)(args))


# --- registration and manifest ---------------------------------------------------

def test_register_exposes_four_tools_one_command_and_both_skills(plugin):
    ctx = FakeCtx()
    plugin.register(ctx)
    assert set(ctx.tools) == {"innerscape_checkin", "innerscape_journal", "innerscape_today", "innerscape_capture"}
    assert set(ctx.commands) == {"innerscape"}
    assert set(ctx.skills) == {"innerscape", "unstuck"}
    for name in ("innerscape", "unstuck"):
        assert ctx.skills[name][1].startswith("Use when")
    assert ctx.hooks == {}
    for kw in ctx.tools.values():
        assert kw["toolset"] == "innerscape"
        assert kw["schema"]["parameters"]["additionalProperties"] is False


def test_manifest_matches_registration_and_declares_the_token():
    text = (PLUGIN_DIR / "plugin.yaml").read_text(encoding="utf-8")
    tools = re.findall(r"^  - (innerscape_\w+)$", text, re.M)
    assert tools == ["innerscape_checkin", "innerscape_journal", "innerscape_today", "innerscape_capture"]
    assert re.search(r"^requires_env:\n  - name: INNERSCAPE_TOKEN\n(    .*\n)*    secret: true$", text, re.M)
    assert 'requires_hermes: ">=0.21.6"' in text
    for key in ("base_url", "allow_reads_on_gateway", "allow_writes_on_gateway", "timeout_seconds"):
        assert f"\n  {key}:\n" in text


def test_every_tool_description_carries_the_crisis_line(plugin):
    for schema in (plugin.CHECKIN_SCHEMA, plugin.JOURNAL_SCHEMA, plugin.CAPTURE_SCHEMA):
        assert "988" in schema["description"] and "save nothing" in schema["description"]


@pytest.mark.skipif(not REPO_SKILL.exists(), reason="installed copy: the repo skill is not next to the plugin")
def test_skill_carries_every_repo_guardrail_verbatim():
    repo = REPO_SKILL.read_text(encoding="utf-8")
    ours = (PLUGIN_DIR / "skills" / "innerscape" / "SKILL.md").read_text(encoding="utf-8")
    guard = repo.split("## Guardrails", 1)[1]
    lines = [ln.rstrip(".") for ln in guard.splitlines() if ln.startswith("- ")]
    assert len(lines) == 4
    for ln in lines:
        assert ln in ours


# --- check-in ----------------------------------------------------------------------

def test_checkin_posts_the_users_words_with_the_bearer_token(plugin, api):
    out = call(plugin, "_tool_checkin", {"user_confirmed": True, "energy": 30, "valence": "Neutral", "feeling": "flat", "body_note": "tight shoulders"})
    assert out["ok"] and out["id"] == "ci_1" and out["valence"] == "neutral"
    req = api.requests[-1]
    assert req["method"] == "POST" and req["path"] == "/api/v1/checkins"
    assert req["auth"] == f"Bearer {TOKEN}"
    assert req["body"] == {"energyLevel": 30, "valence": "neutral", "source": "manual",
                           "feelingLabel": "flat", "bodySensationNote": "tight shoulders"}


@pytest.mark.parametrize("args, needle", [
    ({"user_confirmed": True, "energy": 101, "valence": "neutral"}, "0 to 100"),
    ({"user_confirmed": True, "energy": -1, "valence": "neutral"}, "0 to 100"),
    ({"user_confirmed": True, "energy": True, "valence": "neutral"}, "whole number"),
    ({"user_confirmed": True, "energy": 3.5, "valence": "neutral"}, "whole number"),
    ({"user_confirmed": True, "energy": "40", "valence": "neutral"}, "whole number"),
    ({"user_confirmed": True, "energy": 40, "valence": "happy"}, "pleasant, unpleasant or neutral"),
    ({"user_confirmed": True, "energy": 40, "valence": "neutral", "feeling": "x" * 51}, "limit is 50"),
    ({"user_confirmed": True, "energy": 40, "valence": "neutral", "mood_score": 3}, "unknown argument"),
])
def test_checkin_refuses_bad_input_before_any_request(plugin, api, args, needle):
    out = call(plugin, "_tool_checkin", args)
    assert not out["ok"] and needle in out["error"]
    assert api.requests == []


# --- journal -----------------------------------------------------------------------

@pytest.mark.parametrize("confirmed", [None, False, "yes", 1])
def test_journal_needs_an_explicit_yes(plugin, api, confirmed):
    args = {"content": "Long day; the walk helped."}
    if confirmed is not None:
        args["user_confirmed"] = confirmed
    out = call(plugin, "_tool_journal", args)
    assert not out["ok"] and "ask whether to save" in out["error"]
    assert api.requests == []


def test_journal_saves_approved_text_and_dedupes_tags(plugin, api):
    out = call(plugin, "_tool_journal", {"content": "  Long day; the walk helped.  ", "tags": ["walk", "walk", "evening"], "user_confirmed": True})
    assert {k: out[k] for k in ("ok", "saved", "id", "characters", "tags")} == {
        "ok": True, "saved": "journal entry", "id": "je_1", "characters": 30, "tags": ["walk", "evening"]}
    assert "988" in out["reading"]
    # The approved text is saved exactly, surrounding spaces included.
    assert api.requests[-1]["body"] == {"content": "  Long day; the walk helped.  ", "tags": ["walk", "evening"]}


def test_journal_refuses_empty_and_oversized_text(plugin, api):
    assert "required" in call(plugin, "_tool_journal", {"content": "  ", "user_confirmed": True})["error"]
    assert "limit is 10000" in call(plugin, "_tool_journal", {"content": "x" * 10_001, "user_confirmed": True})["error"]
    assert api.requests == []


# --- capture (the Unstuck Coach's inbox) ------------------------------------------

@pytest.mark.parametrize("confirmed", [None, False, "yes", 1])
def test_capture_needs_an_explicit_yes(plugin, api, confirmed):
    args = {"content": "pay the water bill"}
    if confirmed is not None:
        args["user_confirmed"] = confirmed
    out = call(plugin, "_tool_capture", args)
    assert not out["ok"] and "ask whether to park" in out["error"]
    assert api.requests == []


def test_capture_parks_the_approved_words_as_text_from_hermes(plugin, api):
    out = call(plugin, "_tool_capture", {"content": "idea: Sunday shutdown list ", "tags": ["later", "later"], "user_confirmed": True})
    assert {k: out[k] for k in ("ok", "saved", "id", "tags")} == {"ok": True, "saved": "inbox item", "id": "cap_1", "tags": ["later"]}
    assert "988" in out["reading"]
    assert api.requests[-1]["path"] == "/api/v1/capture"
    assert api.requests[-1]["body"] == {"content": "idea: Sunday shutdown list ", "contentType": "text", "source": "hermes", "tags": ["later"]}


def test_capture_refuses_empty_oversized_and_unknown_args(plugin, api):
    assert "required" in call(plugin, "_tool_capture", {"content": " ", "user_confirmed": True})["error"]
    assert "limit is 5000" in call(plugin, "_tool_capture", {"content": "x" * 5001, "user_confirmed": True})["error"]
    assert "unknown argument" in call(plugin, "_tool_capture", {"content": "x", "user_confirmed": True, "source": "cron"})["error"]
    assert api.requests == []


def test_slash_capture(plugin, api):
    assert plugin._slash("capture answer the landlord", platform="cli") == "Parked in your Innerscape inbox (19 characters)."
    assert api.requests[-1]["body"]["content"] == "answer the landlord"
    assert "Nothing to park" in plugin._slash("capture", platform="cli")
    assert "off on chat platforms" in plugin._slash("capture my private pile", platform="telegram")


def test_unstuck_skill_keeps_the_coach_inside_its_boundaries():
    text = (PLUGIN_DIR / "skills" / "unstuck" / "SKILL.md").read_text(encoding="utf-8")
    assert text.startswith("---\nname: unstuck\n")
    for must in ("988", "diagnose", "medication", "innerscape_capture", "user_confirmed: true", "Body state outranks planning",
                 "never shown as a menu", "one next move"):
        assert must.lower() in text.lower(), must


# --- today -------------------------------------------------------------------------

def test_today_returns_counts_and_the_logged_checkin_but_no_derived_labels(plugin):
    out = call(plugin, "_tool_today", {})
    assert out["ok"]
    assert out["counts"] == {"emotionalCheckIns": 2, "journalEntries": 1, "habitsCompleted": 1, "tasksCompleted": 0, "itemsCaptured": 3}
    assert out["latest_checkin"] == {"at": "2026-11-10T09:00:00.000Z", "energy": 22, "valence": "unpleasant", "feeling": "foggy"}
    raw = json.dumps(out)
    assert "low_energy_unpleasant" not in raw and "consecutiveLowEnergyDays" not in raw and "totalActivity" not in raw


# --- token, URL and transport safety -----------------------------------------------

def test_missing_token_explains_how_to_get_one(plugin, api, monkeypatch):
    monkeypatch.delenv("INNERSCAPE_TOKEN")
    out = call(plugin, "_tool_today", {})
    assert not out["ok"] and "INNERSCAPE_TOKEN is not set" in out["error"] and "/api/v1/auth/login" in out["error"]
    assert api.requests == []


def test_rejected_token_explains_refresh_and_never_echoes_it(plugin, api, monkeypatch):
    monkeypatch.setenv("INNERSCAPE_TOKEN", "Bearer wrong.token.value")
    out = call(plugin, "_tool_today", {})
    assert not out["ok"] and "expired or wrong" in out["error"] and "7 days" in out["error"]
    assert "wrong.token.value" not in json.dumps(out)
    assert api.requests[-1]["auth"] == "Bearer wrong.token.value"


def test_server_error_text_is_passed_on_with_the_token_scrubbed(plugin, api):
    api.override["/api/v1/review/daily-summary"] = (500, {"error": f"boom {TOKEN}"})
    out = call(plugin, "_tool_today", {})
    assert not out["ok"] and "(500)" in out["error"] and TOKEN not in out["error"] and "[token]" in out["error"]


@pytest.mark.parametrize("url, ok", [
    ("http://127.0.0.1:3001", True),
    ("http://localhost:3001", True),
    ("http://[::1]:3001", True),
    ("https://innerscape.example", True),
    ("http://innerscape.example", False),
    ("http://192.168.1.20:3001", False),
    ("ftp://127.0.0.1", False),
    ("https://user:pw@innerscape.example", False),
    ("https://innerscape.example/?x=1", False),
    ("", False),
])
def test_base_url_allows_https_or_loopback_http_only(plugin, url, ok):
    plugin._ctx = FakeCtx({"base_url": url})
    if ok:
        assert plugin._base_url() == url.rstrip("/")
    else:
        with pytest.raises(ValueError):
            plugin._base_url()


def test_remote_plain_http_is_refused_before_the_token_leaves(plugin, api):
    plugin._ctx = FakeCtx({"base_url": "http://192.0.2.10:3001"})
    out = call(plugin, "_tool_today", {})
    assert not out["ok"] and "clear text" in out["error"]


def test_redirects_are_not_followed(plugin, api):
    other = FakeInnerscape()
    try:
        api.override["/api/v1/review/daily-summary"] = (302, b"", {"Location": other.url + "/api/v1/review/daily-summary"})
        out = call(plugin, "_tool_today", {})
        assert not out["ok"] and "redirect" in out["error"]
        assert other.requests == []
    finally:
        other.close()


def test_oversized_response_is_refused(plugin, api):
    api.override["/api/v1/review/daily-summary"] = (200, b"[" + b"0," * (600 * 1024) + b"0]")
    out = call(plugin, "_tool_today", {})
    assert not out["ok"] and "1 MB" in out["error"]


def test_unreachable_server_says_so(plugin, api):
    url = api.url
    api.close()
    plugin._ctx = FakeCtx({"base_url": url, "timeout_seconds": 2})
    out = call(plugin, "_tool_today", {})
    assert not out["ok"] and "could not reach Innerscape" in out["error"]
    api.close = lambda: None


# --- chat platforms ------------------------------------------------------------------

def test_writes_are_off_on_chat_platforms_by_default(plugin, api, runtime):
    tokens = runtime.set_session_vars(platform="telegram")
    try:
        out = call(plugin, "_tool_checkin", {"user_confirmed": True, "energy": 50, "valence": "pleasant"})
        assert not out["ok"] and "off on chat platforms" in out["error"]
        out = call(plugin, "_tool_journal", {"content": "x", "user_confirmed": True})
        assert not out["ok"] and "off on chat platforms" in out["error"]
        out = call(plugin, "_tool_capture", {"content": "x", "user_confirmed": True})
        assert not out["ok"] and "off on chat platforms" in out["error"]
        out = call(plugin, "_tool_today", {})
        assert not out["ok"] and "Reading Innerscape is off" in out["error"]
        assert api.requests == []
    finally:
        runtime.clear_session_vars(tokens)


def test_writes_on_chat_platforms_when_allowed(plugin, api, runtime):
    plugin._ctx = FakeCtx({"base_url": api.url, "allow_writes_on_gateway": True})
    tokens = runtime.set_session_vars(platform="discord")
    try:
        assert call(plugin, "_tool_checkin", {"user_confirmed": True, "energy": 50, "valence": "pleasant"})["ok"]
    finally:
        runtime.clear_session_vars(tokens)


def test_writes_allowed_in_the_cli(plugin, runtime):
    tokens = runtime.set_session_vars(platform="cli")
    try:
        assert call(plugin, "_tool_checkin", {"user_confirmed": True, "energy": 50, "valence": "pleasant"})["ok"]
    finally:
        runtime.clear_session_vars(tokens)


# --- slash ---------------------------------------------------------------------------

def test_slash_help_and_unknown(plugin):
    assert "Usage" in plugin._slash("")
    assert "Unknown subcommand `rate`" in plugin._slash("rate me")


def test_slash_checkin_and_journal(plugin, api):
    assert plugin._slash("checkin 40 neutral a bit tired", platform="cli") == "Saved a check-in: energy 40, neutral, a bit tired."
    assert api.requests[-1]["body"]["feelingLabel"] == "a bit tired"
    assert plugin._slash("journal The walk helped.", platform="cli") == "Saved a journal entry (16 characters)."
    assert "needs energy" in plugin._slash("checkin tired", platform="cli")
    assert "0 to 100" in plugin._slash("checkin 400 neutral", platform="cli")
    assert "Nothing to save" in plugin._slash("journal", platform="cli")


def test_slash_writes_refused_from_chat_platform(plugin, api):
    assert "off on chat platforms" in plugin._slash("journal secret thoughts", platform="telegram")
    assert api.requests == []


def test_slash_today(plugin):
    out = plugin._slash("today", platform="cli")
    assert out.startswith("Today: 2 check-ins, 1 journal entry, 1 habit, 0 tasks done, 3 captured")
    assert "Latest check-in (2026-11-10 09:00 server time): energy 22, unpleasant, foggy" in out
    assert "Reading Innerscape is off" in plugin._slash("today", platform="telegram")


def test_slash_status_shows_expiry_never_the_token(plugin):
    out = plugin._slash("status", platform="cli")
    assert "server up" in out and "token: set, expires in" in out and "saving from chat platforms: off" in out
    assert TOKEN not in out


def test_status_warns_on_expired_token(plugin, monkeypatch):
    import base64

    body = base64.urlsafe_b64encode(json.dumps({"exp": 1}).encode()).decode().rstrip("=")
    monkeypatch.setenv("INNERSCAPE_TOKEN", f"h.{body}.s")
    s = plugin.status()
    assert s["token_expires_in_hours"] < 0 and "expired" in s["token_note"]


# --- roast fixes ----------------------------------------------------------------------

def test_reads_on_chat_platforms_when_allowed(plugin, api, runtime):
    plugin._ctx = FakeCtx({"base_url": api.url, "allow_reads_on_gateway": True})
    tokens = runtime.set_session_vars(platform="discord")
    try:
        assert call(plugin, "_tool_today", {})["ok"]
        assert not call(plugin, "_tool_checkin", {"user_confirmed": True, "energy": 50, "valence": "pleasant"})["ok"]
    finally:
        runtime.clear_session_vars(tokens)


@pytest.mark.parametrize("value", ["true", "false", "yes", 1])
def test_string_and_number_settings_do_not_turn_chat_access_on(plugin, api, runtime, value):
    plugin._ctx = FakeCtx({"base_url": api.url, "allow_reads_on_gateway": value, "allow_writes_on_gateway": value})
    tokens = runtime.set_session_vars(platform="telegram")
    try:
        assert not call(plugin, "_tool_today", {})["ok"]
        assert not call(plugin, "_tool_checkin", {"user_confirmed": True, "energy": 50, "valence": "pleasant"})["ok"]
        assert api.requests == []
        assert "saving from chat platforms: off" in plugin._slash("status")
    finally:
        runtime.clear_session_vars(tokens)


def test_scheduled_runs_never_save(plugin, api, runtime, monkeypatch):
    plugin._ctx = FakeCtx({"base_url": api.url, "allow_writes_on_gateway": True})
    tokens = runtime.set_session_vars(platform="cli", cron_session="1")
    try:
        for tool, args in (("_tool_checkin", {"user_confirmed": True, "energy": 50, "valence": "pleasant"}),
                           ("_tool_journal", {"content": "x", "user_confirmed": True}),
                           ("_tool_capture", {"content": "x", "user_confirmed": True})):
            out = call(plugin, tool, args)
            assert not out["ok"] and "scheduled runs" in out["error"]
        assert api.requests == []
    finally:
        runtime.clear_session_vars(tokens)
    runtime.reset_session_vars()  # no session scope bound: the legacy env form applies
    monkeypatch.setenv("HERMES_CRON_SESSION", "1")
    assert "scheduled runs" in call(plugin, "_tool_checkin", {"user_confirmed": True, "energy": 50, "valence": "pleasant"})["error"]


def test_gateway_slash_path_as_v0_21_6_calls_it(plugin, api, runtime):
    """gateway/run_inbound.py calls handler(user_args) inside the session scope, with no platform."""
    tokens = runtime.set_session_vars(platform="telegram", source="telegram")
    try:
        assert "off on chat platforms" in plugin._slash("journal secret thoughts")
        assert "Reading Innerscape is off" in plugin._slash("today")
        assert api.requests == []
    finally:
        runtime.clear_session_vars(tokens)


def test_proxy_settings_never_see_the_token(plugin, api, monkeypatch):
    seen = []
    proxy = FakeInnerscape()
    try:
        monkeypatch.setenv("HTTP_PROXY", proxy.url)
        monkeypatch.setenv("http_proxy", proxy.url)
        monkeypatch.setenv("NO_PROXY", "")
        monkeypatch.setenv("no_proxy", "")
        assert call(plugin, "_tool_today", {})["ok"]
        seen = proxy.requests
    finally:
        proxy.close()
    assert seen == [] and api.requests


@pytest.mark.parametrize("bad", [f"{TOKEN}\nX-Evil: 1", f"{TOKEN} trailing", f"{TOKEN}\x7f"])
def test_token_with_whitespace_or_control_characters_is_refused_without_echo(plugin, api, monkeypatch, bad):
    monkeypatch.setenv("INNERSCAPE_TOKEN", bad)
    for out in (call(plugin, "_tool_today", {}), call(plugin, "_tool_checkin", {"user_confirmed": True, "energy": 1, "valence": "neutral"})):
        assert not out["ok"] and "control characters" in out["error"]
        assert TOKEN not in json.dumps(out)
    status = plugin._slash("status", platform="cli")
    assert TOKEN not in status and "control characters" in status
    assert all(r["auth"] is None for r in api.requests)  # only the unauthenticated /health probe


def test_token_is_read_through_hermes_get_secret(plugin, api, monkeypatch):
    import sys
    import types

    calls = []
    agent = types.ModuleType("agent")
    scope = types.ModuleType("agent.secret_scope")
    scope.get_secret = lambda name, default=None: calls.append(name) or TOKEN
    agent.secret_scope = scope
    monkeypatch.setitem(sys.modules, "agent", agent)
    monkeypatch.setitem(sys.modules, "agent.secret_scope", scope)
    monkeypatch.delenv("INNERSCAPE_TOKEN")
    assert call(plugin, "_tool_today", {})["ok"]
    assert calls and set(calls) == {"INNERSCAPE_TOKEN"}


def test_a_broken_status_line_is_an_error_not_a_crash(plugin, api, monkeypatch):
    import http.client

    def boom(*a, **k):
        raise http.client.BadStatusLine(f"junk {TOKEN}")

    monkeypatch.setattr(plugin._OPENER, "open", boom)
    out = call(plugin, "_tool_checkin", {"user_confirmed": True, "energy": 40, "valence": "neutral"})
    assert not out["ok"] and "broken reply" in out["error"] and "may already be saved" in out["error"]
    assert TOKEN not in json.dumps(out)
    assert plugin._slash("today", platform="cli").startswith("Innerscape: ")


def test_unexpected_errors_in_the_slash_command_are_contained(plugin, monkeypatch):
    def boom():
        raise RuntimeError("nope")

    monkeypatch.setattr(plugin, "today", boom)
    assert plugin._slash("today", platform="cli") == "Innerscape hit an unexpected RuntimeError; see the Hermes log."


def test_post_timeout_says_it_may_already_be_saved(plugin, api, monkeypatch):
    def slow(*a, **k):
        raise TimeoutError("timed out")

    monkeypatch.setattr(plugin._OPENER, "open", slow)
    out = call(plugin, "_tool_journal", {"content": "x", "user_confirmed": True})
    assert not out["ok"] and "may already be saved" in out["error"]
    out = call(plugin, "_tool_today", {})
    assert not out["ok"] and "may already be saved" not in out["error"]


@pytest.mark.parametrize("energy", [float("inf"), float("-inf"), float("nan"), 1e400])
def test_non_finite_energy_is_refused(plugin, api, energy):
    out = call(plugin, "_tool_checkin", {"user_confirmed": True, "energy": energy, "valence": "neutral"})
    assert not out["ok"] and "whole number" in out["error"]
    assert api.requests == []


def test_limits_count_utf16_units_like_the_server(plugin, api):
    emoji = "\U0001F600"  # one character, two UTF-16 units
    out = call(plugin, "_tool_checkin", {"user_confirmed": True, "energy": 40, "valence": "neutral", "feeling": emoji * 26})
    assert not out["ok"] and "52 characters; the limit is 50" in out["error"]
    assert api.requests == []
    assert call(plugin, "_tool_checkin", {"user_confirmed": True, "energy": 40, "valence": "neutral", "feeling": emoji * 25})["ok"]


def test_slash_accepts_tabs_and_repeated_spaces(plugin, api):
    assert plugin._slash("  checkin\t40   neutral  calm", platform="cli") == "Saved a check-in: energy 40, neutral, calm."
    assert plugin._slash("TODAY", platform="cli").startswith("Today:")


def test_today_does_not_say_no_check_ins_when_the_latest_read_failed(plugin, api):
    api.override["/api/v1/context/current"] = (500, {"error": "db down"})
    out = plugin._slash("today", platform="cli")
    assert "2 check-ins" in out and "No check-ins yet" not in out
    assert "Couldn't read the latest check-in: Innerscape said no (500): db down" in out


def test_today_with_no_check_ins(plugin, api):
    api.override["/api/v1/review/daily-summary"] = (200, {"emotionalCheckIns": 0, "journalEntries": 0})
    api.override["/api/v1/context/current"] = (200, {"checkIn": None})
    out = plugin._slash("today", platform="cli")
    assert out == "Today: 0 check-ins, 0 journal entries\nNo check-ins yet."


# --- second roast (Sol) -----------------------------------------------------------------

@pytest.mark.parametrize("confirmed", [None, False, "yes", 1])
def test_checkin_needs_the_users_request_or_yes(plugin, api, confirmed):
    args = {"energy": 30, "valence": "neutral"}
    if confirmed is not None:
        args["user_confirmed"] = confirmed
    out = call(plugin, "_tool_checkin", args)
    assert not out["ok"] and "user_confirmed: true" in out["error"]
    assert api.requests == []


@pytest.mark.parametrize("reply", [
    (200, b"<html>proxy login</html>"),
    (200, b""),
    (200, {"error": "not saved"}),
    (204, b""),
    (201, {"id": ""}),
])
def test_a_save_counts_only_with_a_returned_record(plugin, api, reply):
    api.override["/api/v1/journal/entries"] = reply
    out = call(plugin, "_tool_journal", {"content": "x", "user_confirmed": True})
    assert not out["ok"] and "did not confirm the save" in out["error"] and "may already be saved" in out["error"]
    assert "Saved" not in plugin._slash("journal x", platform="cli")


def test_inferred_check_ins_are_not_shown_as_the_users_own(plugin, api):
    api.override["/api/v1/context/current"] = (200, {"checkIn": {"timestamp": "2026-11-10T09:00:00.000Z", "energyLevel": 10,
                                                                  "valence": "unpleasant", "source": "inferred"}})
    out = call(plugin, "_tool_today", {})
    assert out["latest_checkin"] is None and "inferred" in out["latest_checkin_note"]
    assert "not logged by the user" in plugin._slash("today", platform="cli")


def test_task_local_platform_beats_a_process_wide_cli_setting(plugin, api, runtime, monkeypatch):
    monkeypatch.setenv("HERMES_PLATFORM", "cli")
    tokens = runtime.set_session_vars(platform="telegram")
    try:
        out = call(plugin, "_tool_checkin", {"user_confirmed": True, "energy": 50, "valence": "pleasant"})
        assert not out["ok"] and "off on chat platforms" in out["error"]
    finally:
        runtime.clear_session_vars(tokens)


def test_a_long_server_error_is_scrubbed_before_it_is_cut(plugin, api):
    api.override["/api/v1/review/daily-summary"] = (500, {"error": "x" * 280 + TOKEN})
    out = call(plugin, "_tool_today", {})
    assert TOKEN[:20] not in out["error"]


def test_a_trickling_server_hits_the_overall_time_limit(plugin, monkeypatch):
    import time as _time

    class Trickle:
        status = 200

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

        def read1(self, n):
            _time.sleep(0.3)
            return b" "

    monkeypatch.setattr(plugin._OPENER, "open", lambda *a, **k: Trickle())
    plugin._ctx = FakeCtx({"base_url": "http://127.0.0.1:9", "timeout_seconds": 2})
    started = _time.monotonic()
    out = call(plugin, "_tool_today", {})
    assert not out["ok"] and _time.monotonic() - started < 4


def test_a_failed_skill_registration_is_logged_as_a_warning(plugin, caplog):
    class BadCtx(FakeCtx):
        def register_skill(self, *a, **k):
            raise RuntimeError("no skills here")

    with caplog.at_level("WARNING"):
        plugin.register(BadCtx())
    assert "guardrails are not loaded" in caplog.text
