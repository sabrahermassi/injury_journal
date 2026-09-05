import request from 'supertest';
import app from '../src/app.js';

import { cleanDatabase, disconnectDatabase, createTestUser } from './setup.js';

// Like assistant.test.js, these deliberately do NOT stand up the extractor
// Lambda. Most only need to reach auth/validation, and the rest assert what
// happens when it is unreachable — which an undeployed Lambda already is.
// EXTRACTOR_API_URL points at a closed port so the "unreachable" case cannot
// accidentally reach a real deployment.
const ORIGINAL_URL = process.env.EXTRACTOR_API_URL;
const ORIGINAL_SECRET = process.env.EXTRACTOR_SHARED_SECRET;

const restore = (name, original) => {
  if (original === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = original;
  }
};

let token;

beforeEach(async () => {
  await cleanDatabase();

  token = await createTestUser();
  process.env.EXTRACTOR_API_URL = 'http://127.0.0.1:59998';
  process.env.EXTRACTOR_SHARED_SECRET = 'test-shared-secret';
});

afterAll(async () => {
  restore('EXTRACTOR_API_URL', ORIGINAL_URL);
  restore('EXTRACTOR_SHARED_SECRET', ORIGINAL_SECRET);

  await disconnectDatabase();
});

describe('Extractor API', () => {
  // The point of the whole change (issue #32): before this, the browser
  // called the Lambda directly and nothing checked who was asking.
  test('cannot extract without authentication', async () => {
    const response = await request(app)
      .post('/api/extractions/extract')
      .send({ text: 'my ankle hurts' });

    expect(response.statusCode).toBe(401);
  });

  test('cannot read history without authentication', async () => {
    const response = await request(app).get('/api/extractions/history');

    expect(response.statusCode).toBe(401);
  });

  test('rejects empty text', async () => {
    const response = await request(app)
      .post('/api/extractions/extract')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: '' });

    expect(response.statusCode).toBe(400);
  });

  // Rejected here rather than after a round trip to AWS; 5000 is the Lambda's
  // own MAX_TEXT_LENGTH.
  test('rejects text longer than the Lambda will accept', async () => {
    const response = await request(app)
      .post('/api/extractions/extract')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'x'.repeat(5001) });

    expect(response.statusCode).toBe(400);
  });

  // A caller must not be able to choose whose extraction history they write
  // into. The schema is strict, so a stray userId is rejected outright rather
  // than silently ignored.
  test('rejects a caller-supplied userId', async () => {
    const response = await request(app)
      .post('/api/extractions/extract')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'my ankle hurts', userId: '999' });

    expect(response.statusCode).toBe(400);
  });

  test('returns 503 when the extractor service is unreachable', async () => {
    const response = await request(app)
      .post('/api/extractions/extract')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'my ankle hurts' });

    expect(response.statusCode).toBe(503);
    expect(response.body.error).toBe('Extractor service unreachable');
  });

  test('returns 503 for history when the extractor service is unreachable', async () => {
    const response = await request(app)
      .get('/api/extractions/history')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(503);
  });

  // Missing config must not turn into an unauthenticated call to the Lambda.
  test('returns 503 when the shared secret is not configured', async () => {
    delete process.env.EXTRACTOR_SHARED_SECRET;

    const response = await request(app)
      .post('/api/extractions/extract')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'my ankle hurts' });

    expect(response.statusCode).toBe(503);
  });
});
