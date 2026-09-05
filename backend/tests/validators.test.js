// Pure unit tests against the Zod schemas themselves -- no HTTP, no database.
// validators.js has no Prisma/Postgres dependency, and this file imports
// nothing from setup.js, so none of tests/setup.js's DATABASE_URL guard runs
// here; these tests work with no .env.test at all.
import {
  registerSchema,
  loginSchema,
  injurySchema,
  updateInjurySchema,
  timelineSchema,
  symptomSchema,
  treatmentSchema,
  medicalVisitSchema,
  treatmentOutcomeSchema,
  assistantAskSchema,
} from '../src/validators.js';

const VALID_DATETIME = '2025-01-01T00:00:00.000Z';

// Every schema in this file uses the same "optional().nullable()" shape for
// its non-required string fields: omitted passes, null passes, but an empty
// string fails the field's own .min(1). Asserting this once per field via a
// shared helper avoids repeating the same three-line block per field per
// schema while still exercising every one of them.
function expectOptionalNullableString(schema, base, field) {
  const omitted = { ...base };
  delete omitted[field];
  expect(schema.safeParse(omitted).success).toBe(true);

  expect(schema.safeParse({ ...base, [field]: null }).success).toBe(true);

  expect(schema.safeParse({ ...base, [field]: '' }).success).toBe(false);
}

describe('registerSchema', () => {
  const base = { email: 'user@example.com', password: 'password123' };

  test('accepts a valid email and an 8-character password', () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  test('rejects a password one character under the minimum', () => {
    const result = registerSchema.safeParse({ ...base, password: '1234567' });
    expect(result.success).toBe(false);
  });

  test('accepts a password exactly at the minimum length', () => {
    const result = registerSchema.safeParse({ ...base, password: '12345678' });
    expect(result.success).toBe(true);
  });

  test('rejects a malformed email', () => {
    const result = registerSchema.safeParse({ ...base, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  test('rejects an empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  test('rejects a malformed email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'anything',
    });
    expect(result.success).toBe(false);
  });

  test('accepts a valid email and any non-empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'x',
    });
    expect(result.success).toBe(true);
  });
});

describe('injurySchema', () => {
  const base = {
    name: 'Lower back pain',
    bodyArea: 'Lower back',
    startDate: VALID_DATETIME,
  };

  test('accepts the minimal valid payload', () => {
    expect(injurySchema.safeParse(base).success).toBe(true);
  });

  test('rejects an empty name', () => {
    expect(injurySchema.safeParse({ ...base, name: '' }).success).toBe(false);
  });

  test('rejects an empty bodyArea', () => {
    expect(injurySchema.safeParse({ ...base, bodyArea: '' }).success).toBe(false);
  });

  test('rejects a date-only startDate with no time component', () => {
    const result = injurySchema.safeParse({ ...base, startDate: '2025-01-01' });
    expect(result.success).toBe(false);
  });

  test('rejects a garbage startDate', () => {
    const result = injurySchema.safeParse({ ...base, startDate: 'not-a-date' });
    expect(result.success).toBe(false);
  });

  test.each(['side', 'cause', 'description', 'status'])(
    '%s is optional, nullable, but not empty',
    (field) => {
      expectOptionalNullableString(injurySchema, base, field);
    },
  );
});

