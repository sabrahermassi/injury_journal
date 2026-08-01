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

describe('Medical Visits API', () => {
  test('cannot create medical visit without authentication', async () => {
    const response = await request(app)
      .post(`/api/injuries/${injury.id}/visits`)
      .send({
        doctor: 'Dr Smith',
        clinic: 'Orthopedic Clinic',
        date: '2025-02-07T00:00:00.000Z',
        notes: 'Recommended MRI and physiotherapy',
      });

    expect(response.statusCode).toBe(401);
  });

  test('create medical visit', async () => {
    const response = await request(app)
      .post(`/api/injuries/${injury.id}/visits`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        doctor: 'Dr Smith',
        clinic: 'Orthopedic Clinic',
        date: '2025-02-07T00:00:00.000Z',
        notes: 'Recommended MRI and physiotherapy',
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.doctor).toBe('Dr Smith');
  });

  test('get medical visits', async () => {
    await request(app)
      .post(`/api/injuries/${injury.id}/visits`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        doctor: 'Dr Smith',
        clinic: 'Orthopedic Clinic',
        date: '2025-02-07T00:00:00.000Z',
        notes: 'MRI requested',
      });

    const response = await request(app)
      .get(`/api/injuries/${injury.id}/visits`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.length).toBe(1);
  });

  test('update medical visit', async () => {
    const created = await request(app)
      .post(`/api/injuries/${injury.id}/visits`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        doctor: 'Dr Smith',
        clinic: 'Clinic',
        date: '2025-02-07T00:00:00.000Z',
        notes: 'Initial notes',
      });

    const response = await request(app)
      .put(`/api/visits/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        notes: 'Updated notes after MRI',
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.notes).toBe('Updated notes after MRI');
  });

  test('delete medical visit', async () => {
    const created = await request(app)
      .post(`/api/injuries/${injury.id}/visits`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        doctor: 'Dr Smith',
        clinic: 'Clinic',
        date: '2025-02-07T00:00:00.000Z',
      });

    const response = await request(app)
      .delete(`/api/visits/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });
});
