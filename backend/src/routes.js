import express from 'express';
import {
  register,
  login,
  logout,
  me,
  refresh,
  deleteAccountController,
  acceptExtractionController,
  createInjuryController,
  getInjuriesController,
  getInjuryController,
  updateInjuryController,
  deleteInjuryController,
  createTimelineEventController,
  getTimelineEventsController,
  getAllEventsController,
  updateTimelineEventController,
  deleteTimelineEventController,
  createSymptomController,
  getSymptomsController,
  getAllSymptomsController,
  updateSymptomController,
  deleteSymptomController,
  createTreatmentController,
  getTreatmentsController,
  getAllTreatmentsController,
  updateTreatmentController,
  deleteTreatmentController,
  createMedicalVisitController,
  getMedicalVisitsController,
  updateMedicalVisitController,
  deleteMedicalVisitController,
  createTreatmentOutcomeController,
  getTreatmentOutcomesController,
  deleteTreatmentOutcomeController,
  askAssistantController,
  extractInjuryController,
  getInjuryHistoryController,
} from './controllers.js';
import {
  authenticate,
  validate,
  validateNumericParam,
  authLimiter,
  verifyCsrf,
} from './middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
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
  treatmentOutcomeSchema,
  assistantAskSchema,
  extractSchema,
  acceptExtractionSchema,
} from './validators.js';

const router = express.Router();

// Must run before any route handlers so it applies to every mutating route.
router.use(verifyCsrf);

if (process.env.NODE_ENV !== 'test') {
  // POST /api/auth/register
  router.post(
    '/auth/register',
    authLimiter,
    validate(registerSchema),
    register
  );

  // POST /api/auth/login
  router.post('/auth/login', authLimiter, validate(loginSchema), login);
} else {
  // POST /api/auth/register
  router.post('/auth/register', validate(registerSchema), register);

  // POST /api/auth/login
  router.post('/auth/login', validate(loginSchema), login);
}

// GET /api/auth/me
router.get('/auth/me', authenticate, me);

// POST /api/auth/refresh
// Deliberately not behind authLimiter: the token is 256 bits of CSPRNG output,
// so there is nothing to brute-force, and sharing login's ten-request bucket
// would let ordinary session upkeep lock a user out of logging in -- which is
// a real risk on mobile, where carrier NAT puts many users on one address.
router.post('/auth/refresh', validate(refreshSchema), refresh);

// POST /api/auth/logout
router.post('/auth/logout', logout);

// DELETE /api/auth/me
router.delete('/auth/me', authenticate, deleteAccountController);

// POST /api/extractions/accept — turn an AI extraction into journal records
router.post(
  '/extractions/accept',
  authenticate,
  validate(acceptExtractionSchema),
  acceptExtractionController
);

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
router.get(
  '/injuries/:id',
  authenticate,
  validateNumericParam('id'),
  getInjuryController
);

// PUT /api/injuries/:id
router.put(
  '/injuries/:id',
  authenticate,
  validateNumericParam('id'),
  validate(updateInjurySchema),
  updateInjuryController
);

// DELETE /api/injuries/:id
router.delete(
  '/injuries/:id',
  authenticate,
  validateNumericParam('id'),
  deleteInjuryController
);

// POST /api/injuries/:injuryId/events
router.post(
  '/injuries/:injuryId/events',
  authenticate,
  validateNumericParam('injuryId'),
  validate(timelineSchema),
  createTimelineEventController
);

// GET /api/injuries/:injuryId/events
// GET /api/events — all of the user's events in one request
router.get('/events', authenticate, getAllEventsController);

router.get(
  '/injuries/:injuryId/events',
  authenticate,
  validateNumericParam('injuryId'),
  getTimelineEventsController
);

// PUT /api/events/:id
router.put(
  '/events/:id',
  authenticate,
  validateNumericParam('id'),
  validate(updateTimelineSchema),
  updateTimelineEventController
);

// DELETE /api/events/:id
router.delete(
  '/events/:id',
  authenticate,
  validateNumericParam('id'),
  deleteTimelineEventController
);

