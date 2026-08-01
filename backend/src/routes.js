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
} from './controllers.js';
import { authenticate } from './middleware.js';

const router = express.Router();

// POST /api/auth/register
router.post('/auth/register', register);

// POST /api/auth/login
router.post('/auth/login', login);

// POST /api/injuries
router.post('/injuries', authenticate, createInjuryController);

// GET /api/injuries
router.get('/injuries', authenticate, getInjuriesController);

// GET /api/injuries/:id
router.get('/injuries/:id', authenticate, getInjuryController);

// PUT /api/injuries/:id
router.put('/injuries/:id', authenticate, updateInjuryController);

// DELETE /api/injuries/:id
router.delete('/injuries/:id', authenticate, deleteInjuryController);

// POST /api/injuries/:injuryId/events
router.post(
  '/injuries/:injuryId/events',
  authenticate,
  createTimelineEventController
);

// GET /api/injuries/:injuryId/events
router.get(
  '/injuries/:injuryId/events',
  authenticate,
  getTimelineEventsController
);

// PUT /api/events/:id
router.put('/events/:id', authenticate, updateTimelineEventController);

// DELETE /api/events/:id
router.delete('/events/:id', authenticate, deleteTimelineEventController);

// POST /api/injuries/:injuryId/symptoms
router.post(
  '/injuries/:injuryId/symptoms',
  authenticate,
  createSymptomController
);

// GET /api/injuries/:injuryId/symptoms
router.get('/injuries/:injuryId/symptoms', authenticate, getSymptomsController);

// PUT /api/symptoms/:id
router.put('/symptoms/:id', authenticate, updateSymptomController);

// DELETE /api/symptoms/:id
router.delete('/symptoms/:id', authenticate, deleteSymptomController);

// POST /api/injuries/:injuryId/treatments
router.post(
  '/injuries/:injuryId/treatments',
  authenticate,
  createTreatmentController
);

// GET /api/injuries/:injuryId/treatments
router.get(
  '/injuries/:injuryId/treatments',
  authenticate,
  getTreatmentsController
);

// PUT /api/treatments/:id
router.put('/treatments/:id', authenticate, updateTreatmentController);

// DELETE /api/treatments/:id
router.delete('/treatments/:id', authenticate, deleteTreatmentController);

export default router;
