"""Innerscape for Hermes: gentle check-ins and journaling from the agent.

Surfaces:
  innerscape_checkin  -> save one mood check-in (energy 0-100 plus pleasant/unpleasant/neutral)
  innerscape_journal  -> save one journal entry, only after the user said yes to those words
  innerscape_today    -> today's counts and the latest check-in, as the user logged them
  innerscape_capture  -> park one item in the Innerscape inbox, only after the user said yes
  /innerscape         -> today | checkin | journal | capture | status | help
  skills              -> skills/innerscape/SKILL.md (check-ins and journal)
                         skills/unstuck/SKILL.md (the Unstuck Coach)

Everything goes through your own Innerscape server's REST API (default
http://127.0.0.1:3001) with the token in INNERSCAPE_TOKEN. Standard library only.
The plugin never scores, labels or diagnoses a mood, never writes on a schedule,
and keeps no copy of what it sends.
"""

from __future__ import annotations

import base64
import http.client
import ipaddress
import json
import logging
import math
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

PLUGIN_NAME = "innerscape"
TOKEN_ENV = "INNERSCAPE_TOKEN"
RESPONSE_MAX = 1024 * 1024
TOOL_JSON_MAX = 12_000
JOURNAL_MAX = 10_000
CAPTURE_MAX = 5_000
FEELING_MAX = 50
BODY_NOTE_MAX = 500
TAG_MAX = 40
TAGS_MAX = 10
VALENCES = ("pleasant", "unpleasant", "neutral")

DEFAULTS: Dict[str, Any] = {
    "base_url": "http://127.0.0.1:3001",
    "allow_reads_on_gateway": False,
    "allow_writes_on_gateway": False,
    "timeout_seconds": 10,
}

# Mirrors gateway.session_context.NON_MESSAGING_SESSION_SURFACES.
_NON_MESSAGING = frozenset({
    "", "api_server", "cli", "codex", "desktop", "gateway", "kanban", "local",
    "msgraph_webhook", "tool", "tui", "webhook",
})

_REFRESH = (
    "Tokens last 7 days by default. Get a fresh one by running "
    "`curl -s -X POST <base_url>/api/v1/auth/login -H 'content-type: application/json' -d @- | jq -r .token`, "
    "typing {\"email\":\"you@example.com\",\"password\":\"...\"} and pressing Ctrl-D "
    "(the password stays out of your shell history), then put the printed token "
    f"in {TOKEN_ENV} (for example in ~/.hermes/.env) and restart Hermes."
)

_CRISIS = (
    "If the user mentions self-harm, suicide or being in danger, stop, save nothing, and point them "
    "to local emergency services or a crisis line (in the US, call or text 988)."
)

_ctx = None


# --- config ------------------------------------------------------------------------

def _settings_from_config() -> Dict[str, Any]:
    try:
        from hermes_cli.config import load_config

        entries = ((load_config() or {}).get("plugins") or {}).get("entries") or {}
        settings = (entries.get(PLUGIN_NAME) or {}).get("settings") or {}
        return settings if isinstance(settings, dict) else {}
    except Exception:
        return {}


def _cfg(key: str) -> Any:
    try:
        val = _ctx.get_config(key, None) if _ctx is not None else _settings_from_config().get(key)
    except Exception:
        val = None
    return DEFAULTS[key] if val is None else val


def _timeout() -> float:
    try:
        val = float(_cfg("timeout_seconds"))
    except (TypeError, ValueError):
        val = float(DEFAULTS["timeout_seconds"])
    return max(2.0, min(60.0, val))


def _is_loopback(host: str) -> bool:
    if host == "localhost":
        return True
    try:
        return ipaddress.ip_address(host.strip("[]")).is_loopback
    except ValueError:
        return False


