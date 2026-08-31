# Injury Journal — Backend

Express + Prisma REST API for the Injury Journal app.

See the [project root README](../README.md) for full setup instructions, API reference, and architecture, and the [project root CLAUDE.md](../CLAUDE.md) for a directory/convention overview.

Quick start:

```bash
npm install
# DATABASE_URL and JWT_SECRET come from the repo-root .env.shared
# (shared with ai-injury-assistant/ -- see the root README)
# create .env with PORT, NODE_ENV, FRONTEND_URL
npx prisma migrate dev
npm run dev
```

Run tests:

```bash
npm test
```
