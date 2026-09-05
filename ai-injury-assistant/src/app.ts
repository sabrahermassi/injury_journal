import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import aiAgentRouter from './routes/ai-agent-router.js';
import { authenticate } from './auth/authenticate.js';
import { ApiErrorCode } from './lib/api-error.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

// Setting ALLOWED_ORIGIN to a non-empty value restricts CORS to the given
// comma-separated origins. Unset -- including present-but-blank, e.g. an
// unfilled ALLOWED_ORIGIN= copied from .env.example -- reflects the request's
// own origin, which is fine for local dev but must never ship.
//
// In production an explicit origin list is required, matching the journal
// app's own rule (backend/src/app.js requires FRONTEND_URL in production).
// Failing at startup is deliberate: a permissive-CORS default that silently
// survives into a deploy is exactly the failure this guard exists to prevent.
const rawAllowedOrigin = process.env.ALLOWED_ORIGIN?.trim();
const allowedOrigins = rawAllowedOrigin
  ? rawAllowedOrigin.split(',').map((origin) => origin.trim())
  : undefined;

if (process.env.NODE_ENV === 'production' && !allowedOrigins) {
  throw new Error(
    'ALLOWED_ORIGIN must be set in production (comma-separated list of allowed origins)',
  );
}

app.use(cors({ origin: allowedOrigins ?? true }));

app.use(express.json());

const rateLimitMessage = {
  error: 'Too many requests, please try again later.',
  code: 'rate_limited' satisfies ApiErrorCode,
};

// Lenient, keyed by IP (default). Runs before authenticate to bound the cost
// of an anonymous/invalid-token flood (JWT verification isn't free), not to
// enforce a user-facing quota — that's the per-user limiter's job (see #145).
// Kept at 2x the per-user limit rather than looser still: the original single
// limiter (#89) was sized to bound per-IP LLM/embedding cost-abuse outright,
// and this cap is what now stands between that goal and a multi-account
// attacker sharing one IP, so it deliberately isn't raised further.
const ipLimiter = rateLimit({
  windowMs: 60_000,
  limit: 40,
  standardHeaders: 'draft-8',
  identifier: 'ip',
  legacyHeaders: false,
  message: rateLimitMessage,
});

// The real per-user quota. Runs after authenticate and keys by req.userId so
// one client's failed-auth traffic can no longer exhaust another
// legitimately authenticated user's budget on a shared IP (#145).
const userLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: 'draft-8',
  identifier: 'user',
  legacyHeaders: false,
  keyGenerator: (req) => String(req.userId),
  message: rateLimitMessage,
});

app.use('/ai-agent', ipLimiter, authenticate, userLimiter, aiAgentRouter);

export default app;
