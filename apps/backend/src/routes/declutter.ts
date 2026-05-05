import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { runAnalysis } from '../services/vision-analysis.js';
import type { ValuationJson, ListingDraftJson } from '../types/valuation.js';
import { sendError } from '../utils/send-error.js';

const DECISION_VALUES = ['keep', 'donate', 'trash', 'recycle', 'relocate', 'maybe', 'sell'] as const;

const sessionIdSchema = z.object({ sessionId: z.string().min(1) });

function computeMoneyOnTable(items: { valuationJson: unknown; decision?: { decision: string } | null }[]): { money_on_table_low_usd: number; money_on_table_high_usd: number } {
  let low = 0;
  let high = 0;
  for (const item of items) {
    if (item.decision && ['donate', 'trash', 'recycle'].includes(item.decision.decision)) continue;
    const v = item.valuationJson as ValuationJson | null;
    if (v?.estimated_low_usd) low += v.estimated_low_usd;
    if (v?.estimated_high_usd) high += v.estimated_high_usd;
  }
  return { money_on_table_low_usd: low, money_on_table_high_usd: high };
}

// ── Sessions ────────────────────────────────────────────────────────────────

export async function declutterSessionRoutes(app: FastifyInstance) {
  app.post('/api/v1/declutter/sessions', { preHandler: authMiddleware }, async (request, reply) => {
    const session = await prisma.declutterSession.create({
      data: { userId: request.userId! },
      include: { items: { include: { decision: true } } },
    });
    const { money_on_table_low_usd, money_on_table_high_usd } = computeMoneyOnTable(session.items);
    return reply.status(200).send({
      session_id: session.id,
      image_storage_key: session.imageStorageKey,
      created_at: session.createdAt.toISOString(),
      items: [],
      money_on_table_low_usd,
      money_on_table_high_usd,
    });
  });

  app.get('/api/v1/declutter/sessions', { preHandler: authMiddleware }, async (request) => {
    const sessions = await prisma.declutterSession.findMany({
      where: { userId: request.userId },
      include: {
        items: { include: { decision: true } },
        publicListings: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      sessions: sessions.map((s) => {
        const { money_on_table_low_usd, money_on_table_high_usd } = computeMoneyOnTable(s.items);
        return {
          session_id: s.id,
          image_storage_key: s.imageStorageKey,
          created_at: s.createdAt.toISOString(),
          total_items: s.items.length,
          decided_items: s.items.filter((i) => i.decision).length,
          money_on_table_low_usd,
          money_on_table_high_usd,
          public_listing_count: s.publicListings.length,
        };
      }),
    };
  });

  app.get('/api/v1/declutter/sessions/:sessionId', { preHandler: authMiddleware }, async (request, reply) => {
    const { sessionId } = sessionIdSchema.parse(request.params);
    const session = await prisma.declutterSession.findFirst({
      where: { id: sessionId, userId: request.userId },
      include: { items: { include: { decision: true } } },
    });
    if (!session) return sendError(reply, 404, 'Session not found');

    const { money_on_table_low_usd, money_on_table_high_usd } = computeMoneyOnTable(session.items);
    return {
      session_id: session.id,
      image_storage_key: session.imageStorageKey,
      created_at: session.createdAt.toISOString(),
      items: session.items.map((item) => ({
        item_id: item.id,
        label: item.label,
        condition: item.condition,
        valuation: item.valuationJson,
        listing_draft: item.listingDraftJson,
        decision: item.decision
          ? { item_id: item.id, decision: item.decision.decision, note: item.decision.note, decided_at: item.decision.decidedAt.toISOString() }
          : null,
        created_at: item.createdAt.toISOString(),
      })),
      money_on_table_low_usd,
      money_on_table_high_usd,
    };
  });

  // ── Session Items ──────────────────────────────────────────────────────────

  app.post('/api/v1/declutter/sessions/:sessionId/items', { preHandler: authMiddleware }, async (request, reply) => {
    const { sessionId } = sessionIdSchema.parse(request.params);
    const schema = z.object({
      label: z.string().min(1).max(120),
      condition: z.string().default('unknown'),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });

    const session = await prisma.declutterSession.findFirst({
      where: { id: sessionId, userId: request.userId },
    });
    if (!session) return sendError(reply, 404, 'Session not found');

    const { label, condition } = parsed.data;
    const valuation = estimateValuationStub(label, condition);
    const listingDraft = generateListingDraftStub(label, condition, valuation);

    const item = await prisma.declutterItem.create({
      data: {
        sessionId,
        label,
        condition,
        valuationJson: valuation as any,
        listingDraftJson: listingDraft as any,
      },
    });

    return reply.status(200).send({
      item_id: item.id,
      label: item.label,
      condition: item.condition,
      valuation: item.valuationJson,
      listing_draft: item.listingDraftJson,
      decision: null,
      created_at: item.createdAt.toISOString(),
    });
  });

  // ── Decisions ──────────────────────────────────────────────────────────────

  app.post('/api/v1/declutter/sessions/:sessionId/decisions', { preHandler: authMiddleware }, async (request, reply) => {
    const { sessionId } = sessionIdSchema.parse(request.params);
    const schema = z.object({
      item_id: z.string().min(1),
      decision: z.enum(DECISION_VALUES),
      note: z.string().max(500).optional(),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });

    const item = await prisma.declutterItem.findFirst({
      where: { id: parsed.data.item_id, session: { id: sessionId, userId: request.userId } },
    });
    if (!item) return sendError(reply, 404, 'Item not found');

    const decision = await prisma.declutterDecision.upsert({
      where: { itemId: item.id },
      update: { decision: parsed.data.decision, note: parsed.data.note ?? null },
      create: {
        itemId: item.id,
        sessionId,
        decision: parsed.data.decision,
        note: parsed.data.note ?? null,
      },
    });

    return reply.status(200).send({
      item_id: item.id,
      decision: decision.decision,
      note: decision.note,
      decided_at: decision.decidedAt.toISOString(),
    });
  });

  // ── Session Summary ────────────────────────────────────────────────────────

  app.get('/api/v1/declutter/sessions/:sessionId/summary', { preHandler: authMiddleware }, async (request, reply) => {
    const { sessionId } = sessionIdSchema.parse(request.params);
    const session = await prisma.declutterSession.findFirst({
      where: { id: sessionId, userId: request.userId },
      include: {
        items: { include: { decision: true } },
        publicListings: true,
      },
    });
    if (!session) return sendError(reply, 404, 'Session not found');

    const decisionCounts: Record<string, number> = {};
    let totalLow = 0;
    let totalHigh = 0;

    for (const item of session.items) {
      const v = item.valuationJson as ValuationJson;
      if (v?.estimated_low_usd) totalLow += v.estimated_low_usd;
      if (v?.estimated_high_usd) totalHigh += v.estimated_high_usd;

      if (item.decision) {
        decisionCounts[item.decision.decision] = (decisionCounts[item.decision.decision] || 0) + 1;
      }
    }

    const { money_on_table_low_usd, money_on_table_high_usd } = computeMoneyOnTable(session.items);

    return {
      session_id: session.id,
      image_storage_key: session.imageStorageKey,
      created_at: session.createdAt.toISOString(),
      total_items: session.items.length,
      decided_items: session.items.filter((i) => i.decision).length,
      decision_counts: decisionCounts,
      total_estimated_low_usd: totalLow,
      total_estimated_high_usd: totalHigh,
      money_on_table_low_usd,
      money_on_table_high_usd,
      public_listings: session.publicListings.map((pl) => ({
        item_id: pl.itemId,
        listing_id: pl.id,
        title: pl.title,
      })),
    };
  });
}

// ── Valuation ───────────────────────────────────────────────────────────────

export async function declutterValuationRoutes(app: FastifyInstance) {
  app.post('/api/v1/declutter/valuation/estimate', { preHandler: authMiddleware }, async (request, reply) => {
    const schema = z.object({ label: z.string().min(1), condition: z.string().default('unknown') });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });

    const normalizedLabel = parsed.data.label.toLowerCase().trim();
    const existing = await prisma.priceRange.findUnique({ where: { normalizedLabel } });

    if (existing) {
      return {
        label: existing.label,
        estimated_low_usd: existing.lowPrice,
        estimated_high_usd: existing.highPrice,
        confidence: existing.confidence,
        comp_count: existing.compCount,
        source: existing.source,
      };
    }

    return estimateValuationStub(parsed.data.label, parsed.data.condition);
  });

  app.post('/api/v1/declutter/valuation', { preHandler: authMiddleware }, async (request, reply) => {
    const schema = z.object({
      category: z.string().min(1),
      condition: z.string().default('unknown'),
      count: z.number().int().min(1).default(1),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });

    const stats = await prisma.priceRange.aggregate({
      _avg: { lowPrice: true, medianPrice: true, highPrice: true },
      _count: true,
      where: { category: parsed.data.category },
    });

    if (stats._count > 0) {
      return {
        low: Math.round((stats._avg.lowPrice ?? 5) * parsed.data.count),
        mid: Math.round((stats._avg.medianPrice ?? 15) * parsed.data.count),
        high: Math.round((stats._avg.highPrice ?? 50) * parsed.data.count),
        confidence: Math.min(0.9, stats._count / 50),
      };
    }

    const fallback = await prisma.priceRange.aggregate({
      _avg: { lowPrice: true, medianPrice: true, highPrice: true },
      _count: true,
    });

    return {
      low: Math.round((fallback._avg.lowPrice ?? 5) * parsed.data.count),
      mid: Math.round((fallback._avg.medianPrice ?? 15) * parsed.data.count),
      high: Math.round((fallback._avg.highPrice ?? 50) * parsed.data.count),
      confidence: 0.3,
    };
  });
}

