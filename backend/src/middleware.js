import { verifyToken } from './utils.js';
import rateLimit from 'express-rate-limit';

// JWT authentication
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if token exists
  if (!authHeader) {
    return res.status(401).json({
      error: 'Authorization token missing',
    });
  }

  // Extract token
  const token = authHeader.replace('Bearer ', '');

  try {
    // Verify token
    const decoded = verifyToken(token);
    // Attach user information to request
    req.userId = decoded.userId;
    // Continue to controller
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired token',
    });
  }
};

// Zod validation
export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        errors: result.error.issues.map((error) => error.message),
      });
    }

    req.body = result.data;

    next();
  };
};

// General API limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests, please try again later',
  },
});

// Strict limiter for authentication
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many login attempts, please try again later',
  },
});
