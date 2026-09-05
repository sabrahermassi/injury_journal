import crypto from 'node:crypto';
import {
  register as registerUser,
  login as loginUser,
  deleteAccount,
} from './services/authService.js';
import { authCookieOptions, csrfCookieOptions } from './utils.js';
import { askAssistant } from './services/assistantService.js';
import { acceptExtraction } from './services/extractionService.js';
import {
  extractInjury,
  getExtractionHistory,
} from './services/extractorService.js';
import {
  createInjury,
  getInjuries,
  getInjuryById,
  updateInjury,
  deleteInjury,
} from './services/injuryService.js';
import {
  createTimelineEvent,
  getTimelineEvents,
  getAllEventsForUser,
  updateTimelineEvent,
  deleteTimelineEvent,
} from './services/timelineService.js';
import {
  createSymptom,
  getSymptoms,
  getAllSymptomsForUser,
  updateSymptom,
  deleteSymptom,
} from './services/symptomService.js';
import {
  createTreatment,
  getTreatments,
  getAllTreatmentsForUser,
  updateTreatment,
  deleteTreatment,
} from './services/treatmentService.js';
import {
  createMedicalVisit,
  getMedicalVisits,
  updateMedicalVisit,
  deleteMedicalVisit,
} from './services/medicalVisitService.js';
import {
  createTreatmentOutcome,
  getTreatmentOutcomes,
  deleteTreatmentOutcome,
} from './services/treatmentOutcomeService.js';

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await registerUser(email, password);

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);
    const csrfToken = crypto.randomBytes(32).toString('hex');

    res.cookie('token', result.token, authCookieOptions);
    res.cookie('csrfToken', csrfToken, csrfCookieOptions);
    res.json({ ...result, csrfToken });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
export const logout = async (req, res) => {
  res.clearCookie('token', authCookieOptions);
  res.clearCookie('csrfToken', csrfCookieOptions);
  res.status(204).send();
};