def _base_url() -> str:
    """The server URL, refused unless it is https or plain http to this machine.

    The token is a bearer credential, so it never crosses a network in clear text."""
    raw = str(_cfg("base_url") or "").strip().rstrip("/")
    parts = urllib.parse.urlsplit(raw)
    if parts.scheme not in ("http", "https") or not parts.hostname:
        raise ValueError("base_url must look like http://127.0.0.1:3001 or https://innerscape.example")
    if parts.username or parts.password or parts.query or parts.fragment:
        raise ValueError("base_url must not carry credentials, a query or a fragment")
    if parts.scheme == "http" and not _is_loopback(parts.hostname):
        raise ValueError("base_url uses plain http to another machine; use https so the token is not sent in clear text")
    return raw


def _raw_token() -> str:
    try:
        from agent.secret_scope import get_secret

        val = get_secret(TOKEN_ENV)
    except ImportError:
        val = os.environ.get(TOKEN_ENV)
    return str(val or "").strip()


def _token() -> str:
    """The bearer token, refused if it holds whitespace or control characters.

    http.client echoes a bad header value in its error, which would leak the token."""
    tok = _raw_token()
    if tok.lower().startswith("bearer "):
        tok = tok[7:].strip()
    if any(c.isspace() or ord(c) < 32 or ord(c) == 127 for c in tok):
        raise ValueError(f"{TOKEN_ENV} contains spaces or control characters; paste only the token itself")
    return tok


def _token_expiry(tok: str) -> Optional[float]:
    """The `exp` claim of a JWT, read without verifying it (the server verifies)."""
    try:
        payload = tok.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        exp = json.loads(base64.urlsafe_b64decode(payload.encode("ascii"))).get("exp")
        return float(exp) if isinstance(exp, (int, float)) else None
    except Exception:
        return None


def _on_gateway() -> bool:
    """True when this turn arrives over a human messaging surface (fails closed)."""
    try:
        from gateway.session_context import get_session_env
    except ImportError:
        idents = (
            os.environ.get("HERMES_PLATFORM") or os.environ.get("HERMES_SESSION_PLATFORM") or "",
            os.environ.get("HERMES_SESSION_SOURCE") or "",
        )
        explicit = [str(v).strip().lower() for v in idents if str(v).strip()]
        return not explicit or any(v not in _NON_MESSAGING for v in explicit)
    try:
        platform = get_session_env("HERMES_SESSION_PLATFORM", "") or os.environ.get("HERMES_PLATFORM", "")
        idents = (str(v or "").strip().lower() for v in (platform, get_session_env("HERMES_SESSION_SOURCE", "")))
        return any(v and v not in _NON_MESSAGING for v in idents)
    except Exception:
        logger.debug("innerscape: session identity lookup failed; failing closed", exc_info=True)
        return True


def _in_cron() -> bool:
    """True inside a scheduled (cron) run, where nobody is there to say yes (fails closed)."""
    try:
        from gateway.session_context import get_session_env

        return bool(str(get_session_env("HERMES_CRON_SESSION", "") or "").strip())
    except ImportError:
        return bool((os.environ.get("HERMES_CRON_SESSION") or "").strip())
    except Exception:
        return True


def _surface_allowed(key: str, platform: Any = None) -> bool:
    if _cfg(key) is True:
        return True
    if isinstance(platform, str) and platform.strip():
        return platform.strip().lower() in _NON_MESSAGING
    return not _on_gateway()


def _writes_allowed(platform: Any = None) -> bool:
    return not _in_cron() and _surface_allowed("allow_writes_on_gateway", platform)


def _reads_allowed(platform: Any = None) -> bool:
    return _surface_allowed("allow_reads_on_gateway", platform)


_GATEWAY_WRITE_OFF = (
    "Saving to Innerscape is off on chat platforms and in scheduled runs, because a chat can include "
    "other people and a schedule can't say yes. Save it from the Hermes CLI or desktop, or set "
    "allow_writes_on_gateway: true for chat platforms."
)

_GATEWAY_READ_OFF = (
    "Reading Innerscape is off on chat platforms, because a chat can include other people. "
    "Ask from the Hermes CLI or desktop, or set allow_reads_on_gateway: true."
)