// POST /api/injuries/:injuryId/symptoms
router.post(
  '/injuries/:injuryId/symptoms',
  authenticate,
  validateNumericParam('injuryId'),
  validate(symptomSchema),
  createSymptomController
);

// GET /api/injuries/:injuryId/symptoms
// GET /api/symptoms — all of the user's symptoms in one request
router.get('/symptoms', authenticate, getAllSymptomsController);

router.get(
  '/injuries/:injuryId/symptoms',
  authenticate,
  validateNumericParam('injuryId'),
  getSymptomsController
);

// PUT /api/symptoms/:id
router.put(
  '/symptoms/:id',
  authenticate,
  validateNumericParam('id'),
  validate(updateSymptomSchema),
  updateSymptomController
);

// DELETE /api/symptoms/:id
router.delete(
  '/symptoms/:id',
  authenticate,
  validateNumericParam('id'),
  deleteSymptomController
);

// POST /api/injuries/:injuryId/treatments
router.post(
  '/injuries/:injuryId/treatments',
  authenticate,
  validateNumericParam('injuryId'),
  validate(treatmentSchema),
  createTreatmentController
);

// GET /api/injuries/:injuryId/treatments
// GET /api/treatments — all of the user's treatments, outcomes included
router.get('/treatments', authenticate, getAllTreatmentsController);

router.get(
  '/injuries/:injuryId/treatments',
  authenticate,
  validateNumericParam('injuryId'),
  getTreatmentsController
);

// PUT /api/treatments/:id
router.put(
  '/treatments/:id',
  authenticate,
  validateNumericParam('id'),
  validate(updateTreatmentSchema),
  updateTreatmentController
);

// DELETE /api/treatments/:id
router.delete(
  '/treatments/:id',
  authenticate,
  validateNumericParam('id'),
  deleteTreatmentController
);

// POST /api/injuries/:injuryId/visits
router.post(
  '/injuries/:injuryId/visits',
  authenticate,
  validateNumericParam('injuryId'),
  validate(medicalVisitSchema),
  createMedicalVisitController
);

// GET /api/injuries/:injuryId/visits
router.get(
  '/injuries/:injuryId/visits',
  authenticate,
  validateNumericParam('injuryId'),
  getMedicalVisitsController
);

// PUT /api/visits/:id
router.put(
  '/visits/:id',
  authenticate,
  validateNumericParam('id'),
  validate(updateMedicalVisitSchema),
  updateMedicalVisitController
);

// DELETE /api/visits/:id
router.delete(
  '/visits/:id',
  authenticate,
  validateNumericParam('id'),
  deleteMedicalVisitController
);

// POST /api/treatments/:treatmentId/outcomes
router.post(
  '/treatments/:treatmentId/outcomes',
  authenticate,
  validateNumericParam('treatmentId'),
  validate(treatmentOutcomeSchema),
  createTreatmentOutcomeController
);

// GET /api/treatments/:treatmentId/outcomes
router.get(
  '/treatments/:treatmentId/outcomes',
  authenticate,
  validateNumericParam('treatmentId'),
  getTreatmentOutcomesController
);

// DELETE /api/treatment-outcomes/:id
router.delete(
  '/treatment-outcomes/:id',
  authenticate,
  validateNumericParam('id'),
  deleteTreatmentOutcomeController
);

// POST /api/assistant/ask
// Proxies to the AI assistant service, forwarding the caller's own token.
// See src/services/assistantService.js for why this goes through the backend
// rather than the browser calling the assistant directly.
router.post(
  '/assistant/ask',
  authenticate,
  validate(assistantAskSchema),
  askAssistantController
);

// POST /api/extract
// GET /api/extract/injuries
// Proxies to the AI extractor Lambda, forwarding the caller's own token so
// it can scope DynamoDB reads/writes to the authenticated user instead of a
// hardcoded demo user (issue #59). See src/services/extractorService.js.
router.post(
  '/extract',
  authenticate,
  validate(extractSchema),
  extractInjuryController
);

router.get('/extract/injuries', authenticate, getInjuryHistoryController);

export default router;
