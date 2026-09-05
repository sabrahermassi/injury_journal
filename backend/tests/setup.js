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

// A single TRUNCATE instead of 7 sequential deleteMany() calls, for two
// reasons: it's one atomic statement, so there's no window between "delete
// Treatment rows" and "delete Injury rows" for a concurrent writer to insert
// into (the FK-restrict race behind #89); and CASCADE means the delete order
// doesn't have to be hand-maintained -- the previous list had already drifted
// out of sync with the schema (TreatmentOutcome was missing, and only
// survived because it cascades from Treatment).
export const cleanDatabase = async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "User", "RefreshToken", "Injury", "TimelineEvent", "Symptom", "Treatment", "TreatmentOutcome", "MedicalVisit", "DocumentChunk" RESTART IDENTITY CASCADE;'
  );
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
