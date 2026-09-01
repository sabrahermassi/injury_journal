// Environment loading for this app.
//
// All runtime configuration lives in the repo-root .env, shared with
// ai-injury-assistant/. Two of those values must be identical across both:
// JWT_SECRET (this app issues tokens, that one verifies them) and DATABASE_URL
// (both read the same database). One file means they cannot drift apart.
//
// Order matters. .env.test is loaded FIRST and dotenv never overwrites a
// variable that is already set, so it wins over the root file. That is what
// keeps the test database authoritative when running the suite -- see the
// guard in tests/setup.js. It is not decorative: the suite truncates every
// table, and it once wiped the development database when this went wrong.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');
const repoRoot = path.resolve(appRoot, '..');

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.join(appRoot, '.env.test') });
}

// Absent on hosted deploys, which inject variables directly instead of
// shipping a file. Not an error.
dotenv.config({ path: path.join(repoRoot, '.env') });

const REQUIRED = ['JWT_SECRET', 'DATABASE_URL'];
const missing = REQUIRED.filter((key) => !process.env[key]?.trim());

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(', ')}.\n` +
      'These are shared with ai-injury-assistant/ and belong in the repo-root ' +
      '.env (copy .env.example). On a hosted deploy, set them in the ' +
      "platform's environment settings."
  );
}
