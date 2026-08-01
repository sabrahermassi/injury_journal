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

  token = await createTestUser();

  injury = await createTestInjury(token);
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('Treatments API', () => {
  test('cannot create treatment without authentication', async () => {
    const response = await request(app)
      .post(`/api/injuries/${injury.id}/treatments`)
      .send({
        name: 'Physiotherapy',
        provider: 'Clinic',
        date: '2025-02-01T00:00:00.000Z',
        cost: 100,
        outcome: 'Improved mobility',
      });

    expect(response.statusCode).toBe(401);
  });

  test('create treatment', async () => {
    const response = await request(app)
      .post(`/api/injuries/${injury.id}/treatments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Physiotherapy',
        provider: 'Sports Clinic',
        date: '2025-02-01T00:00:00.000Z',
        cost: 100,
        outcome: 'Reduced pain',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.name).toBe('Physiotherapy');
  });

  test('get treatments', async () => {
    await request(app)
      .post(`/api/injuries/${injury.id}/treatments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Physiotherapy',
        date: '2025-02-01T00:00:00.000Z',
      });

    const response = await request(app)
      .get(`/api/injuries/${injury.id}/treatments`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
  });

  test('update treatment', async () => {
    const created = await request(app)
      .post(`/api/injuries/${injury.id}/treatments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Physiotherapy',
        date: '2025-02-01T00:00:00.000Z',
      });

    const response = await request(app)
      .put(`/api/treatments/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        outcome: 'No improvement',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.outcome).toBe('No improvement');
  });

  test('delete treatment', async () => {
    const created = await request(app)
      .post(`/api/injuries/${injury.id}/treatments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Injection',
        date: '2025-02-01T00:00:00.000Z',
      });

    const response = await request(app)
      .delete(`/api/treatments/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });
});
