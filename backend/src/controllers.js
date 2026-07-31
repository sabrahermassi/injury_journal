import {
  register as registerUser,
  login as loginUser
} from "./services/authService.js";

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await registerUser(
      email,
      password
    );

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser(
      email,
      password
    );

    res.json(result);
  } catch (error) {
    res.status(401).json({
      error: error.message
    });
  }
};