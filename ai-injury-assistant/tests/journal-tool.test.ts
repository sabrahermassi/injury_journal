import { jest } from '@jest/globals';

const findFirstMock = jest.fn();
const findManyMock = jest.fn();

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    injury: {
      findFirst: findFirstMock,
      findMany: findManyMock,
    },
  })),
}));

const {
  journalTool,
  journalToolAll,
  formatInjuryRecord,
  formatInjuryRecords,
  collectRecordSources,
  estimateTokens,
} = await import('../src/ai-agent/tools/journal-tool.js');

// Records are ordered by date so the model can reason about progression;
// treatments carry their check-ins.
const expectedInclude = {
  Treatment: {
    orderBy: { date: 'asc' },
    include: { TreatmentOutcome: { orderBy: { recordedAt: 'asc' } } },
  },
  Symptom: { orderBy: { date: 'asc' } },
  TimelineEvent: { orderBy: { date: 'asc' } },
  MedicalVisit: { orderBy: { date: 'asc' } },
};

function baseInjury() {
  return {
    id: 1,
    name: 'Sprained ankle',
    bodyArea: 'ankle',
    side: null,
    startDate: new Date('2026-01-05'),
    cause: null,
    description: null,
    status: null,
    createdAt: new Date('2026-01-05'),
    userId: 1,
    Treatment: [],
    Symptom: [],
    TimelineEvent: [],
    MedicalVisit: [],
  };
}

function treatment(overrides = {}) {
  return {
    id: 1,
    name: 'Physiotherapy',
    provider: 'Dr. Lee',
    date: new Date('2026-01-08'),
    cost: null,
    outcome: null,
    followUpDueAt: null,
    courseId: null,
    createdAt: new Date('2026-01-08'),
    updatedAt: new Date('2026-01-08'),
    injuryId: 1,
    TreatmentOutcome: [],
    ...overrides,
  };
}

describe('journalTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queries the injury by id and userId with all relations included', async () => {
    const injury = baseInjury();
    findFirstMock.mockResolvedValue(injury);

    const result = await journalTool(1, 1);

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: 1, userId: 1 },
      include: expectedInclude,
    });
    expect(result).toBe(injury);
  });

  it('returns null when no injury is found', async () => {
    findFirstMock.mockResolvedValue(null);

    expect(await journalTool(999, 1)).toBeNull();
  });

  it('returns null when the injury exists but belongs to a different user', async () => {
    findFirstMock.mockResolvedValue(null);

    const result = await journalTool(1, 2);

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: 1, userId: 2 },
      include: expectedInclude,
    });
    expect(result).toBeNull();
  });
});

describe('journalToolAll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('scopes to the user and returns every injury', async () => {
    const injuries = [baseInjury()];
    findManyMock.mockResolvedValue(injuries);

    const result = await journalToolAll(1);

    expect(findManyMock).toHaveBeenCalledWith({
      where: { userId: 1 },
      orderBy: { startDate: 'asc' },
      include: expectedInclude,
    });
    expect(result).toBe(injuries);
  });
});