// ── Stub helpers (replaced by real ML in Phase 1.4) ─────────────────────────

function estimateValuationStub(label: string, _condition: string): ValuationJson {
  const hash = label.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const base = 5 + (hash % 45);
  const spread = 2 + (hash % 8);
  return {
    label,
    estimated_low_usd: base,
    estimated_high_usd: base + spread,
    confidence: 'low',
    comp_count: 6,
    source: 'stub-estimation',
  };
}

function generateListingDraftStub(label: string, condition: string, valuation: ValuationJson): ListingDraftJson {
  const low = valuation.estimated_low_usd ?? 0;
  const high = valuation.estimated_high_usd ?? 0;
  const mid = Math.round((low + high) / 2 * 100) / 100;
  return {
    title: `${label.charAt(0).toUpperCase() + label.slice(1)} - ${condition.charAt(0).toUpperCase() + condition.slice(1)}`,
    description: `${label} in ${condition} condition. Priced based on market comparables.`,
    condition,
    price_usd: mid,
    category_hint: 'Everything Else',
    review_checklist: [
      { id: 'photos', label: 'Add clear photos from multiple angles', done: false },
      { id: 'desc', label: 'Verify description accuracy', done: false },
      { id: 'price', label: 'Confirm pricing is competitive', done: false },
    ],
  };
}

