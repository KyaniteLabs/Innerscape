"""Load the Innerscape Hermes plugin against the vendored Hermes v0.21.6 runtime
and a small fake Innerscape API on 127.0.0.1."""

from __future__ import annotations

import base64
import importlib.util
import json
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import pytest

PLUGIN_DIR = Path(__file__).resolve().parents[1]
RUNTIME_DIR = Path(__file__).resolve().parent / "hermes_runtime"
# A synthetic, unsigned token shape; the fake server only compares strings.
TOKEN_BODY = base64.urlsafe_b64encode(json.dumps({"userId": "demo", "exp": int(time.time()) + 3 * 86400}).encode()).decode().rstrip("=")
TOKEN = f"eyJhbGciOiJIUzI1NiJ9.{TOKEN_BODY}.c2lnbmF0dXJl"


class FakeCtx:
    def __init__(self, config=None):
        self.config = dict(config or {})
        self.hooks, self.tools, self.commands, self.skills = {}, {}, {}, {}

    def get_config(self, key, default=None):
        return self.config.get(key, default)

    def register_hook(self, name, fn):
        self.hooks[name] = fn

    def register_tool(self, name, **kw):
        self.tools[name] = kw

    def register_command(self, name, handler, **kw):
        self.commands[name] = handler

    def register_skill(self, name, path, description=""):
        self.skills[name] = (path, description)


def _u16(text):
    return len(text.encode("utf-16-le")) // 2


def _zod_checkin(b):
    """apps/backend/src/routes/emotional.ts checkInSchema, for the fields the plugin sends."""
    ok = (isinstance(b, dict) and type(b.get("energyLevel")) is int and 0 <= b["energyLevel"] <= 100
          and b.get("valence") in ("pleasant", "unpleasant", "neutral") and b.get("source", "manual") in ("manual", "inferred"))
    ok = ok and set(b) <= {"energyLevel", "valence", "feelingLabel", "bodySensationNote", "source"}
    for key, limit in (("feelingLabel", 50), ("bodySensationNote", 500)):
        if ok and key in b:
            ok = isinstance(b[key], str) and _u16(b[key]) <= limit
    return ok


def _zod_journal(b):
    """apps/backend/src/routes/journal.ts createEntrySchema."""
    return (isinstance(b, dict) and isinstance(b.get("content"), str) and 1 <= _u16(b["content"]) <= 10000
            and isinstance(b.get("tags", []), list) and all(isinstance(t, str) for t in b.get("tags", [])))


def _zod_capture(b):
    """apps/backend/src/routes/hub.ts captureSchema."""
    return (isinstance(b, dict) and isinstance(b.get("content"), str) and 1 <= _u16(b["content"]) <= 5000
            and b.get("contentType", "text") in ("text", "voice", "image", "link")
            and isinstance(b.get("source", "app"), str)
            and isinstance(b.get("tags", []), list) and all(isinstance(t, str) for t in b.get("tags", [])))


class FakeInnerscape:
    """Records every request; answers like apps/backend for the routes the plugin uses."""

    def __init__(self):
        self.requests = []
        self.override = {}  # path -> (status, body bytes, headers)
        api = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *a):
                pass

            def _send(self, status, body, headers=None):
                raw = body if isinstance(body, bytes) else json.dumps(body).encode()
                self.send_response(status)
                for k, v in (headers or {}).items():
                    self.send_header(k, v)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(raw)))
                self.end_headers()
                self.wfile.write(raw)

            def _handle(self, method):
                length = int(self.headers.get("Content-Length") or 0)
                body = json.loads(self.rfile.read(length)) if length else None
                api.requests.append({"method": method, "path": self.path, "auth": self.headers.get("Authorization"), "body": body})
                if self.path in api.override:
                    return self._send(*api.override[self.path])
                if self.path == "/health":
                    return self._send(200, {"status": "ok"})
                if self.headers.get("Authorization") != f"Bearer {TOKEN}":
                    return self._send(401, {"error": "Invalid or expired token"})
                if method == "POST" and self.path == "/api/v1/checkins":
                    if not _zod_checkin(body):
                        return self._send(400, {"error": "Validation failed"})
                    return self._send(201, {"id": "ci_1", **body})
                if method == "POST" and self.path == "/api/v1/journal/entries":
                    if not _zod_journal(body):
                        return self._send(400, {"error": "Validation failed"})
                    return self._send(201, {"id": "je_1", **body})
                if method == "POST" and self.path == "/api/v1/capture":
                    if not _zod_capture(body):
                        return self._send(400, {"error": "Validation failed"})
                    return self._send(201, {"id": "cap_1", "classificationStatus": "pending", **body})
                if self.path == "/api/v1/review/daily-summary":
                    return self._send(200, {"date": "2026-11-10T00:00:00.000Z", "emotionalCheckIns": 2, "habitsCompleted": 1,
                                            "tasksCompleted": 0, "itemsCaptured": 3, "journalEntries": 1, "totalActivity": 7})
                if self.path == "/api/v1/context/current":
                    return self._send(200, {
                        "checkIn": {"id": "ci_0", "timestamp": "2026-11-10T09:00:00.000Z", "energyLevel": 22,
                                    "valence": "unpleasant", "feelingLabel": "foggy"},
                        "inferredFactors": {"timeOfDay": "morning", "consecutiveLowEnergyDays": 4},
                        "computedState": "low_energy_unpleasant",
                    })
                return self._send(404, {"error": "not found"})

            def do_GET(self):
                self._handle("GET")

            def do_POST(self):
                self._handle("POST")

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.url = f"http://127.0.0.1:{self.server.server_address[1]}"
        self.thread = threading.Thread(target=self.server.serve_forever, kwargs={"poll_interval": 0.05}, daemon=True)
        self.thread.start()

    def close(self):
        self.server.shutdown()
        self.server.server_close()


@pytest.fixture
def api():
    srv = FakeInnerscape()
    yield srv
    srv.close()


@pytest.fixture
def hermes_home(tmp_path, monkeypatch):
    home = tmp_path / "hermes-home"
    home.mkdir()
    monkeypatch.setenv("HERMES_HOME", str(home))
    for var in ("HERMES_PLATFORM", "HERMES_SESSION_PLATFORM", "HERMES_SESSION_SOURCE", "TERMINAL_CWD",
                "HERMES_CRON_SESSION", "HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy", "NO_PROXY", "no_proxy"):
        monkeypatch.delenv(var, raising=False)
    return home


@pytest.fixture
def runtime(monkeypatch):
    monkeypatch.syspath_prepend(str(RUNTIME_DIR))
    for name in list(sys.modules):
        if name in {"gateway", "agent"} or name.startswith(("gateway.", "agent.")):
            monkeypatch.delitem(sys.modules, name)
    from gateway import session_context

    session_context.reset_session_vars()
    yield session_context
    session_context.reset_session_vars()


@pytest.fixture
def plugin(hermes_home, runtime, api, monkeypatch):
    monkeypatch.setenv("INNERSCAPE_TOKEN", TOKEN)
    name = "innerscape_hermes_plugin"
    sys.modules.pop(name, None)
    spec = importlib.util.spec_from_file_location(name, PLUGIN_DIR / "__init__.py")
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    mod._ctx = FakeCtx({"base_url": api.url})
    yield mod
    sys.modules.pop(name, None)
