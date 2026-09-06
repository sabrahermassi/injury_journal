import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

import { apiLimiter, authLimiter, extractorLimiter } from '../src/middleware.js';

// A pure unit test, not an integration one -- no cleanDatabase/createTestUser
// import, since there's nothing here that touches the database (same pattern
// as utils.test.js).
//
// app.js and routes.js both skip wiring apiLimiter/authLimiter/extractorLimiter
// entirely under NODE_ENV=test (see CLAUDE.md §7), so the real app is never a
// safe way to exercise them here -- forcing that gate open would mean flipping
// NODE_ENV and re-importing app.js, which also changes which .env file
// loadEnv.js loads. Instead, import the real exported limiter objects and
// mount each on its own throwaway app, mirroring how production actually uses
// it. That's enough to catch the regression issue #15 is about: a future
// change to windowMs, max, message, or keyGenerator with nothing to notice.
//
// apiLimiter and authLimiter are real shared singletons: every test in this
// file that uses one hits the exact same in-memory store. Since their default
// keyGenerator buckets by client IP, and every request here actually comes
// from the same test process, two tests reusing a limiter would quietly
// share one quota unless each is given its own key. `trust proxy` plus a
// distinct X-Forwarded-For value per test does that, without touching
// middleware.js's real keyGenerator.
jest.setTimeout(30000);

const buildApp = (limiter, { withUserId } = {}) => {
  const app = express();

  app.set('trust proxy', true);

  if (withUserId) {
    app.use((req, res, next) => {
      req.userId = req.headers['x-test-user-id'];
      next();
    });
  }

  app.get('/probe', limiter, (req, res) => res.json({ ok: true }));
  app.get('/health', limiter, (req, res) => res.json({ ok: true }));

  return app;
};

describe('apiLimiter', () => {
  test('allows up to 300 requests, then 429s with the configured message', async () => {
    const app = buildApp(apiLimiter);
    const clientIp = 'apiLimiter-quota-test';

    for (let i = 0; i < 300; i++) {
      const res = await request(app).get('/probe').set('X-Forwarded-For', clientIp);
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).get('/probe').set('X-Forwarded-For', clientIp);

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      error: 'Too many requests, please try again later',
    });
  });

  test('never counts /health toward the quota', async () => {
    const app = buildApp(apiLimiter);
    const clientIp = 'apiLimiter-health-test';

    // Far more than max (300): if `skip` ever stopped excluding /health,
    // some of these would 429 rather than all returning 200.
    for (let i = 0; i < 305; i++) {
      const res = await request(app).get('/health').set('X-Forwarded-For', clientIp);
      expect(res.status).toBe(200);
    }

    // The actual proof /health spent nothing from the budget: a full, fresh
    // 300-request quota is still available on the same key afterward.
    for (let i = 0; i < 300; i++) {
      const res = await request(app).get('/probe').set('X-Forwarded-For', clientIp);
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).get('/probe').set('X-Forwarded-For', clientIp);

    expect(blocked.status).toBe(429);
  });
});

describe('authLimiter', () => {
  test('allows up to 10 requests, then 429s with the configured message', async () => {
    const app = buildApp(authLimiter);
    const clientIp = 'authLimiter-quota-test';

    for (let i = 0; i < 10; i++) {
      const res = await request(app).get('/probe').set('X-Forwarded-For', clientIp);
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).get('/probe').set('X-Forwarded-For', clientIp);

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      error: 'Too many login attempts, please try again later',
    });
  });
});

describe('extractorLimiter', () => {
  test('is keyed per user, not globally', async () => {
    const app = buildApp(extractorLimiter, { withUserId: true });

    for (let i = 0; i < 20; i++) {
      const res = await request(app).get('/probe').set('x-test-user-id', 'user-a');
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).get('/probe').set('x-test-user-id', 'user-a');

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      error: 'Too many extraction requests, please try again later',
    });

    const otherUser = await request(app).get('/probe').set('x-test-user-id', 'user-b');

    expect(otherUser.status).toBe(200);
  });

  test('buckets every request with no userId together', async () => {
    // extractorLimiter only ever runs after `authenticate` in routes.js,
    // which 401s before reaching it when there's no valid token -- so
    // req.userId is never actually undefined for a real request. This pins
    // down what the fallback key does anyway, so a future change to the
    // keyGenerator that silently weakens it (e.g. falling back to something
    // request-specific instead of a fixed value) doesn't go unnoticed.
    const app = buildApp(extractorLimiter, { withUserId: true });

    for (let i = 0; i < 20; i++) {
      const res = await request(app).get('/probe');
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).get('/probe');

    expect(blocked.status).toBe(429);
  });
});
