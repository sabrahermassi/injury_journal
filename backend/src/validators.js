import { z } from 'zod';

// AUTH
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),

  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),

  password: z.string().min(1, 'Password is required'),
});

// INJURY
export const injurySchema = z.object({
  name: z.string().min(1),

  bodyArea: z.string().min(1),

  side: z.string().min(1),

  startDate: z.string().datetime(),

  cause: z.string().min(1),

  description: z.string().min(1),

  status: z.string().min(1),
});

export const updateInjurySchema = injurySchema.partial();

// TIMELINE EVENT
export const timelineSchema = z.object({
  type: z.string().min(1),

  date: z.string().datetime(),

  description: z.string().min(1),

  result: z.string().optional(),
});

export const updateTimelineSchema = timelineSchema.partial();

// SYMPTOM
export const symptomSchema = z.object({
  date: z.string().datetime(),

  painLevel: z.number().min(1).max(10),

  location: z.string().min(1),

  trigger: z.string().optional(),

  duration: z.string().optional(),

  notes: z.string().optional(),
});

export const updateSymptomSchema = symptomSchema.partial();

// TREATMENT
export const treatmentSchema = z.object({
  name: z.string().min(1),

  provider: z.string().optional(),

  date: z.string().datetime(),

  cost: z.number().nonnegative().optional(),

  outcome: z.string().optional(),
});

export const updateTreatmentSchema = treatmentSchema.partial();

// MEDICAL VISIT
export const medicalVisitSchema = z.object({
  doctor: z.string().min(1),

  clinic: z.string().optional(),

  date: z.string().datetime(),

  notes: z.string().optional(),
});

export const updateMedicalVisitSchema = medicalVisitSchema.partial();
