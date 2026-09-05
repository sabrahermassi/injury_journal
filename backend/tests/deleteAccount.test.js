import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/utils.js';

import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
  createTestInjury,
} from './setup.js';

// DELETE /api/auth/me. The risk here is the opposite of most endpoints: not
// that it leaks, but that it either leaves orphaned records behind or reaches
// records it does not own.

let token;
let injury;

const auth = (req, t = token) => req.set('Authorization', `Bearer ${t}`);

beforeEach(async () => {
  await cleanDatabase();

  token = await createTestUser();
  injury = await createTestInjury(token);
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('DELETE /api/auth/me', () => {
  test('requires authentication', async () => {
    const response = await request(app).delete('/api/auth/me');

    expect(response.statusCode).toBe(401);
  });

  test('removes the account and every record hanging off it', async () => {
    const treatment = await auth(
      request(app).post(`/api/injuries/${injury.id}/treatments`)
    ).send({ name: 'Physio', date: '2025-02-01T00:00:00.000Z' });

    await auth(
      request(app).post(`/api/treatments/${treatment.body.id}/outcomes`)
    ).send({ status: 'helping' });

    await auth(request(app).post(`/api/injuries/${injury.id}/symptoms`)).send({
      painLevel: 6,
      date: '2025-02-02T00:00:00.000Z',
    });
    await auth(request(app).post(`/api/injuries/${injury.id}/visits`)).send({
      doctor: 'Dr Okafor',
      date: '2025-02-03T00:00:00.000Z',
    });
    await auth(request(app).post(`/api/injuries/${injury.id}/events`)).send({
      type: 'symptom',
      date: '2025-02-04T00:00:00.000Z',
      description: 'Flare-up',
    });

    const response = await auth(request(app).delete('/api/auth/me'));

    expect(response.statusCode).toBe(204);

    // Nothing orphaned: TreatmentOutcome cascades from Treatment and
    // DocumentChunk from Injury, but the rest are deleted explicitly, so all
    // of them are worth asserting.
    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.injury.count()).toBe(0);
    expect(await prisma.symptom.count()).toBe(0);
    expect(await prisma.treatment.count()).toBe(0);
    expect(await prisma.treatmentOutcome.count()).toBe(0);
    expect(await prisma.medicalVisit.count()).toBe(0);
    expect(await prisma.timelineEvent.count()).toBe(0);
  });

  test('leaves other users untouched', async () => {
    const otherToken = await createTestUser();
    const otherInjury = await createTestInjury(otherToken);

    await auth(request(app).delete('/api/auth/me'));

    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.injury.count()).toBe(1);

    const survivors = await auth(request(app).get('/api/injuries'), otherToken);
    expect(survivors.statusCode).toBe(200);
    expect(survivors.body).toHaveLength(1);
    expect(survivors.body[0].id).toBe(otherInjury.id);
  });

  test('the deleted account can no longer authenticate', async () => {
    await auth(request(app).delete('/api/auth/me'));

    // The JWT is still cryptographically valid until it expires -- what has to
    // fail is the lookup behind it.
    const response = await auth(request(app).get('/api/injuries'));

    expect(response.statusCode).not.toBe(200);
  });
});
