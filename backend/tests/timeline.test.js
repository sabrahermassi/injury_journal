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

describe('Timeline Events API', () => {
  test('cannot create event without authentication', async () => {
    const response = await request(app)
      .post(`/api/injuries/${injury.id}/events`)
      .send({
        type: 'Doctor visit',
        description: 'MRI appointment',
        date: '2025-02-01T00:00:00.000Z',
      });

    expect(response.statusCode).toBe(401);
  });

  test('create timeline event', async () => {
    const response = await request(app)
      .post(`/api/injuries/${injury.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'Doctor visit',
        description: 'MRI appointment',
        date: '2025-02-01T00:00:00.000Z',
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.type).toBe('Doctor visit');
  });

  test('get timeline events', async () => {
    await request(app)
      .post(`/api/injuries/${injury.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'MRI',
        description: 'Hip MRI',
        date: '2025-02-01T00:00:00.000Z',
      });

    const response = await request(app)
      .get(`/api/injuries/${injury.id}/events`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.length).toBe(1);
  });
});
