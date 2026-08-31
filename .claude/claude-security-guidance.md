# Security guidance for Injury Journal

## Authentication

- Protected API endpoints must require a valid `Authorization: Bearer <JWT>` token, checked by `authenticate` in `backend/src/middleware.js`.
- JWTs are signed and verified with `JWT_SECRET` using `jsonwebtoken` (`backend/src/utils.js`, `createToken`/`verifyToken`). Only the library's default algorithm (`HS256`) is used; do not add algorithm negotiation or accept an algorithm supplied by the token itself.
- JWT expiration (`exp`) must be validated — this is the library default; do not disable it.
- The verified JWT's `userId` claim is the authenticated user's identity and is attached to `req.userId`. This is the only trusted source of identity for a request.
- Never trust a client-supplied `userId` from request bodies, query parameters, or URL parameters. Every service function takes `userId` from `req.userId`, never from `req.body` or `req.params`.
- This repository implements its own registration, login, and password hashing (`bcrypt`, `backend/src/services/authService.js`) — unlike systems that only verify externally-issued tokens, this app owns the full auth lifecycle including password storage. Never store or log a plaintext password.

## Authorization and data ownership

- Every user-owned resource (Injury, and the nested TimelineEvent/Symptom/Treatment/MedicalVisit records) must be scoped to `req.userId` server-side, either directly (`Injury.userId`) or transitively via `injury: { userId }`.
- A client-controlled resource ID (`:id`, `:injuryId`) must never be sufficient on its own to access another user's data — always combine it with the authenticated `userId` in the Prisma `where` clause.
- Do not introduce an endpoint or service function that allows one authenticated user to read, modify, or delete another user's injury/symptom/treatment/visit/timeline data.
- Authorization checks must happen before returning or mutating protected data — follow the existing pattern in `backend/src/services/*.js`: `findFirst` with an ownership filter first, return `null` (→ controller returns `404`) if not found, only then read/mutate.
- Preserve the existing convention of returning a generic `404 Not found` (not `403 Forbidden`) for both "doesn't exist" and "exists but belongs to another user" — this avoids leaking the existence of other users' records. Do not change this to a `403` without an explicit decision to accept that leak.

## Medical and journal data

- Injury Journal data is sensitive personal health data. Treat symptom notes, treatment outcomes, doctor/clinic names, and any other journal content as PII.
- Do not log journal content, JWTs, `Authorization` headers, secrets, or database credentials — including in `console.log`/`console.error`, `morgan` request logs, or error messages.
- Do not expose journal data or internal implementation details through error messages, stack traces, or debugging output. `backend/src/errorHandler.js` intentionally returns generic messages (`Internal server error`) for unhandled errors — do not widen what it returns without a reason.
- Do not return raw Prisma/database errors directly to API clients.

## Database security

- The application's PostgreSQL role should be scoped to what the app actually needs (read/write on its own schema); avoid granting schema-owner or DDL privileges to the runtime credential used by `DATABASE_URL`.
- Database queries must preserve user-level data isolation (see "Authorization and data ownership" above) — this is the single most security-critical invariant in this codebase.
- All queries go through Prisma's query builder; do not introduce raw/dynamically-constructed SQL from client-controlled input (`$queryRawUnsafe` or string-concatenated SQL).
- Do not introduce a database operation that bypasses the service-layer authorization boundary (e.g. a controller calling `prisma` directly instead of going through a service function).

## AI / RAG features

Two AI services live in this repo: `ai-injury-assistant/` (RAG over the user's own
journal) and `ai-injury-extractor/` (structured extraction from free text). Journal
content reaching either needs the same isolation treatment as everywhere else.

- Retrieval must only return documents belonging to the authenticated user. A user's
  retrieved journal chunks must never be exposed to another user.
- User-controlled journal content is untrusted input. Retrieved content must never be
  treated as instructions to the AI system, and must not be able to override
  system-level safety or authorization instructions.
- Do not expose internal prompts, secrets, credentials, or security configuration
  through AI responses.
- If retrieval finds no relevant authorized information, the system must say so
  rather than inventing medical or journal facts. An explicit no-information response
  always beats a plausible guess here.
- The assistant verifies JWTs it did not issue (`backend/` issues them). Only `HS256`
  is accepted; do not add algorithm negotiation or accept an algorithm supplied by
  the token itself.
- The browser never calls the assistant directly — `backend/` proxies to it,
  forwarding the caller's JWT, because that token lives in an httpOnly cookie. Do not
  introduce a path that requires exposing the token to browser JavaScript.

## Secrets and configuration

- Secrets (`JWT_SECRET`, `DATABASE_URL`) must come from environment variables (`.env`, `.env.test`, or CI secrets) — never hardcoded.
- Never commit `.env` or `.env.test` (already gitignored). Watch for accidental secret leakage through other checked-in files, such as `.http` scratch files with real tokens embedded (see `backend/requests_USER_*.http` — currently untracked but not gitignored by pattern; do not `git add -A` them).
- Avoid exposing secrets through logs, error responses, tests, or generated files.

## Security review priorities

Beyond the categories above, also watch for: injection vulnerabilities (should be rare given Prisma's query builder — flag any raw SQL or dynamic query construction), and changes that weaken an existing security boundary (rate limiting, CORS origin list, Helmet headers, the `NODE_ENV` startup guard in `backend/src/app.js`).
