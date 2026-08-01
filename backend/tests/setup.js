import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/utils.js';

jest.setTimeout(30000);

export const cleanDatabase = async () => {
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

export const createTestUser = async (email) => {
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
