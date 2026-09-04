import { z } from 'zod';

// AUTH
// Email is trimmed and lowercased so login isn't case- or whitespace-sensitive
// against what register stored -- Postgres string equality is exact, and
// nothing else in the stack normalizes this.
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email format'),

  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email format'),

  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// INJURY
export const injurySchema = z.object({
  name: z.string().min(1),

  bodyArea: z.string().min(1),

  side: z.string().min(1).optional().nullable(),

  startDate: z.string().datetime(),

  cause: z.string().min(1).optional().nullable(),

  description: z.string().min(1).optional().nullable(),

  status: z.string().min(1).optional().nullable(),
});

export const updateInjurySchema = injurySchema.partial();

// TIMELINE EVENT
export const timelineSchema = z.object({
  type: z.string().min(1),

  date: z.string().datetime(),

  description: z.string().min(1),

  result: z.string().min(1).optional().nullable(),
});

export const updateTimelineSchema = timelineSchema.partial();

// SYMPTOM
export const symptomSchema = z.object({
  date: z.string().datetime(),

  painLevel: z.number().min(1).max(10),

  location: z.string().min(1).optional().nullable(),

  trigger: z.string().min(1).optional().nullable(),

  duration: z.string().min(1).optional().nullable(),

  notes: z.string().min(1).optional().nullable(),
});

export const updateSymptomSchema = symptomSchema.partial();

// TREATMENT
export const treatmentSchema = z.object({
  name: z.string().min(1),

  provider: z.string().min(1).optional().nullable(),

  date: z.string().datetime(),

  cost: z.number().nonnegative().optional().nullable(),

  outcome: z.string().min(1).optional().nullable(),

  followUpDueAt: z.string().datetime().optional().nullable(),

  courseId: z.string().min(1).optional().nullable(),
});

export const updateTreatmentSchema = treatmentSchema.partial();

// MEDICAL VISIT
export const medicalVisitSchema = z.object({
  doctor: z.string().min(1).optional().nullable(),

  clinic: z.string().min(1).optional().nullable(),

  date: z.string().datetime(),

  notes: z.string().min(1).optional().nullable(),
});

export const updateMedicalVisitSchema = medicalVisitSchema.partial();

// TREATMENT OUTCOME
export const treatmentOutcomeSchema = z.object({
  status: z.string().min(1),

  recordedAt: z.string().datetime().optional(),

  reliefDays: z.number().int().nonnegative().optional().nullable(),

  painLevel: z.number().int().min(0).max(10).optional().nullable(),

  notes: z.string().min(1).optional().nullable(),
});

// AI ASSISTANT
export const assistantAskSchema = z.object({
  question: z.string().min(1).max(10000),

  injuryId: z.number().int().positive().optional(),
});
