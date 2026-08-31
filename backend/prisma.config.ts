import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// App-specific file first: dotenv does not overwrite an already-set variable,
// so .env.test's DATABASE_URL wins over .env.shared's when NODE_ENV=test.
dotenv.config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
});

// Shared with ai-injury-assistant/ (JWT_SECRET, DATABASE_URL). Absent on
// hosted deploys, which inject variables directly.
dotenv.config({ path: '../.env.shared' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
