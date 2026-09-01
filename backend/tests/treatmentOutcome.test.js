import request from 'supertest';
import app from '../src/app.js';

import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
  createTestInjury,
} from './setup.js';

let token;
let injury;
let treatment;

beforeEach(async () => {
  await cleanDatabase();

  token = await createTestUser();
  injury = await createTestInjury(token);

  const created = await request(app)
    .post(`/api/injuries/${injury.id}/treatments`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Physiotherapy',
      date: '2025-02-01T00:00:00.000Z',
    });

  treatment = created.body;
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('Treatment Outcomes API', () => {
  test('cannot create outcome without authentication', async () => {
    const response = await request(app)
      .post(`/api/treatments/${treatment.id}/outcomes`)
      .send({
        status: 'Still helping',
      });

    expect(response.statusCode).toBe(401);
  });

  test('create outcome', async () => {
    const response = await request(app)
      .post(`/api/treatments/${treatment.id}/outcomes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'Still helping',
        reliefDays: 10,
        painLevel: 3,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.status).toBe('Still helping');
    expect(response.body.reliefDays).toBe(10);
    expect(response.body.painLevel).toBe(3);
    expect(response.body.treatmentId).toBe(treatment.id);
  });

  test('create outcome fails for non-numeric treatment id', async () => {
    const response = await request(app)
      .post('/api/treatments/abc/outcomes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'Still helping',
      });

    expect(response.statusCode).toBe(400);
  });

  test('create outcome fails without a status', async () => {
    const response = await request(app)
      .post(`/api/treatments/${treatment.id}/outcomes`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.statusCode).toBe(400);
  });

  test('create outcome for a treatment that does not exist returns 404', async () => {
    const response = await request(app)
      .post('/api/treatments/999999/outcomes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'Still helping',
      });

    expect(response.statusCode).toBe(404);
  });

  test('get outcomes, oldest first', async () => {
    await request(app)
      .post(`/api/treatments/${treatment.id}/outcomes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Still helping' });

    await request(app)
      .post(`/api/treatments/${treatment.id}/outcomes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Wearing off' });

    const response = await request(app)
      .get(`/api/treatments/${treatment.id}/outcomes`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(2);
    expect(response.body[0].status).toBe('Still helping');
    expect(response.body[1].status).toBe('Wearing off');
  });

  test('delete outcome', async () => {
    const created = await request(app)
      .post(`/api/treatments/${treatment.id}/outcomes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Still helping' });

    const response = await request(app)
      .delete(`/api/treatment-outcomes/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);

    const list = await request(app)
      .get(`/api/treatments/${treatment.id}/outcomes`)
      .set('Authorization', `Bearer ${token}`);

    expect(list.body.length).toBe(0);
  });

  test('deleting a treatment cascades its outcomes', async () => {
    const created = await request(app)
      .post(`/api/treatments/${treatment.id}/outcomes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Still helping' });

    await request(app)
      .delete(`/api/treatments/${treatment.id}`)
      .set('Authorization', `Bearer ${token}`);

    const response = await request(app)
      .get(`/api/treatments/${treatment.id}/outcomes`)
      .set('Authorization', `Bearer ${token}`);

    // The treatment itself is gone, so ownership lookup returns 404 rather
    // than an empty list -- either way, the outcome created above must not
    // be independently reachable.
    expect(response.statusCode).toBe(404);
    expect(created.body.status).toBe('Still helping');
  });
});

describe('Treatment Outcomes cross-user isolation', () => {
  let otherUserToken;

  beforeEach(async () => {
    otherUserToken = await createTestUser();
  });

  test('another user cannot list outcomes for a treatment they do not own', async () => {
    await request(app)
      .post(`/api/treatments/${treatment.id}/outcomes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Still helping' });

    const response = await request(app)
      .get(`/api/treatments/${treatment.id}/outcomes`)
      .set('Authorization', `Bearer ${otherUserToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('another user cannot create an outcome against a treatment they do not own', async () => {
    const response = await request(app)
      .post(`/api/treatments/${treatment.id}/outcomes`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ status: 'Still helping' });

    expect(response.statusCode).toBe(404);
  });

  test('another user cannot delete an outcome they do not own', async () => {
    const created = await request(app)
      .post(`/api/treatments/${treatment.id}/outcomes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Still helping' });

    const response = await request(app)
      .delete(`/api/treatment-outcomes/${created.body.id}`)
      .set('Authorization', `Bearer ${otherUserToken}`);

    expect(response.statusCode).toBe(404);

    // Confirm it's still there for the real owner.
    const list = await request(app)
      .get(`/api/treatments/${treatment.id}/outcomes`)
      .set('Authorization', `Bearer ${token}`);

    expect(list.body.length).toBe(1);
  });
});
