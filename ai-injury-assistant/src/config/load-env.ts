// Environment loading for this service.
//
// All runtime configuration lives in the repo-root .env, shared with the
// journal app's backend/. Two of those values must be identical across both:
// JWT_SECRET (backend/ issues the tokens this service verifies) and
// DATABASE_URL (both read the same database, and backend/ owns its schema).
// One file means they cannot drift apart -- a JWT_SECRET mismatch shows up
// only as "unauthenticated", with nothing in the logs explaining why.
//
// Order matters. .env.test is loaded FIRST and dotenv never overwrites an
// already-set variable, so it wins over the root file.
//
// Note this covers the runtime only. prisma.config.ts deliberately does not
// read the root .env, so Prisma CLI commands here cannot reach the shared
// database by accident -- see scripts/assert-local-db.mjs.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));

// src/config/ in development (tsx), dist/config/ once built -- same depth
// either way, so this resolves to the service root in both.
const appRoot = path.resolve(here, '..', '..');
const repoRoot = path.resolve(appRoot, '..');

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.join(appRoot, '.env.test') });
}

// Absent on hosted deploys, which inject variables directly. Not an error.
dotenv.config({ path: path.join(repoRoot, '.env') });

const REQUIRED = ['JWT_SECRET', 'DATABASE_URL'] as const;
const missing = REQUIRED.filter((key) => !process.env[key]?.trim());

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(', ')}.\n` +
      'These are shared with the journal app and belong in the repo-root ' +
      '.env (copy .env.example). On a hosted deploy, set them in the ' +
      "platform's environment settings.",
  );
}
