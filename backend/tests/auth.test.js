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
    expect(response.body.csrfToken).toBeDefined();

    const cookies = response.headers['set-cookie'] || [];

    expect(cookies.some((cookie) => cookie.startsWith('token='))).toBe(true);
    expect(cookies.some((cookie) => cookie.startsWith('csrfToken='))).toBe(
      true
    );
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

  test('logout clears the auth and CSRF cookies', async () => {
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      email: 'logout-test@test.com',
      password: 'password123',
    });
    const login = await agent.post('/api/auth/login').send({
      email: 'logout-test@test.com',
      password: 'password123',
    });

    const csrfToken = login.headers['set-cookie']
      .find((cookie) => cookie.startsWith('csrfToken='))
      .split(';')[0]
      .split('=')[1];

    const response = await agent
      .post('/api/auth/logout')
      .set('X-CSRF-Token', csrfToken);

    expect(response.statusCode).toBe(204);

    const cookies = response.headers['set-cookie'] || [];
    const clearedCookie = (name) =>
      cookies.some(
        (cookie) =>
          cookie.startsWith(`${name}=;`) &&
          /Expires=Thu, 01 Jan 1970/.test(cookie)
      );

    expect(clearedCookie('token')).toBe(true);
    expect(clearedCookie('csrfToken')).toBe(true);
  });
});

describe('CSRF protection for cookie-authenticated requests', () => {
  const extractCookieValue = (cookies, name) => {
    const cookie = cookies.find((entry) => entry.startsWith(`${name}=`));

    return cookie.split(';')[0].split('=')[1];
  };

  test('rejects a cookie-authenticated mutation with no CSRF header', async () => {
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      email: 'csrf-test@test.com',
      password: 'password123',
    });
    await agent.post('/api/auth/login').send({
      email: 'csrf-test@test.com',
      password: 'password123',
    });

    const response = await agent.post('/api/injuries').send({
      name: 'Lower back pain',
      bodyArea: 'Lower back',
      side: 'Left',
      startDate: '2025-01-01T00:00:00.000Z',
      cause: 'Deadlift',
      description: 'Started after heavy lifting',
      status: 'Active',
    });

    expect(response.statusCode).toBe(403);
  });

  test('accepts a cookie-authenticated mutation with a matching CSRF header', async () => {
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      email: 'csrf-test-2@test.com',
      password: 'password123',
    });
    const login = await agent.post('/api/auth/login').send({
      email: 'csrf-test-2@test.com',
      password: 'password123',
    });

    const csrfToken = extractCookieValue(
      login.headers['set-cookie'],
      'csrfToken'
    );

    const response = await agent
      .post('/api/injuries')
      .set('X-CSRF-Token', csrfToken)
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
  });

  test('header-authenticated requests (no auth cookie) are exempt from CSRF check', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'csrf-test-3@test.com',
      password: 'password123',
    });
    const login = await request(app).post('/api/auth/login').send({
      email: 'csrf-test-3@test.com',
      password: 'password123',
    });

    const response = await request(app)
      .post('/api/injuries')
      .set('Authorization', `Bearer ${login.body.token}`)
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
  });
});
