// Must come first: it resolves DATABASE_URL (and, under NODE_ENV=test,
// points it at the test database) before PrismaClient is constructed below.
import './loadEnv.js';

import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const createToken = (userId) => {
  return jwt.sign(
    {
      userId
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '1h'
    }
  );
};


export const verifyToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_SECRET
  );
};

// Refresh tokens exist for native clients, which have no cookie jar and can't
// sit behind an hourly re-login. The access token above stays at 1h precisely
// because this exists: the alternative -- a 30-day stateless JWT over symptom
// notes and clinic names, with no way to revoke it -- is strictly worse.
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const createRefreshToken = () => crypto.randomBytes(32).toString('hex');

// Stored hashed, so a database leak yields no usable sessions. Plain SHA-256
// rather than bcrypt is deliberate and safe here: unlike a password, the input
// is 256 bits of CSPRNG output, so there is no search space to slow down.
export const hashRefreshToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const isProduction = process.env.NODE_ENV === 'production';

// Frontend and backend are deployed on different domains in production
// (Vercel / Render), so the cookie must be sent cross-site: SameSite=None
// requires Secure. Locally both run on `localhost` (same site, different
// port), where Lax already works and doesn't require HTTPS.
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1h, matches JWT expiresIn

export const authCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: TOKEN_TTL_MS,
};

// Double-submit CSRF token cookie: readable by frontend JS (unlike the auth
// cookie) so it can be echoed back as the X-CSRF-Token header on mutating
// requests. Needed once the auth cookie uses SameSite=None in production,
// which no longer blocks cross-site requests on its own.
export const csrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: TOKEN_TTL_MS,
};