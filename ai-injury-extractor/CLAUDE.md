# CLAUDE.md

## 1. Project Overview

This is the backend/infra half of the AI injury extractor: free-text injury
descriptions → structured JSON via an LLM → stored/retrieved from DynamoDB.
Originally a standalone serverless demo (`ai-injury-extractor`), merged into
this monorepo via `git subtree`. Its frontend has since been folded into the
main app's `frontend/` (see `frontend/app/dashboard/extractor/page.tsx` and
`frontend/components/extractor/`) — this directory now covers only the
Lambda + Terraform infra it calls. See README "Integration" for the
original embeddable-component design intent.

Priorities:

1. Correct extraction/storage of the fixed schema (`injury_name`,
   `body_area`, `pain_level`, `symptoms`, `possible_causes`)
2. Don't regress the security posture (shared-secret auth, per-user scoping,
   throttling — issue #32) without flagging it
3. Keep docs (`README.md`, `docs/*.md`) truthful to actual behavior

## 2. Tech Stack

- Backend: Python 3.12 on AWS Lambda (single function, no framework),
  `groq` SDK (`openai/gpt-oss-20b`)
- Infra: Terraform, API Gateway (REST, AWS_PROXY), DynamoDB (pay-per-request)
- Frontend that calls this API lives outside this directory now, in the
  main app's `frontend/` (Next.js 16, React 19, TypeScript, Tailwind v4,
  shadcn/ui) — see its own `frontend/CLAUDE.md` for conventions there.

Do not introduce a router/framework for the Lambda or split it into multiple
functions unless explicitly required — see `docs/lambda-design.md` "MVP
Design Decision" for why it's currently one function.

## 3. Architecture

```
frontend/app/dashboard/extractor → backend/ (cookie auth) → API Gateway (shared secret) → Lambda
                                                                                             ├── Groq API (extraction)
                                                                                             └── DynamoDB "InjuryEntries" (PK userId, SK timestamp)
```

- Code is authoritative over docs; verify claims against `lambda/handler.py`
  and `infrastructure/*.tf` before trusting a doc.
- No caller reaches this API directly any more. `backend/` authenticates the
  user and proxies both routes (`backend/src/services/extractorService.js`),
  presenting a shared secret (`X-Extractor-Secret`) the Lambda checks before
  doing anything else, and the real `userId` the backend resolved from the
  caller's JWT. `authorization = "NONE"` in `infrastructure/api_gateway.tf`
  is API Gateway's own authorizer setting, not the absence of auth — see the
  comment there. This closes issue #32 (previously: a hardcoded
  `"test-user-001"`, no auth, no throttling, reachable straight from the
  browser).

See `docs/lambda-design.md` and `docs/dynamodb-design.md` for full design
rationale; `docs/ROADMAP.md` for known gaps and planned work.

## 4. Sources of Truth

- Implementation: `lambda/handler.py`, `infrastructure/*.tf`
- Frontend implementation: `frontend/components/extractor/`,
  `frontend/services/extractor-api.ts` (main app's frontend, not here)
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
- Prefer simple solutions over new infrastructure — this is a small MVP.
- Prefer targeted lookups over broad exploration: scope `Glob`/`Grep` to a
  specific path (`lambda/`, `infrastructure/`) rather than scanning the
  whole repo, and skip `lambda/venv/` and `lambda/package/` (vendored, not
  source).
- Read a file at most once per session.

## 6. File and Component Placement

- Lambda handler logic → `lambda/handler.py` (single file, no submodules yet)
- Terraform, one file per AWS concern → `infrastructure/*.tf`
- Frontend placement (API client, schema types, UI components) is owned by
  `frontend/CLAUDE.md` now, not this file.

## 7. Safe-Change Rules

- Auth and user isolation now exist (issue #32): the Lambda 403s any request
  without the shared secret, and every read/write is scoped to the `userId`
  the backend sends. Do not add a code path that reads/writes DynamoDB
  without that `userId` — verify in `lambda/handler.py` before assuming
  otherwise.
- DynamoDB key/schema changes (`userId`/`timestamp` composite key) must
  account for the existing item shape and any already-stored data.
- There is no CORS handling any more — this API has no browser caller, so
  don't reintroduce `CORS_HEADERS`/OPTIONS resources without first checking
  whether that assumption changed.
- Treat user-submitted injury text as untrusted input, not as trusted
  instructions to the LLM — it's currently interpolated directly into the
  Groq prompt with no delimiting/sanitization beyond a length check.
- Flag major architectural changes (splitting the Lambda, adding auth,
  changing the DynamoDB key strategy) before introducing them unless the
  task explicitly requires it.

## 8. Project Workflows

Branching, review, and shipping procedures live in the user-level `~/.claude/skills/`
(`next`, `after-next`, `self-review`, `ship`, `address-review`). They are
project-agnostic and read this file for anything specific to this service — the
verification commands in §9 in particular. The harness surfaces available skills
automatically; follow the relevant one when invoked.

`.claude/commands/audit.md` here is the one workflow that stays local, because it is
specific to this subtree: it regenerates this file, audits the service, and files an
issue per finding.

This folder no longer keeps forked copies of the shared skills. If a workflow needs
to behave differently here, state the difference in this file rather than re-forking
the skill.

Note this service tracks issue status by open/closed only — it has no GitHub Project
board and no `status:*` labels, so `/next` and `/ship` skip their status steps.
Priority comes from labels: prefer `security`, then `bug`, then `tests`/`tech-debt`,
with severity noted in each issue body.

## 9. Verification

- Backend: `cd lambda && pytest` runs the test suite (also run in CI via
  `.github/workflows/extractor-ci.yml`). For anything not covered by a test,
  read the changed logic carefully and exercise it with the `curl` examples
  in `README.md` against a deployed stack.
- Frontend changes now belong to the main `frontend/` app — see its own
  `CLAUDE.md` §10 for verification commands (`npm test` now runs the
  extractor's component tests via Vitest).

Do not invent commands or scripts that don't exist in this repo.
