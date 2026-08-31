import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// Deliberately reads ONLY this service's own .env.test, never the repo-root
// .env. This service does not own the journal schema -- backend/prisma/ does,
// including the DocumentChunk table written here -- so its Prisma CLI must not
// be able to reach the shared database at all. Without a DATABASE_URL, a
// stray `prisma migrate` fails loudly instead of migrating production.
//
// The migrations here build a standalone database for integration tests and
// the evaluation harness only. scripts/assert-local-db.mjs guards the entry
// point; this omission is the second half of that guard. Do not "fix" it by
// adding the root file.
dotenv.config({ path: '.env.test' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