# --- HTTP --------------------------------------------------------------------------

class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """A redirect could carry the token to another host, so none are followed."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: D401
        return None


# No proxy handler: an HTTP(S)_PROXY in the environment must not receive the token.
_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}), _NoRedirect)


def _scrub(text: str, tok: str) -> str:
    return text.replace(tok, "[token]") if tok else text


_MAYBE_SAVED = " It may already be saved; check Innerscape before trying again."


def _read_bounded(fp: Any, deadline: float) -> bytes:
    """Read at most RESPONSE_MAX + 1 bytes, giving up at the deadline even if bytes keep trickling in."""
    read = getattr(fp, "read1", None) or fp.read
    chunks: List[bytes] = []
    total = 0
    while total <= RESPONSE_MAX:
        if time.monotonic() > deadline:
            raise TimeoutError("timed out")
        chunk = read(64 * 1024)
        if not chunk:
            break
        chunks.append(chunk)
        total += len(chunk)
    return b"".join(chunks)


def _api(method: str, path: str, body: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Call the Innerscape API. Returns {"ok": True, "data": ...} or {"ok": False, "error": ...}."""
    base = _base_url()
    tok = _token()
    if not tok:
        return {"ok": False, "error": f"{TOKEN_ENV} is not set. {_REFRESH}"}
    data = json.dumps(body, allow_nan=False).encode("utf-8") if body is not None else None
    req = urllib.request.Request(base + path, data=data, method=method)
    req.add_header("Authorization", f"Bearer {tok}")
    req.add_header("Accept", "application/json")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    deadline = time.monotonic() + _timeout()
    try:
        with _OPENER.open(req, timeout=_timeout()) as resp:
            raw = _read_bounded(resp, deadline)
            status = resp.status
    except urllib.error.HTTPError as exc:
        status = exc.code
        try:
            raw = _read_bounded(exc, deadline)
        except Exception:
            raw = b""
    except (urllib.error.URLError, OSError) as exc:
        reason = getattr(exc, "reason", exc)
        msg = f"could not reach Innerscape at {base} ({reason}); is the server running?"
        if method == "POST" and isinstance(reason, (TimeoutError, OSError)) and "timed out" in str(reason).lower():
            msg = f"Innerscape at {base} did not answer in time." + _MAYBE_SAVED
        return {"ok": False, "error": _scrub(msg, tok)}
    except (http.client.HTTPException, ValueError) as exc:
        msg = f"Innerscape at {base} sent a broken reply ({type(exc).__name__})."
        return {"ok": False, "error": _scrub(msg + (_MAYBE_SAVED if method == "POST" else ""), tok)}
    if len(raw) > RESPONSE_MAX:
        return {"ok": False, "error": "Innerscape sent more than 1 MB; refusing to read it"}
    try:
        parsed = json.loads(raw.decode("utf-8")) if raw else None
    except (UnicodeDecodeError, json.JSONDecodeError):
        parsed = None
    if status == 401:
        return {"ok": False, "error": f"Innerscape refused the token (expired or wrong). {_REFRESH}"}
    if 300 <= status < 400:
        return {"ok": False, "error": f"Innerscape answered with a redirect ({status}); point base_url at the API server itself"}
    if status >= 400:
        detail = parsed.get("error") if isinstance(parsed, dict) else None
        if not isinstance(detail, str):
            detail = json.dumps(detail) if detail else f"HTTP {status}"
        return {"ok": False, "error": f"Innerscape said no ({status}): {_scrub(detail, tok)[:300]}"}
    return {"ok": True, "status": status, "data": parsed}


def _saved_id(res: Dict[str, Any]) -> Dict[str, Any]:
    """A save counts only when the server answers 200/201 with a record that has an id."""
    data = res.get("data")
    if res.get("status") in (200, 201) and isinstance(data, dict) and isinstance(data.get("id"), str) and data["id"]:
        return {"ok": True, "id": data["id"]}
    return {"ok": False, "error": "Innerscape did not confirm the save (no saved record came back)." + _MAYBE_SAVED}


