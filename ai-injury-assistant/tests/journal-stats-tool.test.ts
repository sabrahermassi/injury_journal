import { jest } from '@jest/globals';

import {
  buildInjuryStats,
  buildAllInjuryStats,
} from '../src/ai-agent/tools/journal-stats-tool.js';

// buildInjuryStats reports days tracked against the current date.
const NOW = new Date('2026-03-01T00:00:00.000Z');

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterAll(() => {
  jest.useRealTimers();
});

function baseInjury(overrides = {}) {
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
    ...overrides,
  };
}

function symptom(date: string, painLevel: number, id = 1) {
  return {
    id,
    date: new Date(date),
    painLevel,
    location: null,
    trigger: null,
    duration: null,
    notes: null,
    injuryId: 1,
  };
}

function treatment(overrides = {}) {
  return {
    id: 1,
    name: 'Physiotherapy',
    provider: null,
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

function checkIn(overrides = {}) {
  return {
    id: 1,
    recordedAt: new Date('2026-02-01'),
    status: 'improved',
    reliefDays: null,
    painLevel: null,
    notes: null,
    createdAt: new Date('2026-02-01'),
    treatmentId: 1,
    ...overrides,
  };
}

describe('buildInjuryStats', () => {
  it('reports days tracked from the start date', () => {
    const result = buildInjuryStats(baseInjury());

    expect(result).toContain('Tracked for 55 days (since 2026-01-05)');
  });

  it('includes status when set', () => {
    const result = buildInjuryStats(baseInjury({ status: 'Improving' }));

    expect(result).toContain('status: Improving');
  });

  it('summarises the pain trajectory across entries', () => {
    const result = buildInjuryStats(
      baseInjury({
        Symptom: [
          symptom('2026-01-06', 8, 1),
          symptom('2026-01-20', 9, 2),
          symptom('2026-02-10', 3, 3),
        ],
      }),
    );

    expect(result).toContain(
      'Pain: 3 entries, first 8/10 (2026-01-06), latest 3/10 (2026-02-10), range 3-9',
    );
    expect(result).toContain('Pain change since first entry: lower by 5 points');
  });

  it('reports an unchanged pain level without a point count', () => {
    const result = buildInjuryStats(
      baseInjury({
        Symptom: [symptom('2026-01-06', 5, 1), symptom('2026-02-10', 5, 2)],
      }),
    );

    expect(result).toContain('Pain change since first entry: unchanged');
    expect(result).not.toContain('unchanged by');
  });

  it('reports a rise as higher rather than characterising it', () => {
    const result = buildInjuryStats(
      baseInjury({
        Symptom: [symptom('2026-01-06', 3, 1), symptom('2026-02-10', 4, 2)],
      }),
    );

    expect(result).toContain('Pain change since first entry: higher by 1 point');
  });

  it('omits the change line when there is only one entry', () => {
    const result = buildInjuryStats(
      baseInjury({ Symptom: [symptom('2026-01-06', 6)] }),
    );

    expect(result).toContain('Pain: 1 entry');
    expect(result).not.toContain('Pain change since first entry');
  });

  it('says so when nothing has been logged', () => {
    const result = buildInjuryStats(baseInjury());

    expect(result).toContain('Pain: no symptom entries logged');
    expect(result).toContain('Treatments: none logged');
  });

  // The case this module exists for: repeated attempts at one treatment,
  // whose relief is only comparable as an ordered series.
  it('groups repeated attempts by courseId and lists relief days in order', () => {
    const result = buildInjuryStats(
      baseInjury({
        Treatment: [
          treatment({
            id: 1,
            name: 'Cortisone Injection',
            courseId: 'cortisone-2026',
            TreatmentOutcome: [
              checkIn({ id: 1, reliefDays: 40, painLevel: 4, status: 'improved' }),
            ],
          }),
          treatment({
            id: 2,
            name: 'Cortisone Injection',
            courseId: 'cortisone-2026',
            TreatmentOutcome: [
              checkIn({ id: 2, reliefDays: 21, painLevel: 5, status: 'partially-improved' }),
            ],
          }),
          treatment({
            id: 3,
            name: 'Cortisone Injection',
            courseId: 'cortisone-2026',
            TreatmentOutcome: [
              checkIn({ id: 3, reliefDays: 5, painLevel: 7, status: 'no-change' }),
            ],
          }),
        ],
      }),
    );

    expect(result).toContain('Treatments: 3 logged');
    expect(result).toContain('Cortisone Injection: 3 attempts');
    expect(result).toContain('relief days in order: 40, 21, 5');
    expect(result).toContain('pain after treatment: 4, 5, 7');
    expect(result).toContain('latest check-in: no-change');
  });

  it('falls back to the treatment name when no courseId is set', () => {
    const result = buildInjuryStats(
      baseInjury({
        Treatment: [
          treatment({ id: 1, name: 'Physiotherapy' }),
          treatment({ id: 2, name: 'physiotherapy ' }),
        ],
      }),
    );

    expect(result).toContain('Physiotherapy: 2 attempts');
  });

  it('keeps distinct treatments separate', () => {
    const result = buildInjuryStats(
      baseInjury({
        Treatment: [
          treatment({ id: 1, name: 'Physiotherapy' }),
          treatment({ id: 2, name: 'Ibuprofen' }),
        ],
      }),
    );

    expect(result).toContain('Physiotherapy: 1 attempt');
    expect(result).toContain('Ibuprofen: 1 attempt');
  });

  it('says when a treatment has no check-ins rather than implying it failed', () => {
    const result = buildInjuryStats(
      baseInjury({ Treatment: [treatment()] }),
    );

    expect(result).toContain('Physiotherapy: 1 attempt, no check-ins recorded');
  });

  it('counts visits and timeline events', () => {
    const result = buildInjuryStats(
      baseInjury({
        MedicalVisit: [
          { id: 1, doctor: null, clinic: null, date: new Date('2026-01-07'), notes: null, injuryId: 1 },
        ],
        TimelineEvent: [
          { id: 1, type: 'note', date: new Date('2026-01-09'), description: 'x', result: null, injuryId: 1 },
          { id: 2, type: 'note', date: new Date('2026-01-10'), description: 'y', result: null, injuryId: 1 },
        ],
      }),
    );

    expect(result).toContain('Medical visits: 1, timeline events: 2');
  });

  // The service does not diagnose, and that boundary extends to how figures
  // are described: report the arithmetic, not a clinical reading of it.
  it('does not characterise the trend as improving or worsening', () => {
    const result = buildInjuryStats(
      baseInjury({
        Symptom: [symptom('2026-01-06', 9, 1), symptom('2026-02-10', 2, 2)],
      }),
    );

    expect(result).not.toMatch(/improving|worsening|better|worse|recovering/i);
  });
});

describe('buildAllInjuryStats', () => {
  it('returns an empty string when there are no injuries', () => {
    expect(buildAllInjuryStats([])).toBe('');
  });

  it('names each injury so figures cannot be attributed to the wrong one', () => {
    const result = buildAllInjuryStats([
      baseInjury({ id: 1, name: 'Lower back strain' }),
      baseInjury({ id: 2, name: 'Sprained ankle' }),
    ]);

    expect(result).toContain('Summary figures for Lower back strain:');
    expect(result).toContain('Summary figures for Sprained ankle:');
  });
});
