// Refuses to run schema commands against the shared journal database.
//
// This service reads the journal app's database but does not own its schema:
// backend/prisma/ does. The migrations in prisma/migrations/ exist only to
// build a standalone database for integration tests and the evaluation
// harness. Run against the shared database they would try to recreate tables
// that already hold real user data.
//
// Allowed: a database named injury-journal-ai-db (docker compose), or any
// URL naming a test database.
const url = process.env.DATABASE_URL;

if (!url) {
  console.error('Refusing to migrate: DATABASE_URL is not set.');
  process.exit(1);
}

let name;

try {
  name = new URL(url).pathname.slice(1);
} catch {
  console.error('Refusing to migrate: DATABASE_URL is not a valid URL.');
  process.exit(1);
}

const isLocalAiDb = name === 'injury-journal-ai-db';
const isTestDb = /test/i.test(name);

if (!isLocalAiDb && !isTestDb) {
  console.error(
    `Refusing to migrate: DATABASE_URL points at "${name}", which is not a ` +
      'standalone AI database.\n\n' +
      'This service does not own the journal schema. If you need to change a ' +
      'shared table, add a migration in backend/prisma/migrations/ instead.',
  );
  process.exit(1);
}

console.log(`Schema commands allowed against "${name}".`);