# --- operations ----------------------------------------------------------------------

def _units(text: str) -> int:
    """Length the way the server's Zod .max() counts it: UTF-16 code units."""
    return len(text.encode("utf-16-le")) // 2


def _clean_text(value: Any, name: str, limit: int, required: bool = False, strip: bool = True) -> Optional[str]:
    if value is None or (isinstance(value, str) and not value.strip()):
        if required:
            raise ValueError(f"{name} is required")
        return None
    if not isinstance(value, str):
        raise ValueError(f"{name} must be text")
    if strip:
        value = value.strip()
    if "\x00" in value:
        raise ValueError(f"{name} contains a NUL byte")
    if _units(value) > limit:
        raise ValueError(f"{name} is {_units(value)} characters; the limit is {limit}")
    return value


def checkin(energy: Any = None, valence: Any = None, feeling: Any = None, body_note: Any = None,
            user_confirmed: Any = False) -> Dict[str, Any]:
    if user_confirmed is not True:
        raise ValueError(
            "not saved: a check-in becomes a lasting record, so save it only when the user asked you to "
            "log it or said yes; call again with user_confirmed: true then"
        )
    if (isinstance(energy, bool) or not isinstance(energy, (int, float))
            or (isinstance(energy, float) and not math.isfinite(energy)) or energy != int(energy)):
        raise ValueError("energy must be a whole number from 0 to 100")
    energy = int(energy)
    if not 0 <= energy <= 100:
        raise ValueError("energy must be a whole number from 0 to 100")
    if not isinstance(valence, str) or valence.strip().lower() not in VALENCES:
        raise ValueError("valence must be pleasant, unpleasant or neutral")
    body: Dict[str, Any] = {"energyLevel": energy, "valence": valence.strip().lower(), "source": "manual"}
    label = _clean_text(feeling, "feeling", FEELING_MAX)
    note = _clean_text(body_note, "body_note", BODY_NOTE_MAX)
    if label:
        body["feelingLabel"] = label
    if note:
        body["bodySensationNote"] = note
    res = _api("POST", "/api/v1/checkins", body)
    if not res["ok"]:
        return res
    saved = _saved_id(res)
    if not saved["ok"]:
        return saved
    return {
        "ok": True,
        "saved": "check-in",
        "id": saved["id"],
        "energy": energy,
        "valence": body["valence"],
        "feeling": label,
        "reading": "Saved as the user said it. Reflect it back without labelling or judging it. " + _CRISIS,
    }


def _clean_tags(tags: Any) -> List[str]:
    clean_tags: List[str] = []
    if tags is not None:
        if not isinstance(tags, list) or len(tags) > TAGS_MAX:
            raise ValueError(f"tags must be a list of up to {TAGS_MAX} short words")
        for t in tags:
            t = _clean_text(t, "tag", TAG_MAX)
            if t and t not in clean_tags:
                clean_tags.append(t)
    return clean_tags


def journal(content: Any = None, tags: Any = None, user_confirmed: Any = False) -> Dict[str, Any]:
    if user_confirmed is not True:
        raise ValueError(
            "not saved: show the user the exact entry and ask whether to save it to Innerscape; "
            "call again with user_confirmed: true only after they say yes"
        )
    text = _clean_text(content, "content", JOURNAL_MAX, required=True, strip=False)
    clean_tags = _clean_tags(tags)
    res = _api("POST", "/api/v1/journal/entries", {"content": text, "tags": clean_tags})
    if not res["ok"]:
        return res
    saved = _saved_id(res)
    if not saved["ok"]:
        return saved
    return {"ok": True, "saved": "journal entry", "id": saved["id"], "characters": len(text or ""), "tags": clean_tags,
            "reading": _CRISIS}


