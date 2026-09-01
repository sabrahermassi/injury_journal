import request from 'supertest';
import app from '../src/app.js';

import { cleanDatabase, disconnectDatabase, createTestUser } from './setup.js';

// These tests deliberately do NOT stand up the assistant service. Two of them
// only need to get as far as auth/validation, and the third asserts what
// happens when the service is unreachable — which is exactly the state an
// un-started service is in. AI_ASSISTANT_URL is pointed at a closed port so
// the "unreachable" case can't accidentally hit a real service someone left
// running on the default 3002.
const ORIGINAL_ASSISTANT_URL = process.env.AI_ASSISTANT_URL;

let token;

beforeEach(async () => {
  await cleanDatabase();

  token = await createTestUser();
  process.env.AI_ASSISTANT_URL = 'http://127.0.0.1:59999';
});

afterAll(async () => {
  if (ORIGINAL_ASSISTANT_URL === undefined) {
    delete process.env.AI_ASSISTANT_URL;
  } else {
    process.env.AI_ASSISTANT_URL = ORIGINAL_ASSISTANT_URL;
  }

  await disconnectDatabase();
});

describe('Assistant API', () => {
  test('cannot ask without authentication', async () => {
    const response = await request(app)
      .post('/api/assistant/ask')
      .send({ question: 'What treatments have I tried?' });

    expect(response.statusCode).toBe(401);
  });

  test('rejects an empty question', async () => {
    const response = await request(app)
      .post('/api/assistant/ask')
      .set('Authorization', `Bearer ${token}`)
      .send({ question: '' });

    expect(response.statusCode).toBe(400);
  });

  test('rejects a non-numeric injuryId', async () => {
    const response = await request(app)
      .post('/api/assistant/ask')
      .set('Authorization', `Bearer ${token}`)
      .send({ question: 'What helped?', injuryId: 'abc' });

    expect(response.statusCode).toBe(400);
  });

  test('returns 503 when the assistant service is unreachable', async () => {
    const response = await request(app)
      .post('/api/assistant/ask')
      .set('Authorization', `Bearer ${token}`)
      .send({ question: 'What treatments have I tried?' });

    expect(response.statusCode).toBe(503);
    expect(response.body.error).toBe('Assistant service unreachable');
  });
});
