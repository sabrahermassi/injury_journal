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

describe('Native session handling', () => {
  const credentials = {
    email: 'native@test.com',
    password: 'password123',
  };

  const registerNative = () =>
    request(app)
      .post('/api/auth/register')
      .set('X-Client', 'native')
      .send(credentials);

  test('register signs the user in, so no follow-up login is needed', async () => {
    const response = await registerNative();

    expect(response.statusCode).toBe(201);
    expect(response.body.token).toBeDefined();

    const injuries = await request(app)
      .get('/api/injuries')
      .set('Authorization', `Bearer ${response.body.token}`);

    expect(injuries.statusCode).toBe(200);
  });

  test('a refresh token is issued only when the client asks for one', async () => {
    const native = await registerNative();

    expect(native.body.refreshToken).toBeDefined();

    // The web login response must not grow this field -- see isNativeClient
    // in controllers.js.
    const web = await request(app).post('/api/auth/login').send(credentials);

    expect(web.statusCode).toBe(200);
    expect(web.body.refreshToken).toBeUndefined();
  });

  test('GET /auth/me identifies the bearer of a valid token', async () => {
    const { body } = await registerNative();

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${body.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.email).toBe(credentials.email);
    expect(response.body.password).toBeUndefined();
  });

  test('GET /auth/me rejects a junk token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(response.statusCode).toBe(401);
  });

  test('refresh returns a working access token and rotates the refresh token', async () => {
    const { body } = await registerNative();

    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: body.refreshToken });

    expect(refreshed.statusCode).toBe(200);
    expect(refreshed.body.refreshToken).not.toBe(body.refreshToken);

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${refreshed.body.token}`);

    expect(me.statusCode).toBe(200);
    expect(me.body.email).toBe(credentials.email);
  });

  test('a rotated refresh token cannot be used again', async () => {
    const { body } = await registerNative();

    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: body.refreshToken });

    const replay = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: body.refreshToken });

    expect(replay.statusCode).toBe(401);
  });

  test('two concurrent refreshes of the same token produce only one successor', async () => {
    const { body } = await registerNative();

    const [first, second] = await Promise.all([
      request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: body.refreshToken }),
      request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: body.refreshToken }),
    ]);

    const statusCodes = [first.statusCode, second.statusCode].sort();

    expect(statusCodes).toEqual([200, 401]);

    const winner = first.statusCode === 200 ? first : second;

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${winner.body.token}`);

    expect(me.statusCode).toBe(200);
  });

  test('replaying a rotated token revokes the whole family', async () => {
    const { body } = await registerNative();

    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: body.refreshToken });

    // The stolen (already-rotated) copy is presented. That invalidates the
    // legitimate client's current token too -- we can't tell which caller is
    // which, so the session ends for both.
    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: body.refreshToken });

    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: refreshed.body.refreshToken });

    expect(response.statusCode).toBe(401);
  });

  test('logout revokes the refresh token it is given', async () => {
    const { body } = await registerNative();

    const loggedOut = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: body.refreshToken });

    expect(loggedOut.statusCode).toBe(204);

    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: body.refreshToken });

    expect(response.statusCode).toBe(401);
  });

  test('an unknown refresh token is rejected', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'a'.repeat(64) });

    expect(response.statusCode).toBe(401);
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
