// Environment loading for this app.
//
// Two variables must be identical here and in ai-injury-assistant/: JWT_SECRET
// (this app issues tokens, that one verifies them) and DATABASE_URL (both read
// the same database). They live in the repo-root .env.shared so there is one
// copy rather than two that can silently drift apart.
//
// Order matters. The app-specific file is loaded FIRST and dotenv never
// overwrites a variable that is already set, so anything in .env / .env.test
// wins over .env.shared. That is what keeps .env.test's DATABASE_URL
// authoritative when running the suite -- see the guard in tests/setup.js.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');
const repoRoot = path.resolve(appRoot, '..');

const appEnvFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';

dotenv.config({ path: path.join(appRoot, appEnvFile) });

// Absent on hosted deploys, which inject variables directly instead of
// shipping a file. Not an error.
dotenv.config({ path: path.join(repoRoot, '.env.shared') });

const REQUIRED = ['JWT_SECRET', 'DATABASE_URL'];
const missing = REQUIRED.filter((key) => !process.env[key]?.trim());

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(', ')}.\n` +
      'These are shared with ai-injury-assistant/ and belong in the repo-root ' +
      '.env.shared (copy .env.shared.example). On a hosted deploy, set them in ' +
      "the platform's environment settings."
  );
}