// ── Vision Analysis ────────────────────────────────────────────────────────

export async function declutterAnalysisRoutes(app: FastifyInstance) {
  app.post('/api/v1/declutter/analysis/run', { preHandler: authMiddleware }, async (request, reply) => {
    const schema = z.object({
      session_id: z.string().min(1),
      image_storage_key: z.string().min(1),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });

    const session = await prisma.declutterSession.findFirst({
      where: { id: parsed.data.session_id, userId: request.userId },
    });
    if (!session) return sendError(reply, 404, 'Session not found');

    const result = await runAnalysis(parsed.data.image_storage_key);

    const items = [];
    for (const detected of result.items) {
      const valuation = estimateValuationStub(detected.label, 'unknown');
      const listingDraft = generateListingDraftStub(detected.label, 'unknown', valuation);

      const item = await prisma.declutterItem.create({
        data: {
          sessionId: session.id,
          label: detected.label,
          condition: 'unknown',
          valuationJson: {
            label: detected.label,
            estimated_low_usd: valuation.estimated_low_usd,
            estimated_high_usd: valuation.estimated_high_usd,
            confidence: valuation.confidence,
            comp_count: valuation.comp_count,
            source: valuation.source,
          } as any,
          listingDraftJson: listingDraft as any,
        },
      });
      items.push(item);
    }

    return {
      session_id: session.id,
      items: result.items,
      total_estimated_value_usd: result.total_estimated_value_usd,
      engine: result.engine,
      structured_output_version: '2026-05-vercel-ai-sdk',
    };
  });
}
