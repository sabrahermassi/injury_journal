import { jest } from '@jest/globals';
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
