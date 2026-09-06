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
jest.setTimeout(30000);

const buildApp = (limiter, { withUserId } = {}) => {
  const app = express();

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

    for (let i = 0; i < 300; i++) {
      const res = await request(app).get('/probe');
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).get('/probe');

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      error: 'Too many requests, please try again later',
    });
  });

  test('never rate-limits /health', async () => {
    const app = buildApp(apiLimiter);

    for (let i = 0; i < 305; i++) {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    }
  });
});

describe('authLimiter', () => {
  test('allows up to 10 requests, then 429s with the configured message', async () => {
    const app = buildApp(authLimiter);

    for (let i = 0; i < 10; i++) {
      const res = await request(app).get('/probe');
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).get('/probe');

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
});
