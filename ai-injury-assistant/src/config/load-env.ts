// Environment loading for this service.
//
// Two variables must be identical here and in the journal app's backend/:
// JWT_SECRET (backend/ issues the tokens this service verifies) and
// DATABASE_URL (both read the same database, and backend/ owns its schema).
// They live in the repo-root .env.shared so there is one copy rather than two
// that can silently drift apart -- a JWT_SECRET mismatch shows up only as
// "unauthenticated", with nothing in the logs explaining why.
//
// Order matters. This service's own .env is loaded FIRST and dotenv never
// overwrites an already-set variable, so anything local wins over .env.shared.
//
// Note this covers the runtime only. prisma.config.ts deliberately does not
// read .env.shared, so Prisma CLI commands here cannot reach the shared
// database by accident -- see scripts/assert-local-db.mjs.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));

// src/config/ in development (tsx), dist/config/ once built -- same depth
// either way, so this resolves to the service root in both.
const appRoot = path.resolve(here, '..', '..');
const repoRoot = path.resolve(appRoot, '..');

dotenv.config({ path: path.join(appRoot, '.env') });

// Absent on hosted deploys, which inject variables directly. Not an error.
dotenv.config({ path: path.join(repoRoot, '.env.shared') });

const REQUIRED = ['JWT_SECRET', 'DATABASE_URL'] as const;
const missing = REQUIRED.filter((key) => !process.env[key]?.trim());

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(', ')}.\n` +
      'These are shared with the journal app and belong in the repo-root ' +
      '.env.shared (copy .env.shared.example). On a hosted deploy, set them in ' +
      "the platform's environment settings.",
  );
}
