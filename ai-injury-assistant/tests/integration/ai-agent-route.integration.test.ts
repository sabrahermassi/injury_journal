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

describe('AI agent route integration', () => {
  let injuryId: number;
  let userId: number;
  let authHeader: string;
  let treatmentId: number;

  beforeAll(async () => {
    const testInjury = await createTestInjury('AI Agent Route Test');

    injuryId = testInjury.injuryId;
    userId = testInjury.userId;
    authHeader = `Bearer ${signTestToken(userId)}`;

    const treatment = await prisma.treatment.create({
      data: {
        name: 'Physiotherapy',
        date: new Date(),
        injuryId,
      },
    });

    treatmentId = treatment.id;

    await storeDocumentChunk(
      injuryId,
      userId,
      'treatment',
      treatmentId,
      0,
      'Physiotherapy helped improve my hip pain.',
      vectorWith(1, 0, 0),
      'test-model',
      'test-version',
    );
  });

  afterAll(async () => {
    await prisma.treatment.delete({ where: { id: treatmentId } });
    await deleteTestInjury(injuryId, userId);
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

  // The record here (one injury, one treatment) is far under CONTEXT_TOKEN_BUDGET,
  // so this goes through the whole-record journal path, not RAG -- RAG only
  // fires once the record is too large to hand over whole, which is covered
  // deterministically by ai-agent-orchestrator.test.ts's own budget test rather
  // than by trying to grow a fixture past the threshold here.
  it('cites the whole record, not just the questioned treatment', async () => {
    const today = new Date().toISOString().slice(0, 10);

    const response = await request(app)
      .post('/ai-agent')
      .set('Authorization', authHeader)
      .send({
        question: 'What treatments did I have?',
        injuryId,
      });

    expect(response.status).toBe(200);

    expect(response.body.answer).toBe('mocked agent answer');

    expect(response.body.citations).toEqual([
      {
        sourceType: 'injury',
        sourceId: injuryId,
        label: `Injury #${injuryId}`,
        injuryId,
        injuryName: 'AI Agent Route Test',
        date: today,
      },
      {
        sourceType: 'treatment',
        sourceId: treatmentId,
        label: `Treatment #${treatmentId}`,
        injuryId,
        injuryName: 'AI Agent Route Test',
        date: today,
      },
    ]);

    expect(response.body.metadata.retrievedChunks).toEqual([
      { sourceType: 'injury', sourceId: injuryId, injuryId },
      { sourceType: 'treatment', sourceId: treatmentId, injuryId },
    ]);

    expect(mockEmbedQuery).not.toHaveBeenCalled();

    expect(mockGenerateAnswer).toHaveBeenCalledTimes(1);
  });

  it('blocks safety-sensitive questions before retrieval or LLM generation', async () => {
    const response = await request(app)
      .post('/ai-agent')
      .set('Authorization', authHeader)
      .send({
        question: 'Do I have a fracture?',
        injuryId,
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      answer:
        'I cannot diagnose medical conditions or identify what condition you may have, but I can help summarize your recorded symptoms, tests, treatments, and medical history.',
      citations: [],
      intent: 'safety',
      metadata: {
        retrievedChunks: [],
      },
    });

    expect(mockEmbedQuery).not.toHaveBeenCalled();
    expect(mockGenerateAnswer).not.toHaveBeenCalled();
  });

  it('routes a journal question to the journal tool when injuryId is provided', async () => {
    const response = await request(app)
      .post('/ai-agent')
      .set('Authorization', authHeader)
      .send({
        question: 'Show me my injury timeline',
        injuryId,
      });

    expect(response.status).toBe(200);

    expect(response.body.answer).toBe('mocked agent answer');

    // One citation per record in the injury (the injury itself plus its
    // treatment) -- see the "cites the whole record" test above for the
    // exact shape.
    expect(response.body.citations).toHaveLength(2);

    expect(mockEmbedQuery).not.toHaveBeenCalled();

    expect(mockGenerateAnswer).toHaveBeenCalledTimes(1);

    expect(mockGenerateAnswer.mock.calls[0][1]).toContain(
      'AI Agent Route Test',
    );
  });

  it('returns a fallback message when journal answer generation is empty', async () => {
    mockGenerateAnswer.mockResolvedValue('');

    const response = await request(app)
      .post('/ai-agent')
      .set('Authorization', authHeader)
      .send({
        question: 'Show me my injury timeline',
        injuryId,
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      answer: 'Unable to generate a summary from your injury record right now.',
      citations: [],
      intent: 'journal',
      metadata: {
        retrievedChunks: [],
      },
    });

    expect(mockGenerateAnswer).toHaveBeenCalledTimes(1);
  });

  // injuryId is no longer required for journal questions: omitting it answers
  // across the caller's whole journal (journalToolAll) instead of rejecting.
  // This user owns exactly one injury, so the result is identical in shape to
  // the "cites the whole record" test above -- just reached by omission
  // rather than an explicit injuryId. The genuinely-empty-journal case (zero
  // owned injuries) is a different message and isn't exercised by this
  // shared fixture.
  it('answers using the whole journal when no injuryId is provided', async () => {
    const today = new Date().toISOString().slice(0, 10);

    const response = await request(app)
      .post('/ai-agent')
      .set('Authorization', authHeader)
      .send({
        question: 'Show me my injury timeline',
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      answer: 'mocked agent answer',
      citations: [
        {
          sourceType: 'injury',
          sourceId: injuryId,
          label: `Injury #${injuryId}`,
          injuryId,
          injuryName: 'AI Agent Route Test',
          date: today,
        },
        {
          sourceType: 'treatment',
          sourceId: treatmentId,
          label: `Treatment #${treatmentId}`,
          injuryId,
          injuryName: 'AI Agent Route Test',
          date: today,
        },
      ],
      intent: 'journal',
      metadata: {
        retrievedChunks: [
          { sourceType: 'injury', sourceId: injuryId, injuryId },
          { sourceType: 'treatment', sourceId: treatmentId, injuryId },
        ],
      },
    });

    expect(mockEmbedQuery).not.toHaveBeenCalled();
    expect(mockGenerateAnswer).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when question is empty', async () => {
    const response = await request(app)
      .post('/ai-agent')
      .set('Authorization', authHeader)
      .send({
        question: '',
        injuryId,
      });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      error: 'Question is required',
      code: 'question_required',
    });

    expect(mockEmbedQuery).not.toHaveBeenCalled();
    expect(mockGenerateAnswer).not.toHaveBeenCalled();
  });

  it('returns 401 when no Authorization header is provided', async () => {
    const response = await request(app).post('/ai-agent').send({
      question: 'What treatments did I have?',
      injuryId,
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Authentication required',
      code: 'authentication_required',
    });
    expect(mockEmbedQuery).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid token', async () => {
    const response = await request(app)
      .post('/ai-agent')
      .set('Authorization', 'Bearer not-a-real-token')
      .send({
        question: 'What treatments did I have?',
        injuryId,
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Invalid or expired token',
      code: 'invalid_token',
    });
    expect(mockEmbedQuery).not.toHaveBeenCalled();
  });
});
