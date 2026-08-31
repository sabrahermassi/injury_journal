# Injury Journal — Backend

Express + Prisma REST API for the Injury Journal app.

See the [project root README](../README.md) for full setup instructions, API reference, and architecture, and the [project root CLAUDE.md](../CLAUDE.md) for a directory/convention overview.

Quick start:

```bash
npm install
# All configuration comes from the repo-root .env, shared with
# ai-injury-assistant/ -- copy ../.env.example (see the root README)
npx prisma migrate dev
npm run dev
```

Run tests:

```bash
npm test
```
