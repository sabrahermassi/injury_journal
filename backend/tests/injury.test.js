import request from 'supertest';
import app from '../src/app.js';
import { cleanDatabase, disconnectDatabase } from './setup.js';

let token;

beforeEach(async () => {
  await cleanDatabase();

  await request(app).post('/api/auth/register').send({
    email: 'user@test.com',
    password: 'password123',
  });

  const login = await request(app).post('/api/auth/login').send({
    email: 'user@test.com',
    password: 'password123',
  });

  token = login.body.token;
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('Injury API', () => {
  test('cannot create injury without authentication', async () => {
    const response = await request(app).post('/api/injuries').send({
      title: 'Hip injury',
      description: 'Weightlifting injury',
    });

    expect(response.statusCode).toBe(401);
  });

  test('create injury', async () => {
    const response = await request(app)
      .post('/api/injuries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Lower back pain',
        bodyArea: 'Lower back',
        side: 'Left',
        startDate: '2025-01-01T00:00:00.000Z',
        cause: 'Deadlift',
        description: 'Started after heavy lifting',
        status: 'Active',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.name).toBe('Lower back pain');
  });

  test("get user's injuries", async () => {
    await request(app)
      .post('/api/injuries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Lower back pain',
        bodyArea: 'Lower back',
        side: 'Left',
        startDate: '2025-01-01T00:00:00.000Z',
        cause: 'Deadlift',
        description: 'Started after heavy lifting',
        status: 'Active',
      });

    const response = await request(app)
      .get('/api/injuries')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
  });
});
