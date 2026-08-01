import express from 'express';
import {
  register,
  login,
  createInjuryController,
  getInjuriesController,
  getInjuryController,
  updateInjuryController,
  deleteInjuryController,
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

export default router;
