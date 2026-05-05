import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

// ── Trade Listings ─────────────────────────────────────────────────────────

export async function tradeRoutes(app: FastifyInstance) {
  app.post('/api/v1/trade/listings', { preHandler: authMiddleware }, async (request, reply) => {
    const schema = z.object({
      item_label: z.string().min(1),
      description: z.string().max(2000).default(''),
      condition: z.string().default('good'),
      valuation_median_usd: z.number().min(0).default(0),
      trade_value_credits: z.number().min(0).default(0),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      images: z.array(z.string()).default([]),
      tags: z.array(z.string()).default([]),
      wants_in_return: z.array(z.string()).default([]),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });

    const listing = await prisma.tradeListing.create({
      data: {
        userId: request.userId!,
        itemLabel: parsed.data.item_label,
        description: parsed.data.description,
        condition: parsed.data.condition,
        valuationMedianUsd: parsed.data.valuation_median_usd,
        tradeValueCredits: parsed.data.trade_value_credits,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        images: parsed.data.images,
        tags: parsed.data.tags,
        wantsInReturn: parsed.data.wants_in_return,
      },
    });

    return reply.status(200).send({
      id: listing.id,
      item_label: listing.itemLabel,
      description: listing.description,
      condition: listing.condition,
      trade_value_credits: listing.tradeValueCredits,
      status: listing.status,
      created_at: listing.createdAt.toISOString(),
      tags: listing.tags,
      wants_in_return: listing.wantsInReturn,
    });
  });

  app.get('/api/v1/trade/listings', { preHandler: authMiddleware }, async (request) => {
    const { status = 'available', limit = '20', offset = '0' } = request.query as {
      status?: string;
      limit?: string;
      offset?: string;
    };

    const listings = await prisma.tradeListing.findMany({
      where: { status, userId: { not: request.userId } },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    return {
      listings: listings.map((l) => ({
        id: l.id,
        item_label: l.itemLabel,
        description: l.description,
        condition: l.condition,
        valuation_median_usd: l.valuationMedianUsd,
        trade_value_credits: l.tradeValueCredits,
        tags: l.tags,
        wants_in_return: l.wantsInReturn,
        status: l.status,
        created_at: l.createdAt.toISOString(),
      })),
    };
  });

  app.get('/api/v1/trade/listings/mine', { preHandler: authMiddleware }, async (request) => {
    const listings = await prisma.tradeListing.findMany({
      where: { userId: request.userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      listings: listings.map((l) => ({
        id: l.id,
        item_label: l.itemLabel,
        description: l.description,
        condition: l.condition,
        valuation_median_usd: l.valuationMedianUsd,
        trade_value_credits: l.tradeValueCredits,
        status: l.status,
        tags: l.tags,
        wants_in_return: l.wantsInReturn,
        created_at: l.createdAt.toISOString(),
        updated_at: l.updatedAt.toISOString(),
      })),
    };
  });

  // ── Trade Matches ────────────────────────────────────────────────────────

  app.post('/api/v1/trade/matches', { preHandler: authMiddleware }, async (request, reply) => {
    const schema = z.object({
      listing_id: z.string().min(1),
      offered_listing_id: z.string().optional(),
      message: z.string().max(1000).optional(),
      use_credits: z.boolean().default(false),
      credit_amount: z.number().min(0).default(0),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });

    const listing = await prisma.tradeListing.findUnique({ where: { id: parsed.data.listing_id } });
    if (!listing) return reply.status(404).send({ error: 'Listing not found' });
    if (listing.userId === request.userId) return reply.status(400).send({ error: 'Cannot match with own listing' });

    const match = await prisma.tradeMatch.create({
      data: {
        listingId: parsed.data.listing_id,
        requesterId: request.userId!,
        ownerId: listing.userId,
        offeredListingId: parsed.data.offered_listing_id,
        message: parsed.data.message,
        useCredits: parsed.data.use_credits,
        creditAmount: parsed.data.credit_amount,
      },
    });

    return reply.status(200).send({
      id: match.id,
      listing_id: match.listingId,
      requester_id: match.requesterId,
      owner_id: match.ownerId,
      offered_listing_id: match.offeredListingId,
      message: match.message,
      use_credits: match.useCredits,
      credit_amount: match.creditAmount,
      status: match.status,
      created_at: match.createdAt.toISOString(),
    });
  });

  // ── Credits ──────────────────────────────────────────────────────────────

  app.get('/api/v1/trade/credits', { preHandler: authMiddleware }, async (request) => {
    const transactions = await prisma.creditTransaction.findMany({
      where: { userId: request.userId },
      orderBy: { createdAt: 'desc' },
    });

    const balance = transactions.reduce((sum, t) => {
      return sum + (t.direction === 'earned' ? t.amount : -t.amount);
    }, 0);

    return {
      balance,
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        item_label: t.itemLabel,
        direction: t.direction,
        trade_id: t.tradeId,
        created_at: t.createdAt.toISOString(),
      })),
    };
  });

  // ── Trade Reviews ────────────────────────────────────────────────────────

  app.post('/api/v1/trade/reviews', { preHandler: authMiddleware }, async (request, reply) => {
    const schema = z.object({
      trade_match_id: z.string().min(1),
      rated_user_id: z.string().min(1),
      rating: z.number().int().min(1).max(5),
      tags: z.array(z.string()).default([]),
      comment: z.string().optional(),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });

    const review = await prisma.tradeReview.create({
      data: {
        tradeMatchId: parsed.data.trade_match_id,
        ratedUserId: parsed.data.rated_user_id,
        raterUserId: request.userId!,
        rating: parsed.data.rating,
        tags: parsed.data.tags,
        comment: parsed.data.comment,
      },
    });

    return reply.status(200).send({
      id: review.id,
      rated_user_id: review.ratedUserId,
      rating: review.rating,
      created_at: review.createdAt.toISOString(),
    });
  });

  // ── Static resources ────────────────────────────────────────────────────

  app.get('/api/v1/trade/rules', { preHandler: authMiddleware }, async () => ({
    rules: [
      'All items must be accurately described including condition and defects.',
      'Both parties must agree before a trade is finalized.',
      'Credits are non-transferable and non-refundable.',
      'Users with a rating below 3.0 may be restricted from trading.',
      'Report suspicious behavior immediately.',
    ],
  }));

  app.get('/api/v1/trade/safety', { preHandler: authMiddleware }, async () => ({
    checklists: [
      {
        id: 'meetup',
        title: 'Safe Meetup',
        items: [
          'Meet in a public, well-lit location.',
          'Bring a friend or family member.',
          'Let someone know where you are going.',
          'Inspect the item before completing the trade.',
        ],
      },
      {
        id: 'shipping',
        title: 'Safe Shipping',
        items: [
          'Use tracked shipping methods.',
          'Take photos of the item before shipping.',
          'Keep receipts and tracking numbers.',
          'Communicate through the app, not personal channels.',
        ],
      },
    ],
  }));
}
