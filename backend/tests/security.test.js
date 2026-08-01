import request from 'supertest';
import app from '../src/app.js';

import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
  createTestInjury,
} from './setup.js';

let userAToken;
let userBToken;

let injuryB;

beforeEach(async () => {
  await cleanDatabase();

  // User A
  userAToken = await createTestUser();

  // User B
  userBToken = await createTestUser();

  // Create injury owned by User B
  injuryB = await createTestInjury(userBToken);
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('Authorization security', () => {
  test('User A cannot view User B injuries', async () => {
    const response = await request(app)
      .get('/api/injuries')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test('User A cannot get User B injury by id', async () => {
    const response = await request(app)
      .get(`/api/injuries/${injuryB.id}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot update User B injury', async () => {
    const response = await request(app)
      .put(`/api/injuries/${injuryB.id}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'Changed injury',
        bodyArea: 'Hip',
        side: 'Left',
        startDate: '2025-01-01T00:00:00.000Z',
        cause: 'Running',
        description: 'Changed',
        status: 'Active',
      });

    expect(response.statusCode).toBe(404);
  });

  test('User A cannot delete User B injury', async () => {
    const response = await request(app)
      .delete(`/api/injuries/${injuryB.id}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(response.statusCode).toBe(404);
  });
});
