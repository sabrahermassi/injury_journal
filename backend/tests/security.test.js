import request from 'supertest';
import app from '../src/app.js';

import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
  createTestInjury,
} from './setup.js';

let userAToken;
let userBToken;

let injuryB;

beforeEach(async () => {
  await cleanDatabase();

  // User A
  userAToken = await createTestUser();

  // User B
  userBToken = await createTestUser();

  // Create injury owned by User B
  injuryB = await createTestInjury(userBToken);
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('Authorization security', () => {
  test('User A cannot view User B injuries', async () => {
    const response = await request(app)
      .get('/api/injuries')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test('User A cannot get User B injury by id', async () => {
    const response = await request(app)
      .get(`/api/injuries/${injuryB.id}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot update User B injury', async () => {
    const response = await request(app)
      .put(`/api/injuries/${injuryB.id}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'Changed injury',
        bodyArea: 'Hip',
        side: 'Left',
        startDate: '2025-01-01T00:00:00.000Z',
        cause: 'Running',
        description: 'Changed',
        status: 'Active',
      });

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot delete User B injury', async () => {
    const response = await request(app)
      .delete(`/api/injuries/${injuryB.id}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });
});

describe('Numeric id param validation', () => {
  test('GET /injuries/:id with a non-numeric id returns 400, not 500', async () => {
    const response = await request(app)
      .get('/api/injuries/abc')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(400);
  });

  test('PUT /injuries/:id with a non-numeric id returns 400', async () => {
    const response = await request(app)
      .put('/api/injuries/abc')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'x' });

    expect(response.statusCode).toBe(400);
  });

  test('DELETE /injuries/:id with a non-numeric id returns 400', async () => {
    const response = await request(app)
      .delete('/api/injuries/abc')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(400);
  });

  test('GET /injuries/:injuryId/symptoms with a non-numeric injuryId returns 400', async () => {
    const response = await request(app)
      .get('/api/injuries/abc/symptoms')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(400);
  });

  test('DELETE /events/:id with a non-numeric id returns 400', async () => {
    const response = await request(app)
      .delete('/api/events/abc')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(400);
  });

  test('a decimal or negative id is also rejected as 400', async () => {
    const decimal = await request(app)
      .get('/api/injuries/1.5')
      .set('Authorization', `Bearer ${userAToken}`);
    const negative = await request(app)
      .get('/api/injuries/-1')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(decimal.statusCode).toBe(400);
    expect(negative.statusCode).toBe(400);
  });

  test('an id beyond the Postgres Int4 range is rejected as 400, not 500', async () => {
    const response = await request(app)
      .get('/api/injuries/99999999999')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(400);
  });

  test('a valid numeric id for a non-existent injury still returns 404', async () => {
    const response = await request(app)
      .get('/api/injuries/999999')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });
});
