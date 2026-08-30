# CLAUDE.md

## 1. Project Overview

`ai-injury-extractor` is a serverless demo: free-text injury descriptions →
structured JSON via an LLM → stored/retrieved from DynamoDB. Built to show
an end-to-end serverless AWS pattern and to be embeddable as a component in
a larger app (which would own auth + a relational DB — see README
"Integration").

Priorities:

1. Correct extraction/storage of the fixed schema (`injury_name`,
   `body_area`, `pain_level`, `symptoms`, `possible_causes`)
2. Don't regress the documented dev-only security posture without flagging it
3. Keep docs (`README.md`, `docs/*.md`) truthful to actual behavior

## 2. Tech Stack

- Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind v4,
  shadcn/ui on `radix-ui`
- Backend: Python 3.12 on AWS Lambda (single function, no framework),
  `groq` SDK (`llama-3.1-8b-instant`)
- Infra: Terraform, API Gateway (REST, AWS_PROXY), DynamoDB (pay-per-request)

Do not introduce a router/framework for the Lambda or split it into multiple
functions unless explicitly required — see `docs/lambda-design.md` "MVP
Design Decision" for why it's currently one function.

## 3. Architecture

```
Next.js frontend → API Gateway → Lambda (routes on event.httpMethod)
                                    ├── Groq API (extraction)
                                    └── DynamoDB "InjuryEntries" (PK userId, SK timestamp)
```

- Code is authoritative over docs; verify claims against `lambda/handler.py`
  and `infrastructure/*.tf` before trusting a doc.
- `userId` is hardcoded to `"test-user-001"` everywhere — no auth exists yet.
- `/injuries` (GET) and `/extract` (POST) are both unauthenticated by design
  for this dev/demo repo (see README "Integration"). Do not assume this is
  safe for a real deployment with real user data.

See `docs/lambda-design.md` and `docs/dynamodb-design.md` for full design
rationale; `docs/ROADMAP.md` for known gaps and planned work.

## 4. Sources of Truth

- Implementation: `lambda/handler.py`, `frontend/src/`, `infrastructure/*.tf`
- Lambda design/flow: `docs/lambda-design.md`
- DynamoDB schema design: `docs/dynamodb-design.md`
- Roadmap/known gaps: `docs/ROADMAP.md` + GitHub Issues
- Local run / deploy / testing commands: `README.md`

## 5. Coding Conventions

- Don't silently swallow errors — `lambda/handler.py` currently catches
  broad `Exception` per function and returns a generic 500; this is a known
  gap (see issue tracking undifferentiated error handling), not a pattern
  to extend further.
- Validate external/LLM responses before trusting them — the current code
  only checks that expected keys are present, not their types/ranges; don't
  assume that's sufficient when touching this path.
- Search for an existing implementation before creating new abstractions
  (e.g. the small `Field`/`BadgeList` components are duplicated between
  `extraction-result.tsx` and `injury-history-card.tsx` — reuse one rather
  than adding a third copy).
- Prefer simple solutions over new infrastructure — this is a small MVP.
- Prefer targeted lookups over broad exploration: scope `Glob`/`Grep` to a
  specific path (`lambda/`, `frontend/src/`, `infrastructure/`) rather than
  scanning the whole repo, and skip `lambda/venv/` and `lambda/package/`
  (vendored, not source).
- Read a file at most once per session.

## 6. File and Component Placement

- Lambda handler logic → `lambda/handler.py` (single file, no submodules yet)
- API client / fetch logic → `frontend/src/lib/api.ts`
- Shared TS types for the extraction schema → `frontend/src/lib/injury-schema.ts`
- UI primitives (shadcn) → `frontend/src/components/ui/`
- Feature components → `frontend/src/components/`
- Terraform, one file per AWS concern → `infrastructure/*.tf`

## 7. Safe-Change Rules

- Do not assume authentication or user isolation exists anywhere in this
  repo — verify in code. There isn't any yet.
- DynamoDB key/schema changes (`userId`/`timestamp` composite key) must
  account for the existing item shape and any already-stored data.
- CORS origin is hardcoded in **two** places that must stay in sync:
  `lambda/handler.py` `CORS_HEADERS` and `infrastructure/api_gateway.tf`
  (OPTIONS mock integration response).
- Treat user-submitted injury text as untrusted input, not as trusted
  instructions to the LLM — it's currently interpolated directly into the
  Groq prompt with no delimiting/sanitization beyond a length check.
- Flag major architectural changes (splitting the Lambda, adding auth,
  changing the DynamoDB key strategy) before introducing them unless the
  task explicitly requires it.

## 8. Project Workflows

Branching, review, and shipping procedures live in `.claude/skills/` — the harness surfaces
available skills automatically; follow the relevant one when invoked.

## 9. Verification

There is no automated test suite yet (see `docs/ROADMAP.md` and the "no
tests" GitHub issue) — verify changes manually:

- Frontend: `cd frontend && npm run lint`, then `npm run dev` and exercise
  the affected flow in the browser.
- Backend: no lint/test tooling configured — read the changed logic
  carefully, and exercise it with the `curl` examples in `README.md`
  against a deployed stack.

Do not invent commands or scripts that don't exist in `package.json` or
this repo.
