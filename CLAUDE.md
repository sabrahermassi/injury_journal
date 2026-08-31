# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## 1. Project purpose

Injury Journal is a full-stack app that lets a person track a personal injury over time: symptoms, treatments, medical visits, and a chronological timeline, organized under one or more "injury" profiles per user. The stated goal (per the root README) is to reduce the need to repeat medical history at appointments and give patients a clearer view of their own healthcare journey. This is health/PII-adjacent data — treat journal content (symptom notes, treatment outcomes, doctor/clinic names) as sensitive.

## 2. Architecture

```
User -> Next.js frontend ("use client" pages, fetch with credentials) -> Express REST API
(/api, JWT in httpOnly cookie + CSRF double-submit) -> Prisma ORM -> PostgreSQL
```

All backend resources (Injury, TimelineEvent, Symptom, Treatment, MedicalVisit) are scoped to the authenticated user, either directly (`Injury.userId`) or transitively through the parent Injury. Every read/update/delete in the service layer re-checks ownership before touching a nested resource — this is the central invariant of the app and must be preserved in any new endpoint.

## 3. Directory structure

```
backend/
  src/
    app.js            Express app setup: helmet, cors, morgan, rate limiting, routes, error handler
    server.js          Entry point (reads PORT, starts the HTTP server)
    routes.js          All route definitions, wired to middleware + controllers
    controllers.js     Thin HTTP layer: parse params/body, call services, map to status codes
    middleware.js       authenticate (JWT), validate (Zod), apiLimiter, authLimiter
    errorHandler.js     Central Express error handler
    validators.js       Zod schemas for every resource (create + partial update variants)
    utils.js            Prisma client singleton, JWT sign/verify helpers
    services/           One file per resource; all DB access and ownership checks live here
  prisma/
    schema.prisma       Data model (User, Injury, TimelineEvent, Symptom, Treatment, MedicalVisit)
    migrations/          Prisma migration history
  tests/                 Jest + Supertest integration tests, one file per resource + security.test.js

frontend/
  app/                   Next.js App Router pages: /, /login, /register, /dashboard, /dashboard/injuries/[id]
  components/            UI components; components/ui/ is the shadcn primitive layer, components/dashboard/ is feature-specific
  services/api.ts        All backend API calls (fetch wrappers, credentials: "include", reads CSRF token cookie)
  hooks/, lib/            Small shared utilities

docs/                    Planning docs written before/during implementation (product, requirements, system design, DB, API, dev process, testing, deployment). Written pre-implementation — verify against actual code before trusting for current behavior; see Known constraints below for known drift.

ai-injury-extractor/     Self-contained AWS Lambda service that extracts structured injury data
                         from free text (lambda/ handler + tests, infrastructure/ Terraform). Its
                         UI is NOT here — it lives in frontend/components/extractor/ and is served
                         at /dashboard/extractor. Own CLAUDE.md and README.md.

ai-injury-assistant/     Self-contained AI/RAG companion app, brought in from its own repository
                         (sabrahermassi/injury-journal-ai) via git subtree with full history
                         preserved. Own package.json, Prisma schema, frontend, CI, and CLAUDE.md —
                         see §11 below and its own docs before working in this folder.
```

Both `ai-injury-*` folders are independently deployable services that happen to share this repo.
Neither is imported by `backend/` or `frontend/` — they're reached over HTTP.

## 4. Tech stack

- **Backend**: Node.js (ESM, `"type": "module"`), Express 5, Prisma 6 + PostgreSQL, JWT (`jsonwebtoken`), `bcrypt` for password hashing, `zod` for request validation, `helmet` + `cors` + `express-rate-limit` for hardening, `morgan` for request logging.
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, `radix-ui`/shadcn components, `lucide-react` icons. See [`frontend/UI_GUIDE.md`](frontend/UI_GUIDE.md) for the design-token/component-pattern reference — read it before adding or changing UI.
- **Testing**: Jest 30 + Supertest, run against a real Postgres test database (`.env.test`), not mocked.
- **CI**: GitHub Actions (`.github/workflows/test.yml`) — runs `prisma migrate deploy` then `npm test` against a real `DATABASE_URL` secret on every push/PR to `main`.

## 5. Running locally

Backend:
```bash
cd backend
npm install
# create .env with DATABASE_URL, JWT_SECRET, FRONTEND_URL
npx prisma migrate dev
npm run dev        # node --watch src/server.js, default port 3001
```

Frontend:
```bash
cd frontend
npm install
# .env.local already sets NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev         # next dev, default port 3000
```

