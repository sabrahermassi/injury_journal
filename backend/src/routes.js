import express from 'express';
import {
  register,
  login,
  createInjuryController,
  getInjuriesController,
  getInjuryController,
  updateInjuryController,
  deleteInjuryController,
  createTimelineEventController,
  getTimelineEventsController,
  updateTimelineEventController,
  deleteTimelineEventController,
  createSymptomController,
  getSymptomsController,
  updateSymptomController,
  deleteSymptomController,
  createTreatmentController,
  getTreatmentsController,
  updateTreatmentController,
  deleteTreatmentController,
  createMedicalVisitController,
  getMedicalVisitsController,
  updateMedicalVisitController,
  deleteMedicalVisitController,
} from './controllers.js';
import { authenticate, validate } from './middleware.js';
import {
  registerSchema,
  loginSchema,
  injurySchema,
  updateInjurySchema,
  timelineSchema,
  updateTimelineSchema,
  symptomSchema,
  updateSymptomSchema,
  treatmentSchema,
  updateTreatmentSchema,
  medicalVisitSchema,
  updateMedicalVisitSchema,
} from './validators.js';

const router = express.Router();

// POST /api/auth/register
router.post('/auth/register', validate(registerSchema), register);

// POST /api/auth/login
router.post('/auth/login', validate(loginSchema), login);

// POST /api/injuries
router.post(
  '/injuries',
  authenticate,
  validate(injurySchema),
  createInjuryController
);

// GET /api/injuries
router.get('/injuries', authenticate, getInjuriesController);

// GET /api/injuries/:id
router.get('/injuries/:id', authenticate, getInjuryController);

// PUT /api/injuries/:id
router.put(
  '/injuries/:id',
  authenticate,
  validate(updateInjurySchema),
  updateInjuryController
);

// DELETE /api/injuries/:id
router.delete('/injuries/:id', authenticate, deleteInjuryController);

// POST /api/injuries/:injuryId/events
router.post(
  '/injuries/:injuryId/events',
  authenticate,
  validate(timelineSchema),
  createTimelineEventController
);

// GET /api/injuries/:injuryId/events
router.get(
  '/injuries/:injuryId/events',
  authenticate,
  getTimelineEventsController
);

// PUT /api/events/:id
router.put(
  '/events/:id',
  authenticate,
  validate(updateTimelineSchema),
  updateTimelineEventController
);

// DELETE /api/events/:id
router.delete('/events/:id', authenticate, deleteTimelineEventController);

// POST /api/injuries/:injuryId/symptoms
router.post(
  '/injuries/:injuryId/symptoms',
  authenticate,
  validate(symptomSchema),
  createSymptomController
);

// GET /api/injuries/:injuryId/symptoms
router.get('/injuries/:injuryId/symptoms', authenticate, getSymptomsController);

// PUT /api/symptoms/:id
router.put(
  '/symptoms/:id',
  authenticate,
  validate(updateSymptomSchema),
  updateSymptomController
);

// DELETE /api/symptoms/:id
router.delete('/symptoms/:id', authenticate, deleteSymptomController);

// POST /api/injuries/:injuryId/treatments
router.post(
  '/injuries/:injuryId/treatments',
  authenticate,
  validate(treatmentSchema),
  createTreatmentController
);

// GET /api/injuries/:injuryId/treatments
router.get(
  '/injuries/:injuryId/treatments',
  authenticate,
  getTreatmentsController
);

// PUT /api/treatments/:id
router.put(
  '/treatments/:id',
  authenticate,
  validate(updateTreatmentSchema),
  updateTreatmentController
);

// DELETE /api/treatments/:id
router.delete('/treatments/:id', authenticate, deleteTreatmentController);

// POST /api/injuries/:injuryId/visits
router.post(
  '/injuries/:injuryId/visits',
  authenticate,
  validate(medicalVisitSchema),
  createMedicalVisitController
);

// GET /api/injuries/:injuryId/visits
router.get(
  '/injuries/:injuryId/visits',
  authenticate,
  getMedicalVisitsController
);

// PUT /api/visits/:id
router.put(
  '/visits/:id',
  authenticate,
  validate(updateMedicalVisitSchema),
  updateMedicalVisitController
);

// DELETE /api/visits/:id
router.delete('/visits/:id', authenticate, deleteMedicalVisitController);

export default router;
