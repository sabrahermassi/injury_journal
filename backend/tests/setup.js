import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/utils.js';

jest.setTimeout(30000);

// cleanDatabase() deletes every row in every table. Before this guard existed,
// nothing loaded .env.test for Jest -- NODE_ENV=test only changed app behaviour
// like rate limiting, and prisma.config.ts is read by the Prisma CLI, never by
// Jest -- so Prisma Client fell back to .env and the suite wiped the
// development database on every run.
//
// src/loadEnv.js now selects .env.test under NODE_ENV=test. This asserts the
// result rather than trusting it: a destructive helper should refuse to run
// anywhere but a test database, whatever the env loading happens to do.
// Same reasoning as the guards in ai-injury-assistant/prisma/seed-dev.ts.
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Refusing to run tests: DATABASE_URL is not set.');
}

const databaseName = new URL(databaseUrl).pathname.slice(1);

if (!/test/i.test(databaseName)) {
  throw new Error(
    `Refusing to run tests against database "${databaseName}": its name does ` +
      'not identify it as a test database, and these tests delete every row in ' +
      'every table. ' +
      'Check backend/.env.test, and that NODE_ENV=test is set (npm test does ' +
      'this via cross-env).'
  );
}

export const cleanDatabase = async () => {
  await prisma.documentChunk.deleteMany();
  await prisma.medicalVisit.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.symptom.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.injury.deleteMany();
  await prisma.user.deleteMany();
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
};

export const createTestUser = async () => {
  const email = `test-${Date.now()}@example.com`;

  await request(app).post('/api/auth/register').send({
    email,
    password: 'password123',
  });

  const login = await request(app).post('/api/auth/login').send({
    email,
    password: 'password123',
  });

  return login.body.token;
};

export const createTestInjury = async (token) => {
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

  return response.body;
};

export const createTestSymptom = async (token, injuryId) => {
  const response = await request(app)
    .post(`/api/injuries/${injuryId}/symptoms`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      location: 'Left hip',
      painLevel: 7,
      date: '2025-02-01T00:00:00.000Z',
      notes: 'Pain after walking',
    });

  return response.body;
};

export const createTestTreatment = async (token, injuryId) => {
  const response = await request(app)
    .post(`/api/injuries/${injuryId}/treatments`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Physiotherapy',
      provider: 'Sports Clinic',
      date: '2025-02-01T00:00:00.000Z',
      cost: 100,
      outcome: 'Reduced pain',
    });

  return response.body;
};

export const createTestMedicalVisit = async (token, injuryId) => {
  const response = await request(app)
    .post(`/api/injuries/${injuryId}/visits`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      doctor: 'Dr Smith',
      clinic: 'Orthopedic Clinic',
      date: '2025-02-07T00:00:00.000Z',
      notes: 'Recommended MRI and physiotherapy',
    });

  return response.body;
};

export const createTestTimelineEvent = async (token, injuryId) => {
  const response = await request(app)
    .post(`/api/injuries/${injuryId}/events`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      type: 'Doctor visit',
      description: 'MRI appointment',
      date: '2025-02-01T00:00:00.000Z',
    });

  return response.body;
};

export const createTestTreatmentOutcome = async (token, treatmentId) => {
  const response = await request(app)
    .post(`/api/treatments/${treatmentId}/outcomes`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      status: 'Still helping',
      reliefDays: 10,
      painLevel: 3,
    });

  return response.body;
};