describe('updateInjurySchema', () => {
  test('accepts an empty object -- every field is optional on update', () => {
    expect(updateInjurySchema.safeParse({}).success).toBe(true);
  });

  test('still rejects an empty string for a provided field', () => {
    const result = updateInjurySchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

describe('timelineSchema', () => {
  const base = {
    type: 'Doctor visit',
    date: VALID_DATETIME,
    description: 'MRI appointment',
  };

  test('accepts the minimal valid payload', () => {
    expect(timelineSchema.safeParse(base).success).toBe(true);
  });

  test('rejects an empty type', () => {
    expect(timelineSchema.safeParse({ ...base, type: '' }).success).toBe(false);
  });

  test('rejects an empty description', () => {
    const result = timelineSchema.safeParse({ ...base, description: '' });
    expect(result.success).toBe(false);
  });

  test('rejects a non-ISO date', () => {
    expect(timelineSchema.safeParse({ ...base, date: '2025-01-01' }).success).toBe(
      false,
    );
  });

  test('result is optional, nullable, but not empty', () => {
    expectOptionalNullableString(timelineSchema, base, 'result');
  });
});

describe('symptomSchema', () => {
  const base = { date: VALID_DATETIME, painLevel: 5 };

  test('accepts the minimal valid payload', () => {
    expect(symptomSchema.safeParse(base).success).toBe(true);
  });

  // The issue's named example.
  test('rejects painLevel 0 -- the minimum is 1, not 0', () => {
    expect(symptomSchema.safeParse({ ...base, painLevel: 0 }).success).toBe(false);
  });

  test('accepts painLevel exactly at the minimum (1)', () => {
    expect(symptomSchema.safeParse({ ...base, painLevel: 1 }).success).toBe(true);
  });

  test('accepts painLevel exactly at the maximum (10)', () => {
    expect(symptomSchema.safeParse({ ...base, painLevel: 10 }).success).toBe(true);
  });

  test('rejects painLevel 11 -- one over the maximum', () => {
    expect(symptomSchema.safeParse({ ...base, painLevel: 11 }).success).toBe(false);
  });

  test('rejects a non-ISO date', () => {
    expect(symptomSchema.safeParse({ ...base, date: '2025-01-01' }).success).toBe(
      false,
    );
  });

  test.each(['location', 'trigger', 'duration', 'notes'])(
    '%s is optional, nullable, but not empty',
    (field) => {
      expectOptionalNullableString(symptomSchema, base, field);
    },
  );
});

describe('treatmentSchema', () => {
  const base = { name: 'Physiotherapy', date: VALID_DATETIME };

  test('accepts the minimal valid payload', () => {
    expect(treatmentSchema.safeParse(base).success).toBe(true);
  });

  test('rejects an empty name', () => {
    expect(treatmentSchema.safeParse({ ...base, name: '' }).success).toBe(false);
  });

  test('rejects a negative cost', () => {
    expect(treatmentSchema.safeParse({ ...base, cost: -1 }).success).toBe(false);
  });

  test('accepts a cost of exactly 0', () => {
    expect(treatmentSchema.safeParse({ ...base, cost: 0 }).success).toBe(true);
  });

  test('rejects a non-ISO followUpDueAt when provided', () => {
    const result = treatmentSchema.safeParse({
      ...base,
      followUpDueAt: '2025-01-01',
    });
    expect(result.success).toBe(false);
  });

  test('followUpDueAt is optional and nullable (no min-length rule applies)', () => {
    // base already omits followUpDueAt entirely.
    expect(treatmentSchema.safeParse(base).success).toBe(true);
    expect(
      treatmentSchema.safeParse({ ...base, followUpDueAt: null }).success,
    ).toBe(true);
  });

  test.each(['provider', 'outcome', 'courseId'])(
    '%s is optional, nullable, but not empty',
    (field) => {
      expectOptionalNullableString(treatmentSchema, base, field);
    },
  );
});

describe('medicalVisitSchema', () => {
  const base = { date: VALID_DATETIME };

  test('accepts a payload with only the required date', () => {
    expect(medicalVisitSchema.safeParse(base).success).toBe(true);
  });

  test('rejects a non-ISO date', () => {
    expect(medicalVisitSchema.safeParse({ date: '2025-01-01' }).success).toBe(
      false,
    );
  });

  test.each(['doctor', 'clinic', 'notes'])(
    '%s is optional, nullable, but not empty',
    (field) => {
      expectOptionalNullableString(medicalVisitSchema, base, field);
    },
  );
});

describe('treatmentOutcomeSchema', () => {
  const base = { status: 'Still helping' };

  test('accepts the minimal valid payload', () => {
    expect(treatmentOutcomeSchema.safeParse(base).success).toBe(true);
  });

  test('rejects an empty status', () => {
    expect(treatmentOutcomeSchema.safeParse({ status: '' }).success).toBe(false);
  });

  // Deliberately different from symptomSchema: painLevel here allows 0.
  test('accepts painLevel 0, unlike symptomSchema which requires at least 1', () => {
    expect(
      treatmentOutcomeSchema.safeParse({ ...base, painLevel: 0 }).success,
    ).toBe(true);
  });

  test('accepts painLevel exactly at the maximum (10)', () => {
    expect(
      treatmentOutcomeSchema.safeParse({ ...base, painLevel: 10 }).success,
    ).toBe(true);
  });

  test('rejects painLevel 11', () => {
    expect(
      treatmentOutcomeSchema.safeParse({ ...base, painLevel: 11 }).success,
    ).toBe(false);
  });

  test('rejects a non-integer painLevel', () => {
    expect(
      treatmentOutcomeSchema.safeParse({ ...base, painLevel: 5.5 }).success,
    ).toBe(false);
  });

  test('rejects a negative reliefDays', () => {
    expect(
      treatmentOutcomeSchema.safeParse({ ...base, reliefDays: -1 }).success,
    ).toBe(false);
  });

  test('rejects a non-integer reliefDays', () => {
    expect(
      treatmentOutcomeSchema.safeParse({ ...base, reliefDays: 2.5 }).success,
    ).toBe(false);
  });

  test('accepts an omitted recordedAt', () => {
    expect(treatmentOutcomeSchema.safeParse(base).success).toBe(true);
  });

  // The one field in this file that is optional but NOT nullable, unlike
  // every sibling optional field elsewhere in validators.js -- worth pinning
  // explicitly since the two states are easy to conflate at a glance.
  test('rejects a null recordedAt, unlike this file\'s other optional fields', () => {
    expect(
      treatmentOutcomeSchema.safeParse({ ...base, recordedAt: null }).success,
    ).toBe(false);
  });

  test('rejects a non-ISO recordedAt when provided', () => {
    expect(
      treatmentOutcomeSchema.safeParse({ ...base, recordedAt: '2025-01-01' })
        .success,
    ).toBe(false);
  });
});

describe('assistantAskSchema', () => {
  test('accepts a minimal question with no injuryId', () => {
    expect(assistantAskSchema.safeParse({ question: 'What helped?' }).success).toBe(
      true,
    );
  });

  test('rejects an empty question', () => {
    expect(assistantAskSchema.safeParse({ question: '' }).success).toBe(false);
  });

  test('accepts a question at exactly the 10000-character maximum', () => {
    const question = 'a'.repeat(10000);
    expect(assistantAskSchema.safeParse({ question }).success).toBe(true);
  });

  test('rejects a question one character over the maximum', () => {
    const question = 'a'.repeat(10001);
    expect(assistantAskSchema.safeParse({ question }).success).toBe(false);
  });

  test('rejects injuryId 0 -- must be positive', () => {
    const result = assistantAskSchema.safeParse({
      question: 'x',
      injuryId: 0,
    });
    expect(result.success).toBe(false);
  });

  test('rejects a negative injuryId', () => {
    const result = assistantAskSchema.safeParse({
      question: 'x',
      injuryId: -1,
    });
    expect(result.success).toBe(false);
  });

  test('rejects a non-integer injuryId', () => {
    const result = assistantAskSchema.safeParse({
      question: 'x',
      injuryId: 1.5,
    });
    expect(result.success).toBe(false);
  });

  test('accepts a valid positive integer injuryId', () => {
    const result = assistantAskSchema.safeParse({
      question: 'x',
      injuryId: 1,
    });
    expect(result.success).toBe(true);
  });
});