def capture(content: Any = None, tags: Any = None, user_confirmed: Any = False) -> Dict[str, Any]:
    """Park one item in the Innerscape inbox (POST /api/v1/capture), as text."""
    if user_confirmed is not True:
        raise ValueError(
            "not saved: show the user the exact words and ask whether to park them in Innerscape; "
            "call again with user_confirmed: true only after they say yes"
        )
    text = _clean_text(content, "content", CAPTURE_MAX, required=True, strip=False)
    clean_tags = _clean_tags(tags)
    res = _api("POST", "/api/v1/capture", {"content": text, "contentType": "text", "source": "hermes", "tags": clean_tags})
    if not res["ok"]:
        return res
    saved = _saved_id(res)
    if not saved["ok"]:
        return saved
    return {"ok": True, "saved": "inbox item", "id": saved["id"], "characters": len(text or ""), "tags": clean_tags,
            "reading": "Parked. Tell the user it is held in their Innerscape inbox and return to the one next move. " + _CRISIS}


def today() -> Dict[str, Any]:
    summary = _api("GET", "/api/v1/review/daily-summary")
    if not summary["ok"]:
        return summary
    current = _api("GET", "/api/v1/context/current")
    s = summary["data"] if isinstance(summary["data"], dict) else {}
    counts = {
        k: s.get(k) for k in ("emotionalCheckIns", "journalEntries", "habitsCompleted", "tasksCompleted", "itemsCaptured")
        if isinstance(s.get(k), int)
    }
    latest = None
    latest_error = None if current["ok"] else current.get("error")
    latest_note = None
    ci = current["data"].get("checkIn") if current["ok"] and isinstance(current["data"], dict) else None
    if isinstance(ci, dict) and ci.get("source") not in (None, "manual"):
        latest_note = "The latest check-in was not logged by the user (the app inferred it), so it is left out."
        ci = None
    if isinstance(ci, dict):
        # Only what the user logged. The server's derived state labels and low-energy
        # streak are left out on purpose: the agent reflects, it does not classify.
        latest = {
            "at": ci.get("timestamp"),
            "energy": ci.get("energyLevel"),
            "valence": ci.get("valence"),
            "feeling": ci.get("feelingLabel"),
        }
    out: Dict[str, Any] = {
        "ok": True,
        "counts": counts,
        "latest_checkin": latest,
        "reading": (
            "Counts are activity, not a grade. Offer one grounding observation and one small next "
            "step at most; never diagnose or tell the user how they feel. " + _CRISIS
        ),
    }
    if latest_error:
        out["latest_checkin_error"] = latest_error
    if latest_note:
        out["latest_checkin_note"] = latest_note
    return out


def status() -> Dict[str, Any]:
    out: Dict[str, Any] = {
        "ok": True,
        "reads_on_gateway": _cfg("allow_reads_on_gateway") is True,
        "writes_on_gateway": _cfg("allow_writes_on_gateway") is True,
    }
    try:
        tok = _token()
    except ValueError as exc:
        tok, out["ok"], out["token_note"] = "", False, str(exc)
    out["token_set"] = bool(tok) or not out["ok"]
    try:
        out["base_url"] = _base_url()
    except ValueError as exc:
        out["base_url"] = f"invalid: {exc}"
        out["ok"] = False
        return out
    exp = _token_expiry(tok) if tok else None
    if exp is not None:
        left = exp - time.time()
        out["token_expires_in_hours"] = round(left / 3600, 1)
        if left <= 0:
            out["token_note"] = f"The token has expired. {_REFRESH}"
        elif left < 86400:
            out["token_note"] = f"The token expires within a day. {_REFRESH}"
    elif not out["token_set"]:
        out["token_note"] = f"{TOKEN_ENV} is not set. {_REFRESH}"
    try:
        req = urllib.request.Request(out["base_url"] + "/health", method="GET")
        with _OPENER.open(req, timeout=min(_timeout(), 5.0)) as resp:
            out["server"] = "up" if resp.status == 200 else f"HTTP {resp.status}"
    except Exception as exc:
        out["server"] = f"unreachable ({type(exc).__name__})"
    return out


