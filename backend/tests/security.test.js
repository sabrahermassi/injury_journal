import request from 'supertest';
import app from '../src/app.js';

import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
  createTestInjury,
  createTestSymptom,
  createTestTreatment,
  createTestMedicalVisit,
  createTestTimelineEvent,
  createTestTreatmentOutcome,
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

  // Create injury owned by User B, plus one of each nested resource under it,
  // so every ownership-check shape gets a real User B-owned record to probe:
  // direct userId (injury) and the relation-based checks the nested resources
  // use (injury: { userId }, and for outcomes the two-hop
  // treatment: { injury: { userId } }).
  injuryB = await createTestInjury(userBToken);
  symptomB = await createTestSymptom(userBToken, injuryB.id);
  treatmentB = await createTestTreatment(userBToken, injuryB.id);
  visitB = await createTestMedicalVisit(userBToken, injuryB.id);
  eventB = await createTestTimelineEvent(userBToken, injuryB.id);
  outcomeB = await createTestTreatmentOutcome(userBToken, treatmentB.id);
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

// The nested resources below use a different, more complex ownership check
// than Injury: instead of a direct userId column, updates/deletes filter on
// `injury: { userId }` (a Prisma relation), and TreatmentOutcome goes one hop
// further with `treatment: { injury: { userId } }`. Each block below probes
// that specific check with a resource actually owned by User B, so a future
// refactor that silently breaks the relation filter fails a test here.

describe('Cross-user: symptoms', () => {
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
      .send({ notes: 'Changed' });

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot delete User B symptom', async () => {
    const response = await request(app)
      .delete(`/api/symptoms/${symptomB.id}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });
});

describe('Cross-user: treatments', () => {
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
      .send({ outcome: 'Changed' });

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot delete User B treatment', async () => {
    const response = await request(app)
      .delete(`/api/treatments/${treatmentB.id}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });
});

describe('Cross-user: medical visits', () => {
  test('User A cannot list User B injury visits', async () => {
    const response = await request(app)
      .get(`/api/injuries/${injuryB.id}/visits`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot update User B visit', async () => {
    const response = await request(app)
      .put(`/api/visits/${visitB.id}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ notes: 'Changed' });

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot delete User B visit', async () => {
    const response = await request(app)
      .delete(`/api/visits/${visitB.id}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });
});

describe('Cross-user: timeline events', () => {
  test('User A cannot list User B injury events', async () => {
    const response = await request(app)
      .get(`/api/injuries/${injuryB.id}/events`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot update User B event', async () => {
    const response = await request(app)
      .put(`/api/events/${eventB.id}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ description: 'Changed' });

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot delete User B event', async () => {
    const response = await request(app)
      .delete(`/api/events/${eventB.id}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });
});

describe('Cross-user: treatment outcomes', () => {
  test('User A cannot create an outcome on User B treatment', async () => {
    const response = await request(app)
      .post(`/api/treatments/${treatmentB.id}/outcomes`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ status: 'improved' });

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
