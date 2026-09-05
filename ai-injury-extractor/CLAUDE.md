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
2. Don't regress the documented dev-only security posture without flagging it
3. Keep docs (`README.md`, `docs/*.md`) truthful to actual behavior

## 2. Tech Stack

- Backend: Python 3.12 on AWS Lambda (single function, no framework),
  `groq` SDK (`llama-3.1-8b-instant`)
- Infra: Terraform, API Gateway (REST, AWS_PROXY), DynamoDB (pay-per-request)
- Frontend that calls this API lives outside this directory now, in the
  main app's `frontend/` (Next.js 16, React 19, TypeScript, Tailwind v4,
  shadcn/ui) — see its own `frontend/CLAUDE.md` for conventions there.

Do not introduce a router/framework for the Lambda or split it into multiple
functions unless explicitly required — see `docs/lambda-design.md` "MVP
Design Decision" for why it's currently one function.

## 3. Architecture

```
frontend/app/dashboard/extractor → API Gateway → Lambda (routes on event.httpMethod)
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

- Do not assume authentication or user isolation exists anywhere in this
  repo — verify in code. There isn't any yet.
- DynamoDB key/schema changes (`userId`/`timestamp` composite key) must
  account for the existing item shape and any already-stored data.
- CORS origin is hardcoded in **two** places that must stay in sync:
  `lambda/handler.py` `CORS_HEADERS` and `infrastructure/api_gateway.tf`
  (OPTIONS mock integration response).
- The Groq API key lives in AWS Secrets Manager and is fetched at cold start by
  `load_groq_api_key()` in `lambda/handler.py`. Never reintroduce it as a Lambda
  environment variable or any other Terraform-managed value — Terraform writes
  those into its state file in plaintext (issue #36). `infrastructure/secrets.tf`
  deliberately declares the secret with no `aws_secretsmanager_secret_version`.
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
