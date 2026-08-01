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

beforeEach(async () => {
  await cleanDatabase();

  token = await createTestUser('usera@test.com');

  injury = await createTestInjury(token);
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('Symptoms API', () => {
  test('cannot create symptom without authentication', async () => {
    const response = await request(app)
      .post(`/api/injuries/${injury.id}/symptoms`)
      .send({
        location: 'Left hip',
        painLevel: 7,
        date: '2025-02-01T00:00:00.000Z',
        notes: 'Pain after walking',
      });

    expect(response.statusCode).toBe(401);
  });

  test('create symptom', async () => {
    const response = await request(app)
      .post(`/api/injuries/${injury.id}/symptoms`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        location: 'Left hip',
        painLevel: 7,
        date: '2025-02-01T00:00:00.000Z',
        notes: 'Pain after walking',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.location).toBe('Left hip');
  });

  test('get symptoms', async () => {
    await request(app)
      .post(`/api/injuries/${injury.id}/symptoms`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        location: 'Left hip',
        painLevel: 7,
        date: '2025-02-01T00:00:00.000Z',
        notes: 'Pain after walking',
      });

    const response = await request(app)
      .get(`/api/injuries/${injury.id}/symptoms`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
  });

  test('update symptom', async () => {
    const created = await request(app)
      .post(`/api/injuries/${injury.id}/symptoms`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        location: 'Left hip',
        painLevel: 5,
        date: '2025-02-01T00:00:00.000Z',
      });

    const response = await request(app)
      .put(`/api/symptoms/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        painLevel: 9,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.painLevel).toBe(9);
  });

  test('delete symptom', async () => {
    const created = await request(app)
      .post(`/api/injuries/${injury.id}/symptoms`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        location: 'Left hip',
        painLevel: 4,
        date: '2025-02-01T00:00:00.000Z',
      });

    const response = await request(app)
      .delete(`/api/symptoms/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });
});
