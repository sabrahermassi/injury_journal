import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { logError } from '../lib/log-error.js';
import { sendError } from '../lib/api-error.js';

function extractBearerToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }

  // RFC 7235: the auth-scheme token is case-insensitive, and the scheme/credentials
  // separator is defined as OWS (optional whitespace), not a single literal space.
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());

  return match ? match[1] : null;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    logError(
      'authenticate: JWT_SECRET is not configured',
      new Error('Missing JWT_SECRET'),
    );

    return sendError(res, 500, 'internal_error', 'Failed to process request');
  }

  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return sendError(res, 401, 'authentication_required', 'Authentication required');
  }

  try {
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });

    // The journal app (backend/) signs `{ userId }`, not the standard `sub`
    // claim — see backend/src/utils.js createToken. This service verifies
    // tokens it issues (decision D10), so it must read the claim that
    // actually exists. `sub` is still accepted so tokens minted by hand
    // against the older documented contract keep working.
    const claim =
      typeof payload === 'object'
        ? (payload as jwt.JwtPayload).userId ?? payload.sub
        : undefined;

    const userId = Number(claim);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return sendError(res, 401, 'invalid_token', 'Invalid or expired token');
    }

    req.userId = userId;

    return next();
  } catch {
    return sendError(res, 401, 'invalid_token', 'Invalid or expired token');
  }
}