describe('formatInjuryRecord', () => {
  it('formats a minimal record with no optional fields or relations', () => {
    expect(formatInjuryRecord(baseInjury())).toBe(
      'Injury:\nName: Sprained ankle\nBody area: ankle\nStart date: 2026-01-05',
    );
  });

  it('includes optional injury fields and the side annotation when present', () => {
    const result = formatInjuryRecord({
      ...baseInjury(),
      side: 'left',
      cause: 'Fell while running',
      status: 'Recovering',
      description: 'Rolled ankle on uneven pavement',
    });

    expect(result).toBe(
      [
        'Injury:',
        'Name: Sprained ankle',
        'Body area: ankle (left)',
        'Start date: 2026-01-05',
        'Cause: Fell while running',
        'Status: Recovering',
        'Description: Rolled ankle on uneven pavement',
      ].join('\n'),
    );
  });

  it('includes symptom trigger and duration, which retrieval-era formatting dropped', () => {
    const result = formatInjuryRecord({
      ...baseInjury(),
      Symptom: [
        {
          id: 1,
          date: new Date('2026-01-06'),
          painLevel: 6,
          location: 'ankle',
          trigger: 'walking downstairs',
          duration: 'a few hours',
          notes: 'Worse after walking',
          injuryId: 1,
        },
      ],
    });

    expect(result).toContain(
      '- 2026-01-06: pain level 6 at ankle, triggered by walking downstairs, lasting a few hours — Worse after walking',
    );
  });

  it('includes treatment check-ins, which were previously invisible entirely', () => {
    const result = formatInjuryRecord({
      ...baseInjury(),
      Treatment: [
        treatment({
          name: 'Cortisone Injection',
          cost: 210,
          courseId: 'cortisone-2026',
          TreatmentOutcome: [
            {
              id: 1,
              recordedAt: new Date('2026-02-01'),
              status: 'improved',
              reliefDays: 40,
              painLevel: 4,
              notes: 'Big relief',
              createdAt: new Date('2026-02-01'),
              treatmentId: 1,
            },
            {
              id: 2,
              recordedAt: new Date('2026-03-01'),
              status: 'no-change',
              reliefDays: 5,
              painLevel: 7,
              notes: null,
              createdAt: new Date('2026-03-01'),
              treatmentId: 1,
            },
          ],
        }),
      ],
    });

    expect(result).toContain(
      '- 2026-01-08: Cortisone Injection (Dr. Lee), cost 210, part of course "cortisone-2026"',
    );
    expect(result).toContain(
      '    - check-in 2026-02-01: improved, 40 days of relief, pain level 4 — Big relief',
    );
    expect(result).toContain(
      '    - check-in 2026-03-01: no-change, 5 days of relief, pain level 7',
    );
  });

  it('formats timeline events and medical visits', () => {
    const result = formatInjuryRecord({
      ...baseInjury(),
      TimelineEvent: [
        {
          id: 1,
          type: 'follow-up',
          date: new Date('2026-01-12'),
          description: 'Reassessed range of motion',
          result: 'Cleared for light activity',
          injuryId: 1,
        },
      ],
      MedicalVisit: [
        {
          id: 1,
          doctor: 'Dr. Lee',
          clinic: 'Downtown Clinic',
          date: new Date('2026-01-07'),
          notes: 'X-ray clear',
          injuryId: 1,
        },
      ],
    });

    expect(result).toContain(
      'Timeline events:\n- 2026-01-12: follow-up — Reassessed range of motion (Cleared for light activity)',
    );
    expect(result).toContain(
      'Medical visits:\n- 2026-01-07: Dr. Lee at Downtown Clinic — X-ray clear',
    );
  });
});

describe('formatInjuryRecords', () => {
  it('heads each injury so several can be told apart in one context', () => {
    const result = formatInjuryRecords([
      { ...baseInjury(), id: 1, name: 'Lower back strain' },
      { ...baseInjury(), id: 2, name: 'Sprained ankle' },
    ]);

    expect(result).toContain('=== Lower back strain (injury #1) ===');
    expect(result).toContain('=== Sprained ankle (injury #2) ===');
  });
});

describe('collectRecordSources', () => {
  it('emits one source per record, with the injury citing itself', () => {
    const sources = collectRecordSources({
      ...baseInjury(),
      Symptom: [
        {
          id: 7,
          date: new Date('2026-01-06'),
          painLevel: 6,
          location: null,
          trigger: null,
          duration: null,
          notes: null,
          injuryId: 1,
        },
      ],
      Treatment: [treatment({ id: 9 })],
    });

    // An injury is its own source -- citation-verifier.ts relies on
    // sourceId === injuryId for this type.
    expect(sources).toContainEqual({
      sourceType: 'injury',
      sourceId: 1,
      injuryId: 1,
      metadata: { date: '2026-01-05' },
    });
    expect(sources).toContainEqual({
      sourceType: 'symptom',
      sourceId: 7,
      injuryId: 1,
      metadata: { date: '2026-01-06' },
    });
    expect(sources).toContainEqual({
      sourceType: 'treatment',
      sourceId: 9,
      injuryId: 1,
      metadata: { date: '2026-01-08' },
    });
  });
});

describe('estimateTokens', () => {
  it('approximates four characters per token', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('a'.repeat(4000))).toBe(1000);
  });

  it('rounds up so a short string is never free', () => {
    expect(estimateTokens('ab')).toBe(1);
  });
});
