"""Innerscape backend routes, mounted by Hermes at /api/plugins/innerscape/.

They back the Desktop page. Every call goes through the agent half
(``plugins/innerscape-hermes/__init__.py``), loaded by path, so the page and the
agent tools share one client: the same token handling, loopback-only plain http,
no proxies or redirects, and the same limits.

A save from this page is the user's own action: they filled in the form and
pressed Save, and a journal entry is saved only after they confirm the exact
text in a dialog. Nothing here runs on a schedule, and nothing is kept on disk.
"""

# No `from __future__ import annotations`: Hermes imports this file by path without
# registering it in sys.modules, so pydantic must see real types, not strings.
import importlib.util
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()

_PKG_ROOT = Path(__file__).resolve().parents[1]
_agent: Optional[Any] = None


def _agent_half() -> Any:
    """Import the package's own ``__init__.py`` by path (the dashboard loader
    imports this file on its own, so sibling imports don't exist)."""
    global _agent
    if _agent is None:
        spec = importlib.util.spec_from_file_location("innerscape_hermes_agent_half", _PKG_ROOT / "__init__.py")
        if spec is None or spec.loader is None:
            raise RuntimeError("cannot load the Innerscape agent half")
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        _agent = mod
    return _agent


def _call(fn: str, *args: Any, **kwargs: Any) -> Dict[str, Any]:
    try:
        return getattr(_agent_half(), fn)(*args, **kwargs)
    except ValueError as exc:  # the agent half's input checks
        raise HTTPException(status_code=422, detail=str(exc)) from None


class CheckIn(BaseModel):
    energy: int = Field(ge=0, le=100)
    valence: Literal["pleasant", "unpleasant", "neutral"]
    feeling: Optional[str] = Field(default=None, max_length=50)
    body_note: Optional[str] = Field(default=None, max_length=500)


class Journal(BaseModel):
    content: str = Field(min_length=1, max_length=10_000)
    tags: List[str] = Field(default_factory=list, max_length=10)
    # The page sends true only from the dialog that shows the exact text.
    confirmed: bool = False


@router.get("/status")
def status() -> Dict[str, Any]:
    return _call("status")


@router.get("/today")
def today() -> Dict[str, Any]:
    out = _call("today")
    out.pop("reading", None)  # guidance for the model, not for the page
    return out


@router.post("/checkin")
def checkin(body: CheckIn) -> Dict[str, Any]:
    out = _call("checkin", body.energy, body.valence, body.feeling, body.body_note, user_confirmed=True)
    out.pop("reading", None)
    return out


@router.post("/journal")
def journal(body: Journal) -> Dict[str, Any]:
    if body.confirmed is not True:
        raise HTTPException(status_code=422, detail="not saved: confirm the exact entry first")
    out = _call("journal", body.content, body.tags, user_confirmed=True)
    out.pop("reading", None)
    return out
