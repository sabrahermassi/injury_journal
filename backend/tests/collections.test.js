import request from 'supertest';
import app from '../src/app.js';

import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
  createTestInjury,
} from './setup.js';

// The user-scoped collection endpoints (GET /api/symptoms, /api/events,
// /api/treatments). They exist so a page can be drawn in one request instead
// of one per injury; the thing that has to be right is that "all of the
// user's" never means "all of everyone's" -- so isolation is tested for each.

let token;
let injuryA;
let injuryB;

const auth = (req, t = token) => req.set('Authorization', `Bearer ${t}`);

beforeEach(async () => {
  await cleanDatabase();

  token = await createTestUser();
  injuryA = await createTestInjury(token);

  const second = await auth(request(app).post('/api/injuries')).send({
    name: 'Right ankle sprain',
    bodyArea: 'Ankle',
    side: 'Right',
    startDate: '2025-03-01T00:00:00.000Z',
  });
  injuryB = second.body;
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('GET /api/symptoms', () => {
  test('requires authentication', async () => {
    const response = await request(app).get('/api/symptoms');

    expect(response.statusCode).toBe(401);
  });

  test('returns an empty array when nothing is logged', async () => {
    const response = await auth(request(app).get('/api/symptoms'));

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('merges every injury and names each one', async () => {
    await auth(request(app).post(`/api/injuries/${injuryA.id}/symptoms`)).send({
      painLevel: 7,
      date: '2025-02-01T00:00:00.000Z',
    });
    await auth(request(app).post(`/api/injuries/${injuryB.id}/symptoms`)).send({
      painLevel: 3,
      date: '2025-04-01T00:00:00.000Z',
    });

    const response = await auth(request(app).get('/api/symptoms'));

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(2);

    // Ascending by date, and each row carries the injury's name so the client
    // does not have to join it back.
    expect(response.body[0]).toMatchObject({
      painLevel: 7,
      injuryId: injuryA.id,
      injuryName: injuryA.name,
    });
    expect(response.body[1]).toMatchObject({
      painLevel: 3,
      injuryId: injuryB.id,
      injuryName: injuryB.name,
    });

    // The relation is folded into injuryName, not passed through raw.
    expect(response.body[0].injury).toBeUndefined();
  });

  test("never returns another user's symptoms", async () => {
    await auth(request(app).post(`/api/injuries/${injuryA.id}/symptoms`)).send({
      painLevel: 7,
      date: '2025-02-01T00:00:00.000Z',
    });

    const otherToken = await createTestUser();
    const response = await auth(request(app).get('/api/symptoms'), otherToken);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });
});

describe('GET /api/events', () => {
  test('requires authentication', async () => {
    const response = await request(app).get('/api/events');

    expect(response.statusCode).toBe(401);
  });

  test('merges every injury, newest first', async () => {
    await auth(request(app).post(`/api/injuries/${injuryA.id}/events`)).send({
      type: 'symptom',
      date: '2025-02-01T00:00:00.000Z',
      description: 'Older',
    });
    await auth(request(app).post(`/api/injuries/${injuryB.id}/events`)).send({
      type: 'treatment',
      date: '2025-05-01T00:00:00.000Z',
      description: 'Newer',
    });

    const response = await auth(request(app).get('/api/events'));

    expect(response.statusCode).toBe(200);
    expect(response.body.map((event) => event.description)).toEqual([
      'Newer',
      'Older',
    ]);
    expect(response.body[0].injuryName).toBe(injuryB.name);
  });

  test("never returns another user's events", async () => {
    await auth(request(app).post(`/api/injuries/${injuryA.id}/events`)).send({
      type: 'symptom',
      date: '2025-02-01T00:00:00.000Z',
      description: 'Private',
    });

    const otherToken = await createTestUser();
    const response = await auth(request(app).get('/api/events'), otherToken);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });
});

describe('GET /api/treatments', () => {
  test('requires authentication', async () => {
    const response = await request(app).get('/api/treatments');

    expect(response.statusCode).toBe(401);
  });

  test('attaches each treatment its outcome check-ins', async () => {
    const created = await auth(
      request(app).post(`/api/injuries/${injuryA.id}/treatments`)
    ).send({
      name: 'Physio',
      date: '2025-02-01T00:00:00.000Z',
    });

    await auth(
      request(app).post(`/api/treatments/${created.body.id}/outcomes`)
    ).send({ status: 'helping' });

    const response = await auth(request(app).get('/api/treatments'));

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      name: 'Physio',
      injuryId: injuryA.id,
      injuryName: injuryA.name,
    });

    // The whole point of including them: no second request per treatment.
    expect(response.body[0].outcomes).toHaveLength(1);
    expect(response.body[0].outcomes[0].status).toBe('helping');
  });

  test("never returns another user's treatments", async () => {
    await auth(
      request(app).post(`/api/injuries/${injuryA.id}/treatments`)
    ).send({ name: 'Physio', date: '2025-02-01T00:00:00.000Z' });

    const otherToken = await createTestUser();
    const response = await auth(request(app).get('/api/treatments'), otherToken);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });
});