`NODE_ENV` must be one of `development`, `test`, or `production` — `backend/src/app.js` throws on startup otherwise. In `production`, `FRONTEND_URL` is required (used as the sole CORS origin).

## 6. Testing

```bash
cd backend
npm test            # cross-env NODE_ENV=test jest --runInBand, uses .env.test
```

- Integration-style: real Express app + real Postgres via Supertest, no mocking of the DB or Prisma.
- One test file per resource (`auth`, `injury`, `symptom`, `treatment`, `medicalVisit`, `timeline`) plus `security.test.js`, which is the only file that specifically tests cross-user data isolation (currently only for the Injury resource — see audit notes).
- `tests/setup.js` provides `cleanDatabase`, `createTestUser`, `createTestInjury` helpers; `cleanDatabase` truncates every table before each test.
- The frontend has Vitest configured (`cd frontend && npm test`), but so far only for the
  `ai-injury-extractor/` feature's components/API client (`frontend/components/extractor/*.test.tsx`,
  `frontend/services/extractor-api.test.ts`) — the rest of the frontend still has no test coverage.

## 7. Conventions

- Backend is ESM throughout (`import`/`export`, `"type": "module"` in package.json).
- Route → controller → service layering is consistent: controllers only translate HTTP <-> service calls (no direct Prisma access), services own all Prisma calls and ownership checks.
- Every service function that touches a nested resource (Symptom, Treatment, MedicalVisit, TimelineEvent) takes `(id, userId, data)` and does a `findFirst` ownership check (directly or via `injury: { userId }`) before mutating. New nested-resource endpoints should follow this exact pattern.
- Every Zod schema has a paired `updateXSchema = xSchema.partial()` for PATCH-style PUT requests.
- Controllers return `404` with `{ error: '<Resource> not found' }` when a service returns `null` (used both for "doesn't exist" and "exists but belongs to another user" — this is intentional, not a bug: it avoids leaking existence of other users' records).
- `errorHandler.js` matches on literal `error.message` strings for a couple of known cases; anything else falls through to a generic `500`. Prefer throwing errors whose `.message` matches existing handled cases, or extend `errorHandler.js`, rather than adding new one-off message string checks.
- Rate limiting (`authLimiter`, `apiLimiter`) is skipped entirely when `NODE_ENV === 'test'` (see `routes.js` and `app.js`) — don't assume rate-limit tests will run in CI as currently written.

## 8. Known constraints / gotchas (from audit)

- Numeric route params (`:id`, `:injuryId`) are coerced with `Number()` and not validated — a non-numeric id crashes into a `500` instead of a clean `400` (Prisma throws a validation error that isn't specifically caught).
- The JWT lives in an httpOnly cookie (`authenticate` in `backend/src/middleware.js` also falls back to an `Authorization: Bearer` header for `.http` files and tests). Mutating requests are additionally checked by `verifyCsrf` (double-submit cookie) — see `backend/src/middleware.js`. The CSRF cookie set by the backend is not readable via `document.cookie` on the frontend's origin in production (frontend on Vercel, backend on Render, different domains), so the login response also returns `csrfToken` in its JSON body; the frontend stores that value in `sessionStorage` (see `frontend/services/api.ts`) instead of reading it off the cookie (issue #25).
- `backend/.gitignore` excludes `requests.http` but not `requests_USER_*.http` — those files (used for manual multi-user testing) contain real JWTs and are currently untracked; don't `git add -A` them.
- `docs/` reflects planning-stage decisions and may lag the actual implementation (e.g. deployment target, frontend stack) — check current code/config rather than trusting docs at face value.
- Two overlapping deployment docs exist (`docs/09-deployment.md` and `docs/14-deployment.md`); `14` is the more complete/current one.

See the audit report delivered alongside this file, and the corresponding GitHub issues, for the full list of findings and severities.

## 9. Documentation map

- `README.md` (root) — user-facing overview, setup, and API reference. Start here.
- `docs/*.md` — pre-implementation planning docs; verify claims against `backend/prisma/schema.prisma` / `backend/src/routes.js` before trusting.
- `docs/07-frontend-dev.md` — stale: describes React Router/Axios/Context API, none of which this codebase uses (it's Next.js App Router + native `fetch`). Don't follow it.
- `ROADMAP.md` (root) — MVP completion checklist, background context only. Do not start work on a roadmap item that has no corresponding GitHub issue.
- `frontend/UI_GUIDE.md` — UI/styling conventions.
- `ai-injury-assistant/CLAUDE.md`, `ai-injury-assistant/README.md` — the AI companion app's own docs.
  Read those (not this file) for its conventions, architecture, and verification commands; see §11.

## 10. Verification commands

Run before considering backend work done:

```bash
cd backend
npm test             # Jest + Supertest integration suite
npm run lint          # eslint .
```

There is no frontend test suite or lint-on-commit configured yet (`npm run lint` exists via `frontend/package.json` but nothing runs it automatically). For frontend changes, run:

```bash
cd frontend
npm run lint
npm run build          # catches type errors ESLint won't
```

Do not invent additional verification commands beyond what's defined in `backend/package.json` / `frontend/package.json`.

## 11. AI companion app (`ai-injury-assistant/`)

An AI/RAG assistant that answers questions grounded in a user's own journal data — "what
treatments helped", or a summary across one injury or several. An early ask-form UI exists at
`ai-injury-assistant/frontend/components/ai-agent/ask-form.tsx`; this is a young, actively-evolving
part of the product, not a finished feature.

Brought into this repo via `git subtree add` from its own repository
(`sabrahermassi/injury-journal-ai`), with full commit history preserved. Note the folder was
originally added as `ai-injury-journal/` and later renamed, so any future `git subtree pull` must
use `--prefix=ai-injury-assistant`. Also note `git log -- ai-injury-assistant/` shows only the
merge commit: the imported commits recorded their original unprefixed paths, so path-filtered log
does not follow them. The history is in the graph — browse it with `git log 436cc5d`.
**Kept fully self-contained for now**: its
own `package.json`, `.gitignore`, `eslint.config.js`, `tsconfig.json`, CI workflows, and `CLAUDE.md`.
Do not fold its tooling into the root or into `backend`'s/`frontend`'s configs, and do not run its
`npm` scripts from the repo root — `cd ai-injury-assistant` first.

- **Stack**: TypeScript/Node 22 (ESM), Express 5, Prisma 6 + PostgreSQL with `pgvector`, Groq
  (`openai/gpt-oss-20b`) for generation, a separate self-hosted Python/FastAPI service for
  embeddings (Qwen3-Embedding-0.6B, 1024 dimensions). Its own Next.js frontend lives at
  `ai-injury-assistant/frontend/`, styled per `ai-injury-assistant/UI_GUIDE.md` — not merged into this
  repo's `frontend/`.
- **Retrieval path**: journal content → chunk → embed → pgvector cosine retrieval → LLM → cited
  answer. Safety checks run before retrieval; an unsupported question gets an explicit
  no-information response rather than an LLM guess.
- **Relationship to this app** (its own `docs/02-architecture.md`, decision D10): it does **not**
  own Injury CRUD or authentication — this app (`backend/`) does. It verifies JWTs issued by this
  repo's backend, so both apps must share the exact same `JWT_SECRET` (see `docs/14-deployment.md`).
  It has one deliberate exception: a minimal read-only `GET /injuries` for its own frontend's
  injury picker (four fields, scoped to the authenticated user, no pagination/CRUD) — its own docs
  mark that endpoint for deletion once the two apps genuinely merge (its issue #195).
- **Ports**: `backend/` 3001, `frontend/` 3000, AI service 3002, AI frontend 3003. All four can run
  at once.
- **CI**: `.github/workflows/ai-ci.yml` (path-filtered to `ai-injury-assistant/**`). It needs a
  repo-level `GROQ_API_KEY` secret for its evaluation step; that step is `continue-on-error`, so a
  missing secret degrades rather than blocks.
- **Known open item — the two apps do not share a database.** `ai-injury-assistant/` has its own
  Prisma schema containing a full copy of the journal models (`User`, `Injury`, `Symptom`,
  `Treatment`, `MedicalVisit`, `TimelineEvent`) plus `DocumentChunk` for vectors, and it ingests
  from *its own* database (`src/ingestion/reader/postgres-reader.ts`), which today is populated only
  by its own seed scripts. Nothing syncs real user data from `backend/`'s database into it, and the
  two schemas have already drifted (`backend/` has `TreatmentOutcome`; the AI copy does not). Until
  that is resolved, the AI assistant answers from a different dataset than the one the user is
  writing to. See `docs/post-merge-analysis.md` §7a for the options.
- **Before working in this folder**, read `ai-injury-assistant/CLAUDE.md` and
  `ai-injury-assistant/README.md`. Its conventions differ from the rest of this repo — commit message
  style, verification commands (`npx tsc --noEmit`, its own lint/test scripts), and file placement
  are enforced there, not here.
