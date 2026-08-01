import {
  register as registerUser,
  login as loginUser,
} from './services/authService.js';
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
  updateTimelineEvent,
  deleteTimelineEvent,
} from './services/timelineService.js';
import {
  createSymptom,
  getSymptoms,
  updateSymptom,
  deleteSymptom,
} from './services/symptomService.js';
import {
  createTreatment,
  getTreatments,
  updateTreatment,
  deleteTreatment,
} from './services/treatmentService.js';
import {
  createMedicalVisit,
  getMedicalVisits,
  updateMedicalVisit,
  deleteMedicalVisit,
} from './services/medicalVisitService.js';

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await registerUser(email, password);

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);

    res.json(result);
  } catch (error) {
    res.status(401).json({
      error: error.message,
    });
  }
};

// POST /api/injuries
export const createInjuryController = async (req, res) => {
  try {
    const injury = await createInjury(req.userId, req.body);

    res.status(201).json(injury);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

// GET /api/injuries
export const getInjuriesController = async (req, res) => {
  try {
    const injuries = await getInjuries(req.userId);

    res.json(injuries);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// GET /api/injuries/:id
export const getInjuryController = async (req, res) => {
  try {
    const injury = await getInjuryById(Number(req.params.id), req.userId);

    if (!injury) {
      return res.status(404).json({
        error: 'Injury not found',
      });
    }

    res.json(injury);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// PUT /api/injuries/:id
export const updateInjuryController = async (req, res) => {
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
    res.status(400).json({
      error: error.message,
    });
  }
};

// DELETE /api/injuries/:id
export const deleteInjuryController = async (req, res) => {
  try {
    const injury = await deleteInjury(Number(req.params.id), req.userId);

    if (!injury) {
      return res.status(404).json({
        error: 'Injury not found',
      });
    }

    res.status(204).end();
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

// POST /api/injuries/:injuryId/events
export const createTimelineEventController = async (req, res) => {
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
    res.status(400).json({
      error: error.message,
    });
  }
};

// GET /api/injuries/:injuryId/events
export const getTimelineEventsController = async (req, res) => {
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
    res.status(500).json({
      error: error.message,
    });
  }
};

// PUT /api/events/:id
export const updateTimelineEventController = async (req, res) => {
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
    res.status(400).json({
      error: error.message,
    });
  }
};

// DELETE /api/events/:id
export const deleteTimelineEventController = async (req, res) => {
  try {
    const event = await deleteTimelineEvent(Number(req.params.id), req.userId);

    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
      });
    }

    res.status(204).end();
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

// POST /api/injuries/:injuryId/symptoms
export const createSymptomController = async (req, res) => {
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
    res.status(400).json({
      error: error.message,
    });
  }
};

// GET /api/injuries/:injuryId/symptoms
export const getSymptomsController = async (req, res) => {
  try {
    const symptoms = await getSymptoms(Number(req.params.injuryId), req.userId);

    if (!symptoms) {
      return res.status(404).json({
        error: 'Injury not found',
      });
    }

    res.json(symptoms);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// PUT /api/symptoms/:id
export const updateSymptomController = async (req, res) => {
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
    res.status(400).json({
      error: error.message,
    });
  }
};

// DELETE /api/symptoms/:id
export const deleteSymptomController = async (req, res) => {
  try {
    const symptom = await deleteSymptom(Number(req.params.id), req.userId);

    if (!symptom) {
      return res.status(404).json({
        error: 'Symptom not found',
      });
    }

    res.status(204).end();
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

// POST /api/injuries/:injuryId/treatments
export const createTreatmentController = async (req, res) => {
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
    res.status(400).json({
      error: error.message,
    });
  }
};

// GET /api/injuries/:injuryId/treatments
export const getTreatmentsController = async (req, res) => {
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
    res.status(500).json({
      error: error.message,
    });
  }
};

// PUT /api/treatments/:id
export const updateTreatmentController = async (req, res) => {
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
    res.status(400).json({
      error: error.message,
    });
  }
};

// DELETE /api/treatments/:id
export const deleteTreatmentController = async (req, res) => {
  try {
    const treatment = await deleteTreatment(Number(req.params.id), req.userId);

    if (!treatment) {
      return res.status(404).json({
        error: 'Treatment not found',
      });
    }

    res.status(204).end();
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

// POST /api/injuries/:injuryId/visits
export const createMedicalVisitController = async (req, res) => {
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
    res.status(400).json({
      error: error.message,
    });
  }
};

// GET /api/injuries/:injuryId/visits
export const getMedicalVisitsController = async (req, res) => {
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
    res.status(500).json({
      error: error.message,
    });
  }
};

// PUT /api/visits/:id
export const updateMedicalVisitController = async (req, res) => {
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
    res.status(400).json({
      error: error.message,
    });
  }
};

// DELETE /api/visits/:id
export const deleteMedicalVisitController = async (req, res) => {
  try {
    const visit = await deleteMedicalVisit(Number(req.params.id), req.userId);

    if (!visit) {
      return res.status(404).json({
        error: 'Visit not found',
      });
    }

    res.status(204).end();
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};