// DELETE /api/auth/me — removes the account and every record under it.
// The session cookies go too: the token would otherwise stay valid until it
// expires, pointing at a user row that no longer exists.
export const deleteAccountController = async (req, res, next) => {
  try {
    const deleted = await deleteAccount(req.userId);

    if (!deleted) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.clearCookie('token', authCookieOptions);
    res.clearCookie('csrfToken', csrfCookieOptions);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// POST /api/extractions/accept — files an AI extraction into the journal.
export const acceptExtractionController = async (req, res, next) => {
  try {
    const result = await acceptExtraction(req.userId, req.body);

    if (!result) {
      return res.status(404).json({
        error: 'Injury not found',
      });
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// POST /api/injuries
export const createInjuryController = async (req, res, next) => {
  try {
    const injury = await createInjury(req.userId, req.body);

    res.status(201).json(injury);
  } catch (error) {
    next(error);
  }
};

// GET /api/injuries
export const getInjuriesController = async (req, res, next) => {
  try {
    const injuries = await getInjuries(req.userId);

    res.json(injuries);
  } catch (error) {
    next(error);
  }
};

// GET /api/injuries/:id
export const getInjuryController = async (req, res, next) => {
  try {
    const injury = await getInjuryById(Number(req.params.id), req.userId);

    if (!injury) {
      return res.status(404).json({
        error: 'Injury not found',
      });
    }

    res.json(injury);
  } catch (error) {
    next(error);
  }
};

// PUT /api/injuries/:id
export const updateInjuryController = async (req, res, next) => {
  try {
    const injury = await updateInjury(
      Number(req.params.id),
      req.userId,
      req.body
    );

    if (!injury) {
      return res.status(404).json({
        error: 'Injury not found',
      });
    }

    res.json(injury);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/injuries/:id
export const deleteInjuryController = async (req, res, next) => {
  try {
    const injury = await deleteInjury(Number(req.params.id), req.userId);

    if (!injury) {
      return res.status(404).json({
        error: 'Injury not found',
      });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// POST /api/injuries/:injuryId/events
export const createTimelineEventController = async (req, res, next) => {
  try {
    const event = await createTimelineEvent(
      Number(req.params.injuryId),
      req.userId,
      req.body
    );

    if (!event) {
      return res.status(404).json({
        error: 'Injury not found',
      });
    }

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

// GET /api/injuries/:injuryId/events
// GET /api/events — every timeline event the user has. See the note on
// getAllSymptomsController for why there is no 404 branch.
export const getAllEventsController = async (req, res, next) => {
  try {
    res.json(await getAllEventsForUser(req.userId));
  } catch (error) {
    next(error);
  }
};

export const getTimelineEventsController = async (req, res, next) => {
  try {
    const events = await getTimelineEvents(
      Number(req.params.injuryId),
      req.userId
    );

    if (!events) {
      return res.status(404).json({
        error: 'Injury not found',
      });
    }

    res.json(events);
  } catch (error) {
    next(error);
  }
};

// PUT /api/events/:id
export const updateTimelineEventController = async (req, res, next) => {
  try {
    const event = await updateTimelineEvent(
      Number(req.params.id),
      req.userId,
      req.body
    );

    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
      });
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/events/:id
export const deleteTimelineEventController = async (req, res, next) => {
  try {
    const event = await deleteTimelineEvent(Number(req.params.id), req.userId);

    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
      });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// POST /api/injuries/:injuryId/symptoms
export const createSymptomController = async (req, res, next) => {
  try {
    const symptom = await createSymptom(
      Number(req.params.injuryId),
      req.userId,
      req.body
    );

    if (!symptom) {
      return res.status(404).json({
        error: 'Injury not found',
      });
    }

    res.status(201).json(symptom);
  } catch (error) {
    next(error);
  }
};

// GET /api/injuries/:injuryId/symptoms
// GET /api/symptoms — every symptom the user has, across all their injuries.
// No 404 branch: unlike the per-injury reads there is no parent to miss, and
// a user with nothing logged legitimately gets an empty array.
export const getAllSymptomsController = async (req, res, next) => {
  try {
    res.json(await getAllSymptomsForUser(req.userId));
  } catch (error) {
    next(error);
  }
};

export const getSymptomsController = async (req, res, next) => {
  try {
    const symptoms = await getSymptoms(Number(req.params.injuryId), req.userId);

    if (!symptoms) {
      return res.status(404).json({
        error: 'Injury not found',
      });
    }

    res.json(symptoms);
  } catch (error) {
    next(error);
  }
};

// PUT /api/symptoms/:id
export const updateSymptomController = async (req, res, next) => {
  try {
    const symptom = await updateSymptom(
      Number(req.params.id),
      req.userId,
      req.body
    );

    if (!symptom) {
      return res.status(404).json({
        error: 'Symptom not found',
      });
    }

    res.json(symptom);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/symptoms/:id
export const deleteSymptomController = async (req, res, next) => {
  try {
    const symptom = await deleteSymptom(Number(req.params.id), req.userId);

    if (!symptom) {
      return res.status(404).json({
        error: 'Symptom not found',
      });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// POST /api/injuries/:injuryId/treatments
export const createTreatmentController = async (req, res, next) => {
  try {
    const treatment = await createTreatment(
      Number(req.params.injuryId),
      req.userId,
      req.body
    );

    if (!treatment) {
      return res.status(404).json({
        error: 'Injury not found',
      });
    }

    res.status(201).json(treatment);
  } catch (error) {
    next(error);
  }
};

// GET /api/injuries/:injuryId/treatments
// GET /api/treatments — every treatment the user has, with its outcome
// check-ins attached. See the note on getAllSymptomsController.
export const getAllTreatmentsController = async (req, res, next) => {
  try {
    res.json(await getAllTreatmentsForUser(req.userId));
  } catch (error) {
    next(error);
  }
};

export const getTreatmentsController = async (req, res, next) => {
  try {
    const treatments = await getTreatments(
      Number(req.params.injuryId),
      req.userId
    );

    if (!treatments) {
      return res.status(404).json({
        error: 'Injury not found',
      });
    }

    res.json(treatments);
  } catch (error) {
    next(error);
  }
};

// PUT /api/treatments/:id
export const updateTreatmentController = async (req, res, next) => {
  try {
    const treatment = await updateTreatment(
      Number(req.params.id),
      req.userId,
      req.body
    );

    if (!treatment) {
      return res.status(404).json({
        error: 'Treatment not found',
      });
    }

    res.json(treatment);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/treatments/:id
export const deleteTreatmentController = async (req, res, next) => {
  try {
    const treatment = await deleteTreatment(Number(req.params.id), req.userId);

    if (!treatment) {
      return res.status(404).json({
        error: 'Treatment not found',
      });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// POST /api/injuries/:injuryId/visits
export const createMedicalVisitController = async (req, res, next) => {
  try {
    const visit = await createMedicalVisit(
      Number(req.params.injuryId),
      req.userId,
      req.body
    );

    if (!visit) {
      return res.status(404).json({
        error: 'Injury not found',
      });
    }

    res.status(201).json(visit);
  } catch (error) {
    next(error);
  }
};

// GET /api/injuries/:injuryId/visits
export const getMedicalVisitsController = async (req, res, next) => {
  try {
    const visits = await getMedicalVisits(
      Number(req.params.injuryId),
      req.userId
    );

    if (!visits) {
      return res.status(404).json({
        error: 'Injury not found',
      });
    }

    res.json(visits);
  } catch (error) {
    next(error);
  }
};

// PUT /api/visits/:id
export const updateMedicalVisitController = async (req, res, next) => {
  try {
    const visit = await updateMedicalVisit(
      Number(req.params.id),
      req.userId,
      req.body
    );

    if (!visit) {
      return res.status(404).json({
        error: 'Visit not found',
      });
    }

    res.json(visit);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/visits/:id
export const deleteMedicalVisitController = async (req, res, next) => {
  try {
    const visit = await deleteMedicalVisit(Number(req.params.id), req.userId);

    if (!visit) {
      return res.status(404).json({
        error: 'Visit not found',
      });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// POST /api/treatments/:treatmentId/outcomes
export const createTreatmentOutcomeController = async (req, res, next) => {
  try {
    const outcome = await createTreatmentOutcome(
      Number(req.params.treatmentId),
      req.userId,
      req.body
    );

    if (!outcome) {
      return res.status(404).json({
        error: 'Treatment not found',
      });
    }

    res.status(201).json(outcome);
  } catch (error) {
    next(error);
  }
};

// GET /api/treatments/:treatmentId/outcomes
export const getTreatmentOutcomesController = async (req, res, next) => {
  try {
    const outcomes = await getTreatmentOutcomes(
      Number(req.params.treatmentId),
      req.userId
    );

    if (!outcomes) {
      return res.status(404).json({
        error: 'Treatment not found',
      });
    }

    res.json(outcomes);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/treatment-outcomes/:id
export const deleteTreatmentOutcomeController = async (req, res, next) => {
  try {
    const outcome = await deleteTreatmentOutcome(Number(req.params.id), req.userId);

    if (!outcome) {
      return res.status(404).json({
        error: 'Treatment outcome not found',
      });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// POST /api/assistant/ask
export const askAssistantController = async (req, res, next) => {
  try {
    const { status, data } = await askAssistant(req.token, req.body);

    // The assistant is a separate service and knows nothing about icons, so
    // its citations are stamped here on the way through. Same table as every
    // other entry: a cited "Physiotherapy" draws what the timeline's
    // "Physiotherapy" draws.
    if (Array.isArray(data?.citations)) {
      data.citations = data.citations.map((citation) => ({
        ...citation,
        icon: iconFor(citation?.label ?? citation?.sourceType),
      }));
    }

    res.status(status).json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/extractions/extract
// The user id comes from the verified JWT, never from the request body — a
// caller supplying their own would be choosing whose extraction history to
// write into.
export const extractInjuryController = async (req, res, next) => {
  try {
    const { status, data } = await extractInjury(req.userId, req.body);

    res.status(status).json(data);
  } catch (error) {
    next(error);
  }
};

// GET /api/extractions/history
export const getExtractionHistoryController = async (req, res, next) => {
  try {
    const { status, data } = await getExtractionHistory(req.userId);

    res.status(status).json(data);
  } catch (error) {
    next(error);
  }
};
