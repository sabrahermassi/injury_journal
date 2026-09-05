// These tests document user-level data isolation (issue #91), now enforced by per-tool and
// retrieval/vector-level authorization (#95): an authenticated caller can only read their own
// injuries and chunks, whether or not an injuryId is supplied, and an injuryId belonging to
// another user is rejected rather than silently returning that user's data.

import { jest } from '@jest/globals';
import request from 'supertest';
import { storeDocumentChunk } from '../../src/embeddings/vector-storage.js';
import { prisma } from '../../src/lib/prisma.js';
import { createTestInjury, deleteTestInjury } from './test-injury-fixuture.js';
import { signTestToken } from '../helpers/auth.js';

jest.unstable_mockModule('../../src/embeddings/embedding-client.js', () => ({
  embedQuery: jest.fn(),
  EmbeddingServiceError: class EmbeddingServiceError extends Error {},
}));

jest.unstable_mockModule('../../src/llm/llm-client.js', () => ({
  generateAnswer: jest.fn(),
}));

const { embedQuery } = await import('../../src/embeddings/embedding-client.js');
const { generateAnswer } = await import('../../src/llm/llm-client.js');
const { default: app } = await import('../../src/app.js');

const mockEmbedQuery = jest.mocked(embedQuery);
const mockGenerateAnswer = jest.mocked(generateAnswer);

function vectorWith(first: number, second = 0, third = 0): number[] {
  const vector = new Array<number>(1024).fill(0);

  vector[0] = first;
  vector[1] = second;
  vector[2] = third;

  return vector;
}

describe('data isolation regression tests', () => {
  let injuryAId: number;
  let userAId: number;
  let injuryBId: number;
  let userBId: number;
  let authHeader: string;
  let authHeaderB: string;

  beforeAll(async () => {
    const a = await createTestInjury('Data Isolation Test A');
    const b = await createTestInjury('Data Isolation Test B');

    injuryAId = a.injuryId;
    userAId = a.userId;
    injuryBId = b.injuryId;
    userBId = b.userId;
    authHeader = `Bearer ${signTestToken(userAId)}`;
    authHeaderB = `Bearer ${signTestToken(userBId)}`;

    await storeDocumentChunk(
      injuryAId,
      userAId,
      'data-isolation-integration-test',
      1,
      0,
      'Chunk belonging to injury A',
      vectorWith(1, 0, 0),
      'test-model',
      'test-version',
    );

    await storeDocumentChunk(
      injuryBId,
      userBId,
      'data-isolation-integration-test',
      2,
      0,
      'Chunk belonging to injury B',
      vectorWith(1, 0, 0),
      'test-model',
      'test-version',
    );
  });

  afterAll(async () => {
    await deleteTestInjury(injuryAId, userAId);
    await deleteTestInjury(injuryBId, userBId);
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockEmbedQuery.mockResolvedValue({
      embedding: vectorWith(1, 0, 0),
      model: 'test-model',
      modelVersion: 'test-version',
      dimension: 1024,
      version: 'test',
    });

    mockGenerateAnswer.mockResolvedValue('mocked agent answer');
  });

  // Both test injuries are bare (no symptoms/treatments/etc.), so both go
  // through the whole-record journal path rather than RAG -- the stored
  // document chunks above exist only to prove they are NOT what gets
  // returned once an injury has enough of its own content to answer from
  // directly. The isolation property under test is unchanged: a request
  // scoped to injury A's id must return only injury A's data.
  it('scopes retrieval to the requested injuryId and excludes another injury/user', async () => {
    const response = await request(app)
      .post('/ai-agent')
      .set('Authorization', authHeader)
      .send({
        question: 'What treatments did I have?',
        injuryId: injuryAId,
      });

    expect(response.status).toBe(200);

    expect(response.body.metadata.retrievedChunks).toEqual([
      {
        sourceType: 'injury',
        sourceId: injuryAId,
        injuryId: injuryAId,
      },
    ]);
  });

  it('scopes retrieval to the caller\'s own injuries across the journal when injuryId is omitted', async () => {
    const response = await request(app)
      .post('/ai-agent')
      .set('Authorization', authHeader)
      .send({
        question: 'What treatments did I have?',
      });

    expect(response.status).toBe(200);

    const injuryIds = (
      response.body.metadata.retrievedChunks as { injuryId: number }[]
    )
      .map((chunk) => chunk.injuryId)
      .sort();

    // User A owns only injury A, so nothing from injury B (user B's) can
    // appear here even though both users have chunks stored.
    expect(injuryIds).toEqual([injuryAId]);
  });

  it('rejects a journal request for an injuryId owned by another user', async () => {
    const response = await request(app)
      .post('/ai-agent')
      .set('Authorization', authHeader)
      .send({
        question: 'Show me my injury timeline',
        injuryId: injuryBId,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      answer: 'No injury record was found.',
      citations: [],
      intent: 'journal',
      metadata: {
        retrievedChunks: [],
      },
    });

    expect(mockGenerateAnswer).not.toHaveBeenCalled();
  });

  it('rejects a journal request for an injuryId owned by another user (mirrored direction)', async () => {
    const response = await request(app)
      .post('/ai-agent')
      .set('Authorization', authHeaderB)
      .send({
        question: 'Show me my injury timeline',
        injuryId: injuryAId,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      answer: 'No injury record was found.',
      citations: [],
      intent: 'journal',
      metadata: {
        retrievedChunks: [],
      },
    });

    expect(mockGenerateAnswer).not.toHaveBeenCalled();
  });
});
