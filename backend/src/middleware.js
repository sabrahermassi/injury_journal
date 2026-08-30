import { verifyToken } from './utils.js';
import rateLimit from 'express-rate-limit';

// JWT authentication
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Prefer the httpOnly cookie; fall back to the Authorization header
  // (used by the .http manual test files and non-browser clients).
  const token = req.cookies?.token || authHeader?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      error: 'Authorization token missing',
    });
  }

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

// Double-submit CSRF check for cookie-authenticated mutating requests.
// Clients authenticating via the Authorization header (tests, .http files)
// never carry the auth cookie, so they're exempt — they're not susceptible
// to browser-driven CSRF in the first place.
const CSRF_EXEMPT_PATHS = new Set(['/auth/login', '/auth/register']);
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const verifyCsrf = (req, res, next) => {
  if (SAFE_METHODS.has(req.method) || CSRF_EXEMPT_PATHS.has(req.path)) {
    return next();
  }

  if (!req.cookies?.token) {
    return next();
  }

  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      error: 'Invalid CSRF token',
    });
  }

  next();
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
