# System Design

## Overview

Injury Journal helps users organize their healthcare journey by tracking injuries,
symptoms, treatments, and medical events. What began as a single monolith now runs
as four deployable pieces in one repository.

```text
                    Browser
                       |
              Next.js frontend (3000)
              "use client" pages, fetch with credentials
                       |
                       |  /api  — JWT in httpOnly cookie
                       |         + CSRF double-submit
                       v
              Express REST API (3001)  ── Prisma ──> PostgreSQL
                       |          |                   ^
                       |          |  proxies POST /api/assistant/ask
                       |          |  forwarding the caller's JWT
                       |          v                   |
                       |  AI assistant (3002)  ─────────
                       |  RAG over the user's own journal   reads the SAME database;
                       |          |                         backend/prisma/ owns the schema
                       |          v
                       |  Embedding service (8000)
                       |  Python/FastAPI, Qwen3-Embedding-0.6B
                       |
                       |  proxies POST /api/extractions/extract,
                       |  GET /api/extractions/history — a shared
                       |  secret + the caller's own userId, not the JWT
                       v
              AI extractor — AWS Lambda; own DynamoDB table
```

## Why the assistant is proxied rather than called directly

The JWT lives in an httpOnly cookie, so browser JavaScript cannot read it. Rather
than storing the token somewhere readable — which would undo the protection — the
backend forwards the caller's own token to the assistant. See
`backend/src/services/assistantService.js`.

## Why the extractor is proxied too

The extractor Lambda used to be called straight from the browser with no auth of
any kind, filing every extraction under one hardcoded user (issue #32). It is now
reached only through the backend, the same way as the assistant, but by a
different mechanism: the Lambda doesn't verify JWTs itself, so the backend
presents a shared secret instead and sends the `userId` it already resolved. See
`backend/src/services/extractorService.js`.

## The central invariant

Every resource (`Injury`, `TimelineEvent`, `Symptom`, `Treatment`, `MedicalVisit`)
is scoped to the authenticated user, either directly via `Injury.userId` or
transitively through the parent injury. Every read, update, and delete re-checks
ownership in the service layer before touching a nested resource. Retrieval in the
assistant is scoped the same way.

## Authoritative sources

This is a summary. When it disagrees with the code, the code wins.

- Directory layout and conventions — root `CLAUDE.md` §2–3
- Data model — `backend/prisma/schema.prisma`
- API surface — `backend/src/routes.js` and `docs/05-api.md`
- Assistant architecture and decisions — `ai-injury-assistant/docs/02-architecture.md`
- Deployment topology — `docs/14-deployment.md`
