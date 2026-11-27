import { describe, it, expect } from 'vitest';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { daysQuery, listQuery, parseQuery } from '../../src/utils/query-params.js';

describe('listQuery', () => {
  const schema = listQuery(50, 200);

  it('fills in the defaults when a param is absent', () => {
    expect(schema.parse({})).toEqual({ limit: 50, offset: 0 });
  });

  it('reads whole numbers', () => {
    expect(schema.parse({ limit: '0', offset: '7' })).toEqual({ limit: 0, offset: 7 });
  });

  it('lowers a limit above the cap and leaves offset alone', () => {
    expect(schema.parse({ limit: '999999', offset: '999999' })).toEqual({ limit: 200, offset: 999999 });
  });

  // Kept on purpose: `?limit=` answered 200 with an empty page before this validation
  // existed, and only the error path is meant to change.
  it('reads an empty value as 0, as Number() always has', () => {
    expect(schema.parse({ limit: '', offset: '' })).toEqual({ limit: 0, offset: 0 });
  });

  it.each(['notanumber', 'abc', '1.5', '-1', 'Infinity', 'NaN', '5px', ['1', '2']])(
    'rejects %j',
    (value) => {
      expect(schema.safeParse({ limit: value }).success).toBe(false);
      expect(schema.safeParse({ offset: value }).success).toBe(false);
    },
  );
});

describe('daysQuery', () => {
  it('takes the default when days is absent', () => {
    expect(daysQuery(7, 90).parse({})).toEqual({ days: 7 });
  });

  it('reads a whole number', () => {
    expect(daysQuery(7, 90).parse({ days: '30' })).toEqual({ days: 30 });
  });

  it('lowers a window above maxDays', () => {
    expect(daysQuery(7, 90).parse({ days: '999999' })).toEqual({ days: 90 });
  });

  it('does not cap the window when maxDays is omitted', () => {
    expect(daysQuery(7).parse({ days: '100000' })).toEqual({ days: 100000 });
  });

  it.each(['notanumber', '1.5', '-1', 'Infinity'])('rejects %j', (value) => {
    expect(daysQuery(7, 90).safeParse({ days: value }).success).toBe(false);
  });
});

describe('parseQuery', () => {
  const schema = listQuery(50, 200);

  // The smallest reply double that records what the route would have answered.
  function fakeReply() {
    const recorded = { statusCode: 0, body: undefined as unknown };
    const reply = {
      status(code: number) {
        recorded.statusCode = code;
        return reply;
      },
      send(body: unknown) {
        recorded.body = body;
        return reply;
      },
    };
    return { recorded, reply: reply as unknown as FastifyReply };
  }

  it('returns the parsed query and answers nothing when it is valid', () => {
    const { recorded, reply } = fakeReply();
    const parsed = parseQuery({ query: { limit: '5' } } as unknown as FastifyRequest, reply, schema);
    expect(parsed).toEqual({ limit: 5, offset: 0 });
    expect(recorded.statusCode).toBe(0);
  });

  it('answers 400 with one message per bad param, and returns null, when it is not', () => {
    const { recorded, reply } = fakeReply();
    const parsed = parseQuery(
      { query: { limit: 'notanumber', offset: 'x' } } as unknown as FastifyRequest,
      reply,
      schema,
    );
    expect(parsed).toBeNull();
    expect(recorded.statusCode).toBe(400);
    expect(recorded.body).toEqual({
      error: { limit: ['must be a whole number'], offset: ['must be a whole number'] },
    });
  });

  it('says so when the value is negative', () => {
    const { recorded, reply } = fakeReply();
    parseQuery({ query: { limit: '-1' } } as unknown as FastifyRequest, reply, schema);
    expect(recorded.statusCode).toBe(400);
    expect(recorded.body).toEqual({ error: { limit: ['must be 0 or more'] } });
  });
});
