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
  // Every route wired through `validateNumericParam` in routes.js, one row
  // per (method, path, param name). A non-numeric value for that param must
  // be rejected with 400 before it ever reaches Prisma -- this is the exact
  // gap that let #7 (non-numeric id crashing with 500) go unnoticed, and the
  // regression test for it (issue #14).
  const numericParamRoutes = [
    ['get', '/api/injuries/:id', 'id'],
    ['put', '/api/injuries/:id', 'id'],
    ['delete', '/api/injuries/:id', 'id'],
    ['post', '/api/injuries/:injuryId/events', 'injuryId'],
    ['get', '/api/injuries/:injuryId/events', 'injuryId'],
    ['put', '/api/events/:id', 'id'],
    ['delete', '/api/events/:id', 'id'],
    ['post', '/api/injuries/:injuryId/symptoms', 'injuryId'],
    ['get', '/api/injuries/:injuryId/symptoms', 'injuryId'],
    ['put', '/api/symptoms/:id', 'id'],
    ['delete', '/api/symptoms/:id', 'id'],
    ['post', '/api/injuries/:injuryId/treatments', 'injuryId'],
    ['get', '/api/injuries/:injuryId/treatments', 'injuryId'],
    ['put', '/api/treatments/:id', 'id'],
    ['delete', '/api/treatments/:id', 'id'],
    ['post', '/api/injuries/:injuryId/visits', 'injuryId'],
    ['get', '/api/injuries/:injuryId/visits', 'injuryId'],
    ['put', '/api/visits/:id', 'id'],
    ['delete', '/api/visits/:id', 'id'],
    ['post', '/api/treatments/:treatmentId/outcomes', 'treatmentId'],
    ['get', '/api/treatments/:treatmentId/outcomes', 'treatmentId'],
    ['delete', '/api/treatment-outcomes/:id', 'id'],
  ];

  test.each(numericParamRoutes)(
    '%s %s rejects a non-numeric %s with 400, not 500',
    async (method, pathTemplate, paramName) => {
      const path = pathTemplate.replace(`:${paramName}`, 'abc');

      const response = await request(app)[method](path)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({});

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe(`${paramName} must be a positive integer`);
    }
  );

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