# --- tools ---------------------------------------------------------------------------

CHECKIN_SCHEMA = {
    "name": "innerscape_checkin",
    "description": (
        "Save one mood check-in to the user's Innerscape, in their words: energy 0-100 and whether "
        "it feels pleasant, unpleasant or neutral, plus an optional feeling word and body note. "
        "Only log what the user told you about themselves; never infer or estimate it. Save only when "
        "the user asked you to log it or said yes, and then set user_confirmed. " + _CRISIS
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "energy": {"type": "integer", "minimum": 0, "maximum": 100, "description": "The user's own energy rating: 0 is empty, 50 is steady, 100 is fully charged."},
            "valence": {"type": "string", "enum": list(VALENCES), "description": "How it feels, as the user put it."},
            "feeling": {"type": "string", "maxLength": FEELING_MAX, "description": "Optional word the user chose, like 'restless'."},
            "body_note": {"type": "string", "maxLength": BODY_NOTE_MAX, "description": "Optional note on body sensations, in the user's words."},
            "user_confirmed": {"type": "boolean", "description": "True only when the user asked to log this or said yes to saving it."},
        },
        "required": ["energy", "valence", "user_confirmed"],
        "additionalProperties": False,
    },
}

JOURNAL_SCHEMA = {
    "name": "innerscape_journal",
    "description": (
        "Save one journal entry to the user's Innerscape. Show the user the exact text and any tags "
        "first and ask whether to save them; set user_confirmed only after they say yes. Never save on your "
        "own initiative or on a schedule. " + _CRISIS
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "content": {"type": "string", "maxLength": JOURNAL_MAX, "description": "The entry, exactly as the user approved it; it is saved unchanged."},
            "tags": {"type": "array", "items": {"type": "string", "maxLength": TAG_MAX}, "maxItems": TAGS_MAX,
                     "description": "Optional short words the user chose, like 'walk' or 'work'."},
            "user_confirmed": {"type": "boolean", "description": "True only after the user said yes to saving this exact text and these tags."},
        },
        "required": ["content", "user_confirmed"],
        "additionalProperties": False,
    },
}

CAPTURE_SCHEMA = {
    "name": "innerscape_capture",
    "description": (
        "Park one item in the user's Innerscape inbox: a task they are setting down, an 'idea:', or a "
        "note for coming back later. Show the user the exact words first and ask whether to park them; "
        "set user_confirmed only after they say yes. Never capture on your own initiative or on a schedule. "
        + _CRISIS
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "content": {"type": "string", "maxLength": CAPTURE_MAX, "description": "The item, exactly as the user approved it; it is saved unchanged."},
            "tags": {"type": "array", "items": {"type": "string", "maxLength": TAG_MAX}, "maxItems": TAGS_MAX,
                     "description": "Optional short words the user chose, like 'bills' or 'later'."},
            "user_confirmed": {"type": "boolean", "description": "True only after the user said yes to parking these exact words."},
        },
        "required": ["content", "user_confirmed"],
        "additionalProperties": False,
    },
}

TODAY_SCHEMA = {
    "name": "innerscape_today",
    "description": (
        "Read today's Innerscape activity counts and the latest check-in as the user logged it. "
        "Use it to ground a gentle reflection; it is not a score."
    ),
    "parameters": {"type": "object", "properties": {}, "additionalProperties": False},
}


def _known(args: Dict[str, Any], allowed: set) -> Dict[str, Any]:
    extra = sorted(set(args) - allowed)
    if extra:
        raise ValueError(f"unknown argument(s): {', '.join(extra)}")
    return args


