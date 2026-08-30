# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## 1. Project purpose

Injury Journal is a full-stack app that lets a person track a personal injury over time: symptoms, treatments, medical visits, and a chronological timeline, organized under one or more "injury" profiles per user. The stated goal (per the root README) is to reduce the need to repeat medical history at appointments and give patients a clearer view of their own healthcare journey. This is health/PII-adjacent data — treat journal content (symptom notes, treatment outcomes, doctor/clinic names) as sensitive.

## 2. Architecture

```
User -> Next.js frontend (React) -> Express REST API (/api) -> Prisma ORM -> PostgreSQL
```

- **backend/** — Express 5 REST API, JWT auth, Prisma ORM over PostgreSQL. Talks to the DB directly; the frontend is a plain fetch client, no server-side rendering of API data (all dashboard pages are `"use client"`).
- **frontend/** — Next.js 16 (App Router) + React 19, Tailwind v4, shadcn/radix UI components. Stores the JWT in `localStorage` and attaches it as a Bearer token on every API call.

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
  services/api.ts        All backend API calls (fetch wrappers)
  services/utils.ts       Token storage (localStorage) helpers
  hooks/, lib/            Small shared utilities

docs/                    Planning docs written before/during implementation (product, requirements, system design, DB, API, dev process, testing, deployment). Written pre-implementation — verify against actual code before trusting for current behavior; see Known constraints below for known drift.
```

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
- The frontend has no test runner configured.

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
- The JWT is stored in `localStorage` on the frontend, not an httpOnly cookie.
- `backend/.gitignore` excludes `requests.http` but not `requests_USER_*.http` — those files (used for manual multi-user testing) contain real JWTs and are currently untracked; don't `git add -A` them.
- `docs/` reflects planning-stage decisions and may lag the actual implementation (e.g. deployment target, frontend stack) — check current code/config rather than trusting docs at face value.
- Two overlapping deployment docs exist (`docs/09-deployment.md` and `docs/14-deployment.md`); `14` is the more complete/current one.

See the audit report delivered alongside this file, and the corresponding GitHub issues, for the full list of findings and severities.

## 9. Documentation map

- `README.md` (root) — user-facing overview, setup, and API reference. Start here.
- `docs/01-product.md`, `docs/02-requirements.md` — product intent and requirements.
- `docs/03-system design.md` — architecture decisions.
- `docs/04-database.md` — data model rationale (compare against `backend/prisma/schema.prisma` for current truth).
- `docs/05-api.md` — API design rationale (compare against `backend/src/routes.js` for current truth).
- `docs/06-backend-dev.md`, `docs/07-frontend-dev.md`, `docs/08-testing.md` — process docs.
- `docs/09-deployment.md`, `docs/14-deployment.md` — deployment planning; both currently exist and overlap (see §8) — `14` is the more complete one.
- `ROADMAP.md` (root) — MVP completion checklist, background context only. Do not start work on a roadmap item that has no corresponding GitHub issue.
- `frontend/UI_GUIDE.md` — UI/styling conventions.

All `docs/` files are pre-implementation planning docs and may lag the actual code — verify claims against source before relying on them (see §8).

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
