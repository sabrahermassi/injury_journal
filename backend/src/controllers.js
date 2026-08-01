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