def _wrap(fn, writes: bool):
    def handler(args: Optional[Dict[str, Any]] = None, **_: Any) -> str:
        try:
            if args is not None and not isinstance(args, dict):
                raise ValueError("arguments must be an object")
            if writes and not _writes_allowed():
                out: Dict[str, Any] = {"ok": False, "error": _GATEWAY_WRITE_OFF}
            elif not writes and not _reads_allowed():
                out = {"ok": False, "error": _GATEWAY_READ_OFF}
            else:
                out = fn(args or {})
        except (ValueError, OverflowError) as exc:
            out = {"ok": False, "error": str(exc)}
        except Exception as exc:  # never crash the agent loop
            logger.debug("innerscape tool failed", exc_info=True)
            out = {"ok": False, "error": f"Innerscape hit an unexpected {type(exc).__name__}; see the Hermes log"}
        raw = json.dumps(out, ensure_ascii=False)
        if len(raw) <= TOOL_JSON_MAX:
            return raw
        return json.dumps({"ok": False, "error": "result was too large to return"})
    return handler


_tool_checkin = _wrap(lambda a: checkin(**_known(a, {"energy", "valence", "feeling", "body_note", "user_confirmed"})), writes=True)
_tool_journal = _wrap(lambda a: journal(**_known(a, {"content", "tags", "user_confirmed"})), writes=True)
_tool_capture = _wrap(lambda a: capture(**_known(a, {"content", "tags", "user_confirmed"})), writes=True)
_tool_today = _wrap(lambda a: today(**_known(a, set())), writes=False)


# --- slash ---------------------------------------------------------------------------

_HELP = (
    "Usage:\n"
    "  /innerscape today                                  Today's counts and latest check-in\n"
    "  /innerscape checkin <0-100> <pleasant|unpleasant|neutral> [feeling]\n"
    "  /innerscape journal <text>                         Save these words as an entry\n"
    "  /innerscape capture <text>                         Park these words in your inbox\n"
    "  /innerscape status                                 Server, token and expiry\n"
    "Reading and saving are off on chat platforms unless allow_reads_on_gateway or\n"
    "allow_writes_on_gateway is true. Saving is always off in scheduled runs."
)


def _fmt_today(res: Dict[str, Any]) -> str:
    if not res.get("ok"):
        return f"Innerscape: {res.get('error')}"
    c = res.get("counts") or {}
    names = (("emotionalCheckIns", "check-in", "check-ins"), ("journalEntries", "journal entry", "journal entries"),
             ("habitsCompleted", "habit", "habits"), ("tasksCompleted", "task done", "tasks done"),
             ("itemsCaptured", "captured", "captured"))
    parts = [f"{c[k]} {one if c[k] == 1 else many}" for k, one, many in names if k in c]
    lines = ["Today: " + (", ".join(parts) if parts else "no counts from the server")]
    latest = res.get("latest_checkin")
    if latest:
        feel = f", {latest['feeling']}" if latest.get("feeling") else ""
        when = f" ({str(latest['at'])[:16].replace('T', ' ')} server time)" if latest.get("at") else ""
        lines.append(f"Latest check-in{when}: energy {latest.get('energy')}, {latest.get('valence')}{feel}")
    elif res.get("latest_checkin_note"):
        lines.append(res["latest_checkin_note"])
    elif res.get("latest_checkin_error"):
        lines.append(f"Couldn't read the latest check-in: {res['latest_checkin_error']}")
    elif c.get("emotionalCheckIns"):
        lines.append("No latest check-in came back from the server.")
    else:
        lines.append("No check-ins yet.")
    return "\n".join(lines)


def _fmt_status(s: Dict[str, Any]) -> str:
    lines = [f"Innerscape at {s.get('base_url')}: server {s.get('server', 'not checked')}",
             f"  token: {'set' if s.get('token_set') else 'not set'}"
             + (f", expires in {s['token_expires_in_hours']} h" if 'token_expires_in_hours' in s else ""),
             f"  reading from chat platforms: {'on' if s.get('reads_on_gateway') else 'off'}",
             f"  saving from chat platforms: {'on' if s.get('writes_on_gateway') else 'off'}"]
    if s.get("token_note"):
        lines.append(s["token_note"])
    return "\n".join(lines)


