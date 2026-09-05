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
let symptomB;
let treatmentB;
let visitB;
let eventB;
let outcomeB;

beforeEach(async () => {
  await cleanDatabase();

  // User A
  userAToken = await createTestUser();

  // User B
  userBToken = await createTestUser();

  // Create injury owned by User B, plus one child of each nested type, so
  // User A has something concrete to be denied access to below.
  injuryB = await createTestInjury(userBToken);

  const symptomResponse = await request(app)
    .post(`/api/injuries/${injuryB.id}/symptoms`)
    .set('Authorization', `Bearer ${userBToken}`)
    .send({
      location: 'Left hip',
      painLevel: 7,
      date: '2025-02-01T00:00:00.000Z',
      notes: 'Pain after walking',
    });
  symptomB = symptomResponse.body;

  const treatmentResponse = await request(app)
    .post(`/api/injuries/${injuryB.id}/treatments`)
    .set('Authorization', `Bearer ${userBToken}`)
    .send({
      name: 'Physiotherapy',
      provider: 'Clinic',
      date: '2025-02-01T00:00:00.000Z',
      cost: 100,
      outcome: 'Improved mobility',
    });
  treatmentB = treatmentResponse.body;

  const visitResponse = await request(app)
    .post(`/api/injuries/${injuryB.id}/visits`)
    .set('Authorization', `Bearer ${userBToken}`)
    .send({
      doctor: 'Dr Smith',
      clinic: 'Orthopedic Clinic',
      date: '2025-02-07T00:00:00.000Z',
      notes: 'Recommended MRI and physiotherapy',
    });
  visitB = visitResponse.body;

  const eventResponse = await request(app)
    .post(`/api/injuries/${injuryB.id}/events`)
    .set('Authorization', `Bearer ${userBToken}`)
    .send({
      type: 'Doctor visit',
      description: 'MRI appointment',
      date: '2025-02-01T00:00:00.000Z',
    });
  eventB = eventResponse.body;

  const outcomeResponse = await request(app)
    .post(`/api/treatments/${treatmentB.id}/outcomes`)
    .set('Authorization', `Bearer ${userBToken}`)
    .send({
      status: 'Still helping',
    });
  outcomeB = outcomeResponse.body;
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

  test('User A cannot create a symptom on User B injury', async () => {
    const response = await request(app)
      .post(`/api/injuries/${injuryB.id}/symptoms`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        location: 'Right knee',
        painLevel: 5,
        date: '2025-02-01T00:00:00.000Z',
      });

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot list User B injury symptoms', async () => {
    const response = await request(app)
      .get(`/api/injuries/${injuryB.id}/symptoms`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot update User B symptom', async () => {
    const response = await request(app)
      .put(`/api/symptoms/${symptomB.id}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ painLevel: 9 });

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot delete User B symptom', async () => {
    const response = await request(app)
      .delete(`/api/symptoms/${symptomB.id}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot create a treatment on User B injury', async () => {
    const response = await request(app)
      .post(`/api/injuries/${injuryB.id}/treatments`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'Massage',
        date: '2025-02-01T00:00:00.000Z',
      });

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot list User B injury treatments', async () => {
    const response = await request(app)
      .get(`/api/injuries/${injuryB.id}/treatments`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot update User B treatment', async () => {
    const response = await request(app)
      .put(`/api/treatments/${treatmentB.id}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Changed treatment' });

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot delete User B treatment', async () => {
    const response = await request(app)
      .delete(`/api/treatments/${treatmentB.id}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot create a medical visit on User B injury', async () => {
    const response = await request(app)
      .post(`/api/injuries/${injuryB.id}/visits`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        doctor: 'Dr Jones',
        date: '2025-02-07T00:00:00.000Z',
      });

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot list User B injury visits', async () => {
    const response = await request(app)
      .get(`/api/injuries/${injuryB.id}/visits`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot update User B medical visit', async () => {
    const response = await request(app)
      .put(`/api/visits/${visitB.id}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ doctor: 'Changed doctor' });

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot delete User B medical visit', async () => {
    const response = await request(app)
      .delete(`/api/visits/${visitB.id}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot create a timeline event on User B injury', async () => {
    const response = await request(app)
      .post(`/api/injuries/${injuryB.id}/events`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'Note',
        description: 'Should not be created',
        date: '2025-02-01T00:00:00.000Z',
      });

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot list User B injury timeline events', async () => {
    const response = await request(app)
      .get(`/api/injuries/${injuryB.id}/events`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot update User B timeline event', async () => {
    const response = await request(app)
      .put(`/api/events/${eventB.id}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ description: 'Changed description' });

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot delete User B timeline event', async () => {
    const response = await request(app)
      .delete(`/api/events/${eventB.id}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot create a treatment outcome on User B treatment', async () => {
    const response = await request(app)
      .post(`/api/treatments/${treatmentB.id}/outcomes`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ status: 'Should not be created' });

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot list User B treatment outcomes', async () => {
    const response = await request(app)
      .get(`/api/treatments/${treatmentB.id}/outcomes`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot delete User B treatment outcome', async () => {
    const response = await request(app)
      .delete(`/api/treatment-outcomes/${outcomeB.id}`)
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
