import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// .env.test first: dotenv does not overwrite an already-set variable, so its
// DATABASE_URL wins over the root file's when NODE_ENV=test.
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
}

// Repo-root .env, shared with ai-injury-assistant/. This app owns the schema,
// so its CLI is the one allowed to reach the shared database. Absent on hosted
// deploys, which inject variables directly.
dotenv.config({ path: '../.env' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
