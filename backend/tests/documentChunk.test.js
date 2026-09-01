import { jest } from '@jest/globals';
import { prisma } from '../src/utils.js';

import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
  createTestInjury,
} from './setup.js';

jest.setTimeout(30000);

let injuryA;
let userBId;

beforeEach(async () => {
  await cleanDatabase();

  const tokenA = await createTestUser();
  const tokenB = await createTestUser();

  const createdInjury = await createTestInjury(tokenA);
  injuryA = await prisma.injury.findUnique({ where: { id: createdInjury.id } });

  const userB = await prisma.user.findFirst({
    where: { NOT: { id: injuryA.userId } },
  });
  userBId = userB.id;

  // createTestUser doesn't return the user's own id, and this test only
  // needs "a different user's id" -- tokenB is otherwise unused.
  void tokenB;
});

afterAll(async () => {
  await disconnectDatabase();
});

const insertChunk = (injuryId, userId) =>
  prisma.$executeRaw`
    INSERT INTO "DocumentChunk"
      ("injuryId", "userId", "sourceType", "sourceId", "chunkIndex", "content", "embeddingModel", "embeddingModelVersion")
    VALUES
      (${injuryId}, ${userId}, 'symptom', 1, 0, 'test chunk', 'test-model', '1')
  `;

describe('DocumentChunk ownership integrity', () => {
  test('rejects a chunk whose userId does not match its injury owner', async () => {
    await expect(insertChunk(injuryA.id, userBId)).rejects.toThrow();
  });

  test('accepts a chunk whose userId matches its injury owner', async () => {
    await expect(insertChunk(injuryA.id, injuryA.userId)).resolves.toBe(1);
  });
});
