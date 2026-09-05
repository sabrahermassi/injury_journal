import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/utils.js';

import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
  createTestInjury,
} from './setup.js';

// POST /api/extractions/accept — the "Accept summary" path from the extractor
// screen. What matters here is that a model's reading of free text becomes
// only the records it actually supports, and never lands in someone else's
// journal.

let token;
let injury;

const auth = (req, t = token) => req.set('Authorization', `Bearer ${t}`);

const extraction = {
  bodyArea: 'Lower back',
  painLevel: 6,
  symptoms: ['Sharp pain when bending', 'Stiffness in the morning'],
  possibleCauses: ['Lifting a heavy box'],
  note: 'Patient reports sharp lower back pain since lifting a box.',
};

beforeEach(async () => {
  await cleanDatabase();

  token = await createTestUser();
  injury = await createTestInjury(token);
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('POST /api/extractions/accept', () => {
  test('requires authentication', async () => {
    const response = await request(app)
      .post('/api/extractions/accept')
      .send({ ...extraction, injuryName: 'Back strain' });

    expect(response.statusCode).toBe(401);
  });

  test('rejects a body with neither an injury to open nor one to file against', async () => {
    const response = await auth(
      request(app).post('/api/extractions/accept')
    ).send(extraction);

    expect(response.statusCode).toBe(400);
  });

  test('opens a new injury and records each symptom against it', async () => {
    const response = await auth(
      request(app).post('/api/extractions/accept')
    ).send({ ...extraction, injuryName: 'Back strain' });

    expect(response.statusCode).toBe(201);
    expect(response.body.injury).toMatchObject({
      name: 'Back strain',
      bodyArea: 'Lower back',
      cause: 'Lifting a heavy box',
    });

    expect(response.body.symptoms).toHaveLength(2);
    expect(response.body.symptoms[0]).toMatchObject({
      painLevel: 6,
      location: 'Lower back',
      notes: 'Sharp pain when bending',
    });

    // Provenance: the original note is kept, so a model's paraphrase can be
    // told apart from something the user typed.
    expect(response.body.event.type).toBe('extraction');
    expect(response.body.event.description).toBe(extraction.note);
  });

  test('files against an existing injury without creating another', async () => {
    const response = await auth(
      request(app).post('/api/extractions/accept')
    ).send({ ...extraction, injuryId: injury.id });

    expect(response.statusCode).toBe(201);
    expect(response.body.injury.id).toBe(injury.id);
    expect(await prisma.injury.count()).toBe(1);
  });

  test('records no symptom rows when the extraction had no pain level', async () => {
    const response = await auth(
      request(app).post('/api/extractions/accept')
    ).send({
      ...extraction,
      painLevel: null,
      injuryName: 'Back strain',
    });

    expect(response.statusCode).toBe(201);

    // painLevel is a required column. Rather than invent a number, the
    // symptoms stay unrecorded and the event says so.
    expect(response.body.symptoms).toEqual([]);
    expect(await prisma.symptom.count()).toBe(0);
    expect(response.body.event.result).toMatch(/no pain level/i);
  });

  test("cannot file into another user's injury", async () => {
    const otherToken = await createTestUser();

    const response = await auth(
      request(app).post('/api/extractions/accept'),
      otherToken
    ).send({ ...extraction, injuryId: injury.id });

    expect(response.statusCode).toBe(404);

    // Nothing written at all, not even a stray injury for the other user.
    expect(await prisma.injury.count()).toBe(1);
    expect(await prisma.symptom.count()).toBe(0);
    expect(await prisma.timelineEvent.count()).toBe(0);
  });
});
