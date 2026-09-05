import request from 'supertest';
import app from '../src/app.js';

import { cleanDatabase, disconnectDatabase, createTestUser } from './setup.js';

// These tests deliberately do NOT stand up the extractor Lambda. They only
// need to get as far as auth/validation, plus the case where the service is
// unreachable/unconfigured -- which is exactly the state an un-started
// service is in. EXTRACTOR_API_URL is pointed at a closed port so the
// "unreachable" case can't accidentally hit a real deployed stack.
const ORIGINAL_EXTRACTOR_URL = process.env.EXTRACTOR_API_URL;

let token;

beforeEach(async () => {
  await cleanDatabase();

  token = await createTestUser();
  process.env.EXTRACTOR_API_URL = 'http://127.0.0.1:59998';
});

afterAll(async () => {
  if (ORIGINAL_EXTRACTOR_URL === undefined) {
    delete process.env.EXTRACTOR_API_URL;
  } else {
    process.env.EXTRACTOR_API_URL = ORIGINAL_EXTRACTOR_URL;
  }

  await disconnectDatabase();
});

describe('Extractor API', () => {
  test('cannot extract without authentication', async () => {
    const response = await request(app)
      .post('/api/extract')
      .send({ text: 'Twisted my ankle playing basketball.' });

    expect(response.statusCode).toBe(401);
  });

  test('cannot fetch injury history without authentication', async () => {
    const response = await request(app).get('/api/extract/injuries');

    expect(response.statusCode).toBe(401);
  });

  test('rejects an empty text field', async () => {
    const response = await request(app)
      .post('/api/extract')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: '' });

    expect(response.statusCode).toBe(400);
  });

  test('rejects text over the 5000-character cap', async () => {
    const response = await request(app)
      .post('/api/extract')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'a'.repeat(5001) });

    expect(response.statusCode).toBe(400);
  });

  test('returns 503 when the extractor service is unreachable', async () => {
    const response = await request(app)
      .post('/api/extract')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Twisted my ankle playing basketball.' });

    expect(response.statusCode).toBe(503);
    expect(response.body.error).toBe('Extractor service unreachable');
  });

  test('history returns 503 when the extractor service is unreachable', async () => {
    const response = await request(app)
      .get('/api/extract/injuries')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(503);
    expect(response.body.error).toBe('Extractor service unreachable');
  });
});
