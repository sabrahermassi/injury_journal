import request from 'supertest';
import app from '../src/app.js';
import { cleanDatabase, disconnectDatabase } from './setup.js';

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('Authentication', () => {
  test('register new user', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'test@test.com',
      password: 'password123',
    });

    expect(response.statusCode).toBe(201);

    expect(response.body.email).toBe('test@test.com');
  });

  test('reject duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'test@test.com',
      password: 'password123',
    });

    const response = await request(app).post('/api/auth/register').send({
      email: 'test@test.com',
      password: 'password123',
    });

    expect(response.statusCode).toBe(400);
  });

  test('login with correct credentials', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'test@test.com',
      password: 'password123',
    });

    const response = await request(app).post('/api/auth/login').send({
      email: 'test@test.com',
      password: 'password123',
    });

    expect(response.statusCode).toBe(200);

    expect(response.body.token).toBeDefined();
  });

  test('reject wrong password', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'test@test.com',
      password: 'password123',
    });

    const response = await request(app).post('/api/auth/login').send({
      email: 'test@test.com',
      password: 'wrongpassword',
    });

    expect(response.statusCode).toBe(401);
  });
});
