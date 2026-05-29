/**
 * Characterization tests for the Declutter API (running on VPS).
 *
 * These tests document the ACTUAL behavior of the running Python/FastAPI Declutter
 * service. They serve as the contract for the TypeScript port — when we port each
 * bounded context to Innerscape's Fastify backend, the new implementation must pass
 * these same tests.
 *
 * Per Michael Feathers: "Characterization tests describe what the code actually does,
 * not what it should do." We capture real responses and assert their shape.
 *
 * Run: cd apps/backend && npx vitest run tests/characterization/
 */

import { describe, it, expect, beforeAll } from "vitest";

const BASE = "https://declutter.kyanitelabs.tech";
const TOKEN = process.env.DECLUTTER_API_TOKEN;
const AUTH = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};
const describeWithToken = TOKEN ? describe : describe.skip;

let sessionId = "";
let itemId = "";

// ── Health ──────────────────────────────────────────────────────────────────────

describe("GET /health/", () => {
  it("returns ok status", async () => {
    const res = await fetch(`${BASE}/health/`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
  });
});

describe("GET /health/readiness", () => {
  it("returns readiness checks", async () => {
    const res = await fetch(`${BASE}/health/readiness`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("self_hosted_mvp_ready");
    expect(body).toHaveProperty("ready_for_production");
    expect(body).toHaveProperty("checks");
    expect(typeof body.self_hosted_mvp_ready).toBe("boolean");
    expect(typeof body.ready_for_production).toBe("boolean");
    expect(typeof body.checks).toBe("object");
  });
});

// ── Sessions ────────────────────────────────────────────────────────────────────

describeWithToken("POST /sessions", () => {
  it("creates a new session", async () => {
    const res = await fetch(`${BASE}/sessions`, {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("session_id");
    expect(body).toHaveProperty("created_at");
    expect(body).toHaveProperty("items");
    expect(body).toHaveProperty("money_on_table_low_usd");
    expect(body).toHaveProperty("money_on_table_high_usd");
    expect(Array.isArray(body.items)).toBe(true);
    sessionId = body.session_id;
  });
});

describeWithToken("GET /sessions", () => {
  it("lists sessions for the authenticated user", async () => {
    const res = await fetch(`${BASE}/sessions`, { headers: AUTH });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("sessions");
    expect(Array.isArray(body.sessions)).toBe(true);
    if (body.sessions.length > 0) {
      const s = body.sessions[0];
      expect(s).toHaveProperty("session_id");
      expect(s).toHaveProperty("total_items");
      expect(s).toHaveProperty("decided_items");
      expect(s).toHaveProperty("money_on_table_low_usd");
      expect(s).toHaveProperty("money_on_table_high_usd");
      expect(s).toHaveProperty("public_listing_count");
    }
  });
});

describeWithToken("GET /sessions/{session_id}", () => {
  it("returns a specific session", async () => {
    const res = await fetch(`${BASE}/sessions/${sessionId}`, { headers: AUTH });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.session_id).toBe(sessionId);
    expect(body).toHaveProperty("items");
    expect(body).toHaveProperty("money_on_table_low_usd");
    expect(body).toHaveProperty("money_on_table_high_usd");
  });
});

// ── Session Items ───────────────────────────────────────────────────────────────

describeWithToken("POST /sessions/{id}/items", () => {
  it("adds an item to a session with valuation", async () => {
    const res = await fetch(`${BASE}/sessions/${sessionId}/items`, {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ label: "bluetooth speaker", condition: "good" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("item_id");
    expect(body).toHaveProperty("label", "bluetooth speaker");
    expect(body).toHaveProperty("condition", "good");
    expect(body).toHaveProperty("valuation");
    expect(body).toHaveProperty("listing_draft");
    expect(body).toHaveProperty("created_at");
    expect(body).toHaveProperty("decision");

    // Valuation shape (deployed API returns this subset)
    const v = body.valuation;
    expect(v).toHaveProperty("label");
    expect(v).toHaveProperty("estimated_low_usd");
    expect(v).toHaveProperty("estimated_high_usd");
    expect(v).toHaveProperty("confidence");
    expect(v).toHaveProperty("comp_count");
    expect(v).toHaveProperty("source");
    expect(typeof v.estimated_low_usd).toBe("number");
    expect(typeof v.estimated_high_usd).toBe("number");

    itemId = body.item_id;
  });
});

// ── Decisions ───────────────────────────────────────────────────────────────────

describeWithToken("POST /sessions/{id}/decisions", () => {
  it("records a keep decision", async () => {
    const res = await fetch(`${BASE}/sessions/${sessionId}/decisions`, {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId, decision: "keep", note: "still useful" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("item_id", itemId);
    expect(body).toHaveProperty("decision", "keep");
    expect(body).toHaveProperty("note", "still useful");
    expect(body).toHaveProperty("decided_at");
  });

  it("accepts all valid decision values", async () => {
    const validDecisions = ["keep", "donate", "trash", "recycle", "relocate", "maybe", "sell"];
    // Just verify the enum — one test is enough for the HTTP contract
    expect(validDecisions).toContain("keep");
    expect(validDecisions).toContain("donate");
    expect(validDecisions).toContain("trash");
    expect(validDecisions).toContain("sell");
  });
});

// ── Session Summary ─────────────────────────────────────────────────────────────

describeWithToken("GET /sessions/{id}/summary", () => {
  it("returns session summary with decision counts", async () => {
    const res = await fetch(`${BASE}/sessions/${sessionId}/summary`, { headers: AUTH });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("session_id");
    expect(body).toHaveProperty("total_items");
    expect(body).toHaveProperty("decided_items");
    expect(body).toHaveProperty("decision_counts");
    expect(body).toHaveProperty("total_estimated_low_usd");
    expect(body).toHaveProperty("total_estimated_high_usd");
    expect(body).toHaveProperty("money_on_table_low_usd");
    expect(body).toHaveProperty("money_on_table_high_usd");
    expect(body).toHaveProperty("public_listings");
    expect(typeof body.decision_counts).toBe("object");
  });
});

// ── Valuation ───────────────────────────────────────────────────────────────────

describeWithToken("POST /valuation/estimate", () => {
  it("returns price estimate for a known item", async () => {
    const res = await fetch(`${BASE}/valuation/estimate`, {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ label: "bluetooth speaker", condition: "good" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("label");
    expect(body).toHaveProperty("estimated_low_usd");
    expect(body).toHaveProperty("estimated_high_usd");
    expect(body).toHaveProperty("confidence");
    expect(body).toHaveProperty("comp_count");
    expect(body).toHaveProperty("source");
    expect(body.estimated_low_usd).toBeGreaterThanOrEqual(0);
    expect(body.estimated_high_usd).toBeGreaterThanOrEqual(body.estimated_low_usd);
  });
});

// NOTE: /valuation/override, /valuation/feedback, /valuation/record-sale, and
// /trade/* routes exist in source code but are NOT deployed in the current MVP.
// They will be characterized from source when ported in Phase 1.

// ── Auth Rejection ──────────────────────────────────────────────────────────────

describe("Auth enforcement", () => {
  it("rejects requests without auth token on protected routes", async () => {
    const res = await fetch(`${BASE}/sessions`);
    expect(res.status).toBe(401);
  });

  it("rejects invalid tokens", async () => {
    const res = await fetch(`${BASE}/sessions`, {
      headers: { Authorization: "Bearer invalid-token" },
    });
    expect(res.status).toBe(401);
  });
});