def _slash(raw_args: str, platform: Any = None, **_: Any) -> str:
    text = (raw_args or "").strip()
    head = text.split(None, 1)
    cmd = head[0].lower() if head else ""
    rest = head[1].strip() if len(head) > 1 else ""
    if cmd in {"", "help", "-h", "--help"}:
        return _HELP
    try:
        if cmd == "today":
            if not _reads_allowed(platform):
                return _GATEWAY_READ_OFF
            return _fmt_today(today())
        if cmd == "status":
            return _fmt_status(status())
        if cmd in {"checkin", "journal", "capture"}:
            if not _writes_allowed(platform):
                return _GATEWAY_WRITE_OFF
            if cmd == "capture":
                if not rest:
                    return "Nothing to park.\n\n" + _HELP
                # Typing the command is the user's own yes to these exact words.
                res = capture(rest, None, True)
                return f"Parked in your Innerscape inbox ({res['characters']} characters)." if res.get("ok") else f"Innerscape: {res.get('error')}"
            if cmd == "journal":
                if not rest:
                    return "Nothing to save.\n\n" + _HELP
                # Typing the command is the user's own yes to these exact words.
                res = journal(rest, None, True)
                return f"Saved a journal entry ({res['characters']} characters)." if res.get("ok") else f"Innerscape: {res.get('error')}"
            parts = rest.split(None, 2)
            if len(parts) < 2 or not re.fullmatch(r"\d{1,3}", parts[0]):
                return "Check-in needs energy and how it feels, like: /innerscape checkin 40 neutral tired"
            # Typing the command is the user's own request to log it.
            res = checkin(int(parts[0]), parts[1], parts[2] if len(parts) > 2 else None, None, True)
            if not res.get("ok"):
                return f"Innerscape: {res.get('error')}"
            feel = f", {res['feeling']}" if res.get("feeling") else ""
            return f"Saved a check-in: energy {res['energy']}, {res['valence']}{feel}."
    except ValueError as exc:
        return f"Innerscape: {exc}"
    except Exception as exc:  # a slash command must never take down the turn
        logger.debug("innerscape slash failed", exc_info=True)
        return f"Innerscape hit an unexpected {type(exc).__name__}; see the Hermes log."
    return f"Unknown subcommand `{cmd}`.\n\n{_HELP}"


# --- register ------------------------------------------------------------------------

def _skill_description(skill_md) -> str:
    try:
        text = skill_md.read_text(encoding="utf-8")
    except OSError:
        return ""
    if not text.startswith("---"):
        return ""
    for line in text.split("---", 2)[1].splitlines():
        if line.startswith("description:"):
            return line.split(":", 1)[1].strip().strip("'\"")
    return ""


def register(ctx) -> None:
    global _ctx
    _ctx = ctx
    ctx.register_command(
        "innerscape",
        handler=_slash,
        description="Innerscape check-ins, journal and inbox (today, checkin, journal, capture, status).",
        args_hint="today | checkin <0-100> <pleasant|unpleasant|neutral> [feeling] | journal <text> | capture <text> | status",
    )
    for schema, handler, emoji in (
        (CHECKIN_SCHEMA, _tool_checkin, "🪨"),
        (JOURNAL_SCHEMA, _tool_journal, "📓"),
        (TODAY_SCHEMA, _tool_today, "🌤"),
        (CAPTURE_SCHEMA, _tool_capture, "📥"),
    ):
        ctx.register_tool(
            name=schema["name"],
            toolset=PLUGIN_NAME,
            schema=schema,
            handler=handler,
            description=schema["description"],
            emoji=emoji,
        )
    from pathlib import Path

    skills_dir = Path(__file__).parent / "skills"
    if skills_dir.is_dir():
        for child in sorted(skills_dir.iterdir()):
            skill_md = child / "SKILL.md"
            if child.is_dir() and skill_md.exists():
                try:
                    ctx.register_skill(child.name, skill_md, description=_skill_description(skill_md))
                except Exception:
                    logger.warning("innerscape: could not register the %s skill; its guardrails are not loaded",
                                   child.name, exc_info=True)
