# Post-Merge Analysis: `apps/extractor` subtree merge

> **ARCHIVED — historical record, not current guidance.** Retired 2026-08-31.
>
> This is point-in-time output from two completed merges, kept for the reasoning
> behind decisions already taken. Do not act on it.
>
> Most of it no longer describes the repo. `apps/extractor/` does not exist — it
> was renamed to top-level `ai-injury-extractor/`, and this document's own second
> report recommended that deletion, which has since happened. The
> `.claude/skills/` triplication it identified has also been resolved: those
> workflows now live once in the user-level `~/.claude/skills/`.
>
> For current architecture see `docs/03-system-design.md` and the root
> `CLAUDE.md`. The procedure that produced this report is archived alongside it
> as `post-merge-analysis-procedure.md`.

Generated 2026-08-30. Analyzes the state of the repo immediately after
`git subtree --squash` merged the standalone `injury-journal-extractor`
(GitHub: `sabrahermassi/ai-injury-extractor`) repo into this monorepo at
`apps/extractor` (commits `2355baa` squash, `8346f80` merge).

Claim tags: **[confirmed]** = read the actual file/config. **[inferred]** =
reasoned from naming/structure without direct confirmation.

---

## 1. Structure analysis

**[confirmed]** Current top-level layout:

```text
injury_journal/
├── backend/              Express API (existing app, at repo root)
├── frontend/              Next.js app (existing app, at repo root)
├── docs/                  Root planning docs (pre-implementation)
├── .github/workflows/     Only test.yml (backend tests) lives here
├── .claude/               Root Claude Code skills/commands
└── apps/
    └── ai-injury-extractor/         Newly merged Lambda AI-extraction service
        ├── frontend/       Separate Next.js app (its own package.json, own port 3000)
        ├── lambda/          Python 3.12 handler + pytest tests
        ├── infrastructure/  Terraform (API Gateway, Lambda, DynamoDB, IAM)
        ├── docs/            dynamodb-design.md, lambda-design.md, ROADMAP.md
        ├── .claude/          Extractor-scoped skills/commands (own gh repo refs)
        ├── .github/          workflows/ci.yml + dependabot.yml (**not discovered by GitHub — see §4**)
        └── CLAUDE.md, README.md
```

- **[confirmed]** The existing apps (`backend/`, `frontend/`) live at repo
  root, not under an `apps/` namespace, while the new service landed at
  `apps/extractor/`. There is no `apps/web/`. This is a structural
  asymmetry, not a documentation error — root `CLAUDE.md` already
  correctly describes `backend/`/`frontend/` at root, so nothing is stale,
  but the repo now has two different placement conventions for "an app."
- **[confirmed]** `apps/extractor/frontend/` is a second, independent
  Next.js application (own `package.json`, own component tree under
  `src/`, own tests). It is not just UI code — it's a fully separate app
  with its own build. It doesn't obviously belong inside
  `frontend/` (the main app's Next.js project) since it has a different
  purpose (calls a separate API Gateway URL, different data schema) — but
  it does mean the repo now has **two Next.js frontends**, which is worth
  a deliberate decision rather than default inertia.
- **[confirmed]** `apps/extractor/lambda/` and `apps/extractor/infrastructure/`
  are backend/infra-only, correctly placed together.

**Proposed target structure** (no moves made — this is a proposal only):

```text
injury_journal/
├── apps/
│   ├── web/           ← rename: backend/ + frontend/ moved here, OR
│   │                     leave backend/+frontend/ at root and rename
│   │                     apps/extractor → ai-injury-extractor/ instead — pick ONE
│   │                     convention repo-wide (see action list)
│   └── ai-injury-extractor/      (unchanged internal layout — already coherent)
├── docs/                repo-root planning docs (unchanged)
└── .github/workflows/   consolidated — see §4
```

One-line reasoning: the only real problem is *inconsistency*, not
placement — `apps/extractor`'s internal layout (frontend/lambda/infrastructure/docs)
is already sensible and shouldn't change. The fix is picking one of "root
apps" or "apps/ namespace" for everything, not moving `apps/extractor`'s
internals around.

---

## 2. Duplication check

- **[confirmed]** No shared dependency-management tooling (no npm
  workspaces, no Turborepo/Nx) — `backend/`, `frontend/`, and
  `apps/extractor/frontend/` are three fully independent `package.json` +
  lockfile trees. This is fine for independent deploys but means no
  automatic deduping.
- **[confirmed]** `frontend/package.json` vs `apps/extractor/frontend/package.json`:
  nearly identical dependency sets (`next@16.3.3`, `react@19.2.4`,
  `radix-ui@^1.6.7`, `tailwindcss@^4`, `eslint-config-next@16.3.3`). Only
  differences: `shadcn` (`^4.16.0` root vs `^4.16.1` extractor — trivial
  patch drift) and the extractor frontend additionally has a full Vitest +
  Testing Library dev-dependency set (root frontend has none — see §5).
- **[confirmed]** `backend/package.json` uses `eslint@^10.8.0`; both
  frontends use `eslint@^9`. This predates the merge (backend and
  frontend were already on different major ESLint versions) — not
  introduced by this merge, just noting it's still true.
- **[confirmed]** `eslint.config.mjs` in `frontend/` and
  `apps/extractor/frontend/` are byte-identical files.
- **[confirmed]** No duplicated business logic: the two frontends serve
  different data models (extractor: `injury_name`/`body_area`/`pain_level`/
  `symptoms`/`possible_causes` flat record; main app: `Injury` →
  `TimelineEvent`/`Symptom`/`Treatment`/`MedicalVisit` relational model via
  Prisma). No shared API client, validation logic, or types exist between
  them today, and there's no obvious extraction target yet — a
  `packages/shared` would be premature until/unless `apps/ai-assistant` or
  an actual integration between web and extractor materializes.
- **[confirmed]** No conflicting environment variable *names* — backend
  uses `PORT`/`DATABASE_URL`/`JWT_SECRET`/`FRONTEND_URL`/`NODE_ENV`; root
  frontend uses `NEXT_PUBLIC_API_URL`; extractor lambda uses
  `GROQ_API_KEY`/`GROQ_MODEL`/`DYNAMODB_TABLE`/`ALLOWED_ORIGIN`; extractor
  frontend also uses `NEXT_PUBLIC_API_URL` (pointed at a *different* API —
  see §5 for the resulting local-dev ambiguity, not a naming collision
  per se).
- **[confirmed]** No conflicting TS/build configs — `apps/extractor/frontend/tsconfig.json`
  and `next.config.ts` are independent of the root frontend's and don't
  reference each other.

---

## 3. Markdown/docs consolidation

- **[confirmed]** `.md` files found: root (`README.md`, `CLAUDE.md`,
  `ROADMAP.md`, `docs/01`–`08`, `docs/14-deployment.md`), `backend/README.md`,
  `frontend/README.md`, `frontend/AGENTS.md` (aliased into `frontend/CLAUDE.md`
  via `@AGENTS.md`), and under `apps/extractor/`: `CLAUDE.md`, `README.md`,
  `frontend/README.md`, `docs/dynamodb-design.md`, `docs/lambda-design.md`,
  `docs/ROADMAP.md`.
- **[confirmed]** Each app already keeps its own `CLAUDE.md` with its own
  build/test/architecture notes, per your stated preference — no change
  needed there.
- **[confirmed]** No git-workflow / PR-review-process / deployment-process
  doc exists as markdown in *either* app — that guidance instead lives
  entirely as `.claude/skills/` (`ship`, `address-review`, `self-review`,
  `next`, `after-next`, `security-checkup`). Root and
  `apps/extractor/.claude/skills/` both define all six of these skill
  names, but with **different content** in every case (verified via
  byte-diff — none are identical). The extractor's versions are
  customized for its own stack and, critically, still hardcode
  `--repo sabrahermassi/ai-injury-extractor` in `gh` commands (see action
  list — this is now wrong post-merge, not just a stylistic duplicate).
- **[confirmed]** `.claude/commands/optimize-md.md` and
  `apps/extractor/.claude/commands/optimize-md.md` are near-identical
  (only line-wrap/rephrasing differences) — this one is a genuine
  candidate for consolidating into a single root-level command, since its
  content isn't app-specific at all.
- **[confirmed]** `.claude/agents/explorer.md` vs
  `apps/extractor/.claude/agents/explorer.md`: same role, but the
  extractor version hardcodes `ai-injury-extractor` as "the repo" in its
  first line — cosmetic-looking but factually wrong post-merge (it's a
  subdirectory of `injury_journal` now, not "the repo").
- **[confirmed]** Naming inconsistency: root has `/audit-docs`
  (docs-vs-code audit), extractor has `/docs-audit` — same purpose,
  different name. Extractor also has `.claude/commands/audit.md` (a
  broader "first audit of an unfamiliar codebase + file GitHub issues"
  command) with no root equivalent — that one is fine to stay
  extractor-only, it's not a duplicate of anything at root.
- **Proposed consolidation**: root `CLAUDE.md`/`CONTRIBUTING.md` don't
  currently claim ownership of git-workflow process at all (it's 100% in
  skills), so there's no markdown-level duplication to merge — the actual
  duplication is in `.claude/skills/`, addressed in the action list below,
  not in `.md` docs.

---

## 4. CI/CD pipeline check

- **[confirmed]** Two workflow files exist in the repo:
  - `.github/workflows/test.yml` (root — backend Jest tests, triggers on
    push/PR to `main` and `feature/backend-setup`)
  - `apps/extractor/.github/workflows/ci.yml` (frontend lint/test/build +
    lambda pytest, triggers on push/PR to `main`)
- **[confirmed — high priority]** GitHub Actions only discovers workflow
  files under `.github/workflows/` **at the repository root**. A workflow
  file nested at `apps/extractor/.github/workflows/ci.yml` is not read by
  GitHub Actions at all. Since the squash-merge preserved the extractor's
  original repo-root `.github/` as a subdirectory rather than merging it
  into the monorepo's real root `.github/workflows/`, **the extractor's
  entire CI pipeline (frontend lint/test/build, lambda pytest) is
  currently not running on any push or PR.** Same issue applies to
  `apps/extractor/.github/dependabot.yml` — Dependabot also only reads
  config from the repo-root `.github/`, so extractor's dependency updates
  are not being tracked either.
- **[confirmed]** No filename collision between the two workflow files
  (`test.yml` vs `ci.yml`) — irrelevant while one is inert, but also not a
  future problem once moved, since the names differ.
- **[confirmed]** Neither workflow has any `paths:` filter — `test.yml`
  runs on every push/PR to `main` regardless of what changed, and
  `ci.yml` (once/if moved to root) would do the same. Today this is
  harmless for `test.yml` since it only tests `backend/`, but once
  `ci.yml` is moved to the real root, both need `paths:` filters (e.g.
  `paths: ['backend/**']` and `paths: ['apps/extractor/**']`) or every
  push will run both apps' full CI regardless of what changed.
- **[confirmed]** `ci.yml`'s steps don't hardcode the old standalone
  repo's name or an old working-directory assumption beyond the
  `working-directory: frontend` / `working-directory: lambda` defaults,
  which are already relative to `apps/extractor/` correctly *if the file
  is moved there and run with that as its effective root* — GitHub Actions
  `working-directory` is relative to the checkout root, not the workflow
  file's own location, so once moved to `.github/workflows/`, those
  `working-directory: frontend` / `working-directory: lambda` lines must
  become `working-directory: apps/extractor/frontend` and
  `apps/extractor/lambda` respectively, and
  `cache-dependency-path: frontend/package-lock.json` similarly needs the
  `apps/extractor/` prefix.
- **[confirmed]** No secrets appear hardcoded in either workflow;
  `ci.yml`'s build step uses a placeholder `NEXT_PUBLIC_API_URL:
  https://example.invalid`, which is fine for a build-only check.

---

## 5. Dependency, runtime, and environment consistency

- **[confirmed]** No `.nvmrc` exists anywhere in the repo. `backend`'s CI
  and `apps/extractor`'s CI both pin Node 24 via `actions/setup-node`
  (consistent with each other), but neither `package.json` declares an
  `engines` field, so local dev has no enforced Node version for either
  app.
- **[confirmed]** Lambda runtime is `python3.12` in
  `infrastructure/lambda.tf`, matching `apps/extractor/.github/workflows/ci.yml`'s
  `setup-python` pin of `"3.12"` — consistent.
- **[confirmed]** Dependency major-version comparison: both frontends
  align on `next@16.3.3`/`react@19.2.4` (see §2). `backend` and both
  frontends diverge on ESLint major version (10 vs 9) — pre-existing, not
  merge-introduced.
- **[confirmed]** Secrets/env handling differs by design, not by
  oversight: `backend` uses `.env` + `dotenv`-style local config;
  `apps/extractor`'s Lambda uses Terraform variables
  (`groq_api_key` marked `sensitive`) injected as Lambda environment
  variables at deploy time, with `.gitignore` correctly excluding
  `*.tfstate`, `terraform.tfvars`, and `.env*`. No committed secrets found
  in either app (checked for `.tfvars`/`.env*` tracked in
  `apps/extractor` — none present). This inconsistency is inherent to
  "Node app on a conventional host" vs "Lambda behind Terraform" and
  doesn't need standardizing.
- **[confirmed]** ESLint configs don't conflict — `frontend/eslint.config.mjs`
  and `apps/extractor/frontend/eslint.config.mjs` are identical files but
  scoped to their own directories; `backend/.eslintrc` is separate and
  unrelated (different language target). No root-level config exists, and
  none of the three currently need one — each app's tooling only lints
  its own tree.
- **[confirmed]** No `.prettierrc`/`.editorconfig` exists in
  `apps/extractor` or `apps/extractor/frontend` (only `backend` has a
  `.prettierrc`). Not a conflict, just an absence — extractor's frontend
  currently has no enforced formatting config at all.
- **[confirmed]** Testing convention mismatch: `backend` uses Jest +
  Supertest integration tests against a real Postgres DB (no mocking);
  `apps/extractor/lambda` uses **pytest + moto** (mocks AWS/Groq); root
  `frontend` has **no test runner configured at all**;
  `apps/extractor/frontend` has Vitest + Testing Library component tests.
  This isn't an "eval-harness vs. normal tests" split as anticipated —
  it's a more mundane "some apps have tests, some don't, and the ones
  that do use different strategies (real-DB integration vs. mocked-AWS
  unit)" situation. Worth knowing, not necessarily worth unifying given
  the apps are independently deployed.
- **[confirmed — real conflict]** Local dev server ports: root
  `frontend` (`next dev`) and `apps/extractor/frontend` (`next dev`) both
  default to **port 3000** with no override configured in either
  `package.json` or `next.config.ts`. Running both locally at once will
  have the second one fail to bind 3000 (Next.js auto-increments to 3001
  in that case, colliding with `backend`'s port 3001 instead). `backend`
  itself defaults to 3001 via `PORT` env var (overridable).

---

## 6. Git history and release artifacts

- **[confirmed]** The merge used `git subtree --squash` (commit `2355baa`,
  "Squashed 'apps/extractor/' content from commit aa90a10", merged via
  `8346f80`). This collapses the extractor's full commit history into a
  single commit — none of the original repo's individual commits, authors,
  or commit messages are preserved in this repo's history.
- **[confirmed]** No git tags exist in this repository (`git tag` returns
  empty), so no version tags were lost *from this repo* — but that also
  means if `ai-injury-extractor` (the original standalone repo) had any
  version tags or GitHub Releases, **they do not exist here and were never
  going to carry over via subtree merge** regardless. I could not verify
  from inside this repo whether the original had tags/releases.
- **[confirmed — could not verify]** I don't have `gh` access or a
  configured remote for the original `injury-journal-extractor`/
  `ai-injury-extractor` repo from this session (only `origin` →
  `sabrahermassi/injury_journal` is configured). I could not check GitHub
  for existing tags, Releases, or open issues/PRs on the original repo.
  **You should check `sabrahermassi/ai-injury-extractor` on GitHub
  directly** for any Releases or tags before assuming none exist — this
  wasn't ruled out, just unverifiable from here.
- **[confirmed]** Related to §3/§4: several of the extractor's own
  `.claude/skills` still reference `gh issue list --repo
  sabrahermassi/ai-injury-extractor` — if that repo has open issues you
  intended to keep tracking, they are not visible from
  `sabrahermassi/injury_journal` and won't be picked up by `/next` or
  `/ship` run from this monorepo unless those skill files are updated
  (see action list).

---

## 7a. Architecture review post-merge

- **[confirmed]** Service boundary is clean at the code level: nothing in
  `backend/` or `frontend/` imports from or references `apps/extractor/`,
  and nothing in `apps/extractor/` references the main app. No circular
  dependency exists.
- **[confirmed — gap]** There is **no documentation anywhere** (root
  `CLAUDE.md`, root `README.md`, or `apps/extractor/CLAUDE.md`) describing
  how `apps/web`-equivalent (`backend`/`frontend`) is *supposed* to call
  `apps/extractor`'s API, or whether it's supposed to at all yet.
  `apps/extractor/README.md`'s own "Integration" section describes the
  intended pattern in the abstract (host app owns auth, could persist to
  Postgres instead of DynamoDB) but this is aspirational/design-doc
  language, not a description of anything wired up — and nothing in the
  main app's docs references the extractor at all. For someone new to the
  repo, it will not be obvious that `apps/extractor` is even meant to
  eventually connect to the main app rather than being a fully unrelated
  side project living in the same repo.
- **[confirmed]** No coupling was introduced that forces the two services
  to deploy together:
  - Terraform state (`infrastructure/`) is entirely scoped to
    `apps/extractor` — local `.tfstate` (gitignored), no shared/remote
    backend, no references to the main app's infrastructure. `backend`/
    `frontend` have no Terraform at all (per `docs/14-deployment.md`,
    they deploy via Render/Vercel-style platform deploys, not Terraform)
    — there's no state-file overlap because there's nothing to overlap
    with.
  - CI triggers: currently *neither* real problem nor real safety exists
    here yet, because (per §4) the extractor's CI isn't running at all.
    Once moved to root with correct `paths:` filters, the two pipelines
    would be independent and this concern resolves itself — but until
    that fix lands, there is no CI-enforced guarantee against
    accidental cross-triggering either way.
  - No shared deploy scripts, shared Docker images, or shared
    infrastructure-as-code modules exist between the two apps.
- **[confirmed]** `apps/ai-assistant` (mentioned in your context as
  planned but not yet merged) has no trace in the repo yet — nothing to
  evaluate.
- Overall judgment: the merge itself did not create structural risk — the
  two services are cleanly separable today. The actual risk is *absence*
  of documentation and *dormant* CI, both fixable without any
  architectural rework. This finding did not require re-running through
  Opus — the situation is: nothing coupled, but nothing documented either,
  which is a low-ambiguity conclusion.

---

## 7b. Security review post-merge

- **[confirmed]** `apps/extractor`'s Lambda has **no authentication** on
  either endpoint (`POST /extract`, `GET /injuries`) —
  `infrastructure/api_gateway.tf` sets `authorization = "NONE"` on both,
  and `lambda/handler.py` hardcodes `USER_ID = "test-user-001"` for every
  request, meaning every caller reads and writes the same single logical
  user's data. This is explicitly documented as an intentional dev/demo
  posture in both `apps/extractor/CLAUDE.md` and `README.md` ("Integration"
  section says the host app is expected to supply auth) — flagging per
  your request, not as a surprise, but as something that must not be
  exposed publicly as-is if this Lambda is ever deployed reachable from
  the internet without a gateway/auth layer in front of it.
- **[confirmed]** No rate limiting exists anywhere in the extractor
  stack (API Gateway has no throttling configured in `api_gateway.tf`,
  Lambda has no self-throttling) — combined with the no-auth point above,
  an open `/extract` endpoint would let anyone burn your Groq API quota.
  Contrast: the main app's `backend` has `apiLimiter`/`authLimiter`
  (skipped only in `NODE_ENV=test`).
- **[confirmed]** IAM role (`iam.tf`) is scoped tightly, not overly
  permissive: the Lambda's DynamoDB policy grants only
  `dynamodb:PutItem`/`dynamodb:Query` on the single `injury_entries`
  table ARN (not `*`), plus the standard AWS-managed
  `AWSLambdaBasicExecutionRole` for CloudWatch Logs. No broad
  `dynamodb:*` or wildcard resource grants found.
- **[confirmed]** No secrets committed in configs — `GROQ_API_KEY` is a
  Terraform `sensitive` variable injected as a Lambda env var, not
  hardcoded; `.gitignore` correctly excludes `.env*`, `*.tfstate`,
  `terraform.tfvars`.
- **[confirmed]** CORS: `Access-Control-Allow-Origin` is controlled via
  the `allowed_origin` Terraform variable (default
  `http://localhost:3000`) and must be kept in sync between
  `lambda/handler.py`'s `CORS_HEADERS` and `api_gateway.tf`'s OPTIONS mock
  integration — this dual-source-of-truth risk is already called out in
  `apps/extractor/CLAUDE.md` §7, not a new finding, just confirming it's
  still true post-merge.
- **[confirmed]** Prompt-injection handling: `handler.py` wraps
  user-submitted text in `<injury_description>` tags and instructs the
  model to treat tag contents strictly as data, plus strips any literal
  `<injury_description>`/`</injury_description>` sequences from user
  input before interpolation — a reasonable mitigation, not a
  vulnerability, noting it since it's directly adjacent to the "treat
  user input as untrusted" flag already in extractor's own `CLAUDE.md`.
- **[confirmed]** Auth model inconsistency between the two apps: main app
  uses JWT in an httpOnly cookie + CSRF double-submit
  (`backend/src/middleware.js`); extractor has no auth model at all. This
  is expected given the extractor's stated "host app owns auth" design,
  not a bug — but it means if/when the two are ever actually integrated,
  someone has to design how the main app's session maps to a
  per-user-scoped call into the extractor (today's hardcoded
  `test-user-001` won't work for multiple real users).
- This is checklist-level work as anticipated — Sonnet default effort was
  sufficient, no findings here looked ambiguous enough to warrant a
  dedicated `/security-review` pass, though one could still be run later
  for a deeper look specifically at the Lambda's exception handling
  (broad `except Exception` blocks returning generic 500s — already a
  known/tracked gap per extractor's own `CLAUDE.md` §5).

---

---

# Post-Merge Analysis: `ai-injury-assistant` subtree merge

Generated 2026-08-31. Analyzes the state of the repo immediately after
`git subtree add --prefix=ai-injury-assistant` (no `--squash`) merged the
standalone `injury-journal-ai` repo (GitHub: `sabrahermassi/injury-journal-ai`)
into this monorepo at `ai-injury-assistant/` (merge commit `92095cd`, subtree
tip `436cc5d`).

Claim tags: **[confirmed]** = read the actual file/config. **[inferred]** =
reasoned from naming/structure without direct confirmation.

## 1. Structure analysis

- `ai-injury-assistant/` landed self-contained: `src/` (ai-agent, ai-assistant,
  auth, config, embeddings, ingestion, injuries, lib, llm, rag, retrieval,
  routes, safety), `prisma/`, `frontend/`, `evaluation/`, `tests/`, `docs/`,
  `.claude/`, `.github/`, plus its own package.json/tsconfig/eslint/prettier/
  docker-compose. **[confirmed]**
- It is a *full second backend*, not a library: Express 5 + Prisma 6 +
  PostgreSQL/pgvector, with its own `app.ts`/`index.ts` and HTTP routes.
  **[confirmed]**
- **Its Prisma schema duplicates the entire journal data model.** Models:
  `User`, `Injury`, `Symptom`, `Treatment`, `MedicalVisit`, `TimelineEvent`,
  `DocumentChunk`. The first six mirror `backend/prisma/schema.prisma`;
  `DocumentChunk` (with `embedding Unsupported("vector(1024)")`) is the only
  genuinely new model. **[confirmed]**
- Ingestion reads from its **own** database, not from `backend/`'s:
  `src/ingestion/reader/postgres-reader.ts` calls `prisma.injury.findMany()`
  against its own client. There is no sync/replication path between the two
  databases anywhere in the tree. **[confirmed]**
- The two schemas have **already drifted**: `backend/` now has
  `TreatmentOutcome` + `Treatment.followUpDueAt`/`courseId` (PR #45);
  `ai-injury-assistant/` does not. **[confirmed]**
- `ai-injury-assistant/frontend/` is a separate Next.js 16 app (own
  package.json, own `UI_GUIDE.md`). Contents are minimal: `app/page.tsx`
  (12 lines), `components/ai-agent/ask-form.tsx`, `components/PageContainer.tsx`,
  and 6 shadcn `ui/` primitives. **[confirmed]**
- **Does its frontend belong in root `frontend/`?** Yes, eventually — same
  reasoning as the extractor merge (which moved its frontend into root
  `frontend/` in PR #33). Evidence: the ask-form is one screen consuming one
  API; the root frontend already owns auth/session and the injury list the
  picker needs; and `ai-injury-assistant/CLAUDE.md` §"UI Guidelines" already
  tells its own agents to look at "the separate journal application's
  frontend... for a precedent." Not moving it yet — flagged only.
  **[confirmed]**
- **Pre-existing structural problem, unrelated to this merge:**
  `apps/extractor/` (75 files) still exists alongside `ai-injury-extractor/` (41 files),
  and the two **differ** — `apps/extractor/` additionally contains `.github/`
  and `frontend/`, and their `CLAUDE.md`, `README.md`, `handler.py`,
  `test_handler.py`, and all 7 `.claude/` skill files differ. The PR #33
  restructure evidently copied rather than moved, and left the old tree
  behind. **[confirmed]**

### Proposed target structure

```
backend/                 Express CRUD + auth API. Owns User/Injury/... and issues JWTs.
frontend/                The single user-facing Next.js app (dashboard + extractor UI + AI ask UI).
ai-injury-extractor/               Lambda extraction service (infra + lambda only, no frontend).
ai-injury-assistant/       AI/RAG service: src/, prisma/, evaluation/, embeddings service. No frontend.
docs/                    Root planning docs + these merge reports.
.claude/                 Single shared skill/command set for the whole monorepo.
.github/workflows/       All CI, one path-filtered workflow per app.
```

- `apps/` — delete entirely; `apps/extractor/` is a stale duplicate of `ai-injury-extractor/`.
- `ai-injury-assistant/frontend/` → fold into root `frontend/` (one app, one login, one shell).
- `ai-injury-assistant/.claude/`, `ai-injury-extractor/.claude/` → consolidate into root `.claude/`.
- `ai-injury-assistant/.github/workflows/ci.yml` → root `.github/workflows/ai-ci.yml` with path filters.

## 2. Duplication check

- **Backend dependency overlap is near-total and versions agree**, which is
  good news for a future consolidation. Identical in `backend/` and
  `ai-injury-assistant/`: `@prisma/client` ^6.19.3, `prisma` ^6.19.3, `bcrypt`
  ^6.0.0, `cors` ^2.8.6, `dotenv` ^17.4.2, `express` ^5.2.1, `helmet` ^8.3.0,
  `jsonwebtoken` ^9.0.3, `zod` ^4.4.3. Only drift: `express-rate-limit`
  ^8.6.1 vs ^8.6.2. **[confirmed]**
- **Frontend overlap likewise**: both on `next` 16.3.3, `radix-ui` ^1.6.7,
  `tailwind-merge` ^3.6.0, `tw-animate-css` ^1.4.0, `class-variance-authority`
  ^0.7.1, `clsx` ^2.1.1. Drift: `react`/`react-dom` 19.2.4 vs 19.2.8,
  `lucide-react` ^1.28.0 vs ^1.34.0, `shadcn` ^4.16.0 vs ^4.19.0. **[confirmed]**
- **`shadcn` is a runtime `dependency` in root `frontend/` but a
  `devDependency` in `ai-injury-assistant/frontend/`.** The AI repo already
  fixed this for itself (its branch `fix/198-shadcn-devdep-2`); root
  `frontend/` still has the bug. **[confirmed]**
- **JWT verification is reimplemented, not shared** — and the two
  implementations are incompatible. See §7a/§7b; this is the headline finding.
  **[confirmed]**
- **Duplicated domain model**: the six journal Prisma models exist in both
  schemas with no shared source of truth and existing drift (§1). **[confirmed]**
- Env var names collide by design in two cases: both apps use `DATABASE_URL`
  (pointing at *different* databases — plain Postgres vs pgvector) and
  `JWT_SECRET` (which must hold the *same* value). A single root `.env` would
  break the first while being required for the second. **[confirmed]**
- TypeScript configs differ and cannot trivially merge: `ai-injury-assistant/`
  is `target ES2022 / module NodeNext / rootDir src / outDir dist`; root
  `frontend/` is `target ES2017 / module esnext / moduleResolution bundler /
  noEmit` with the Next plugin. Both `strict: true`. **[confirmed]**
- Prettier configs conflict: `backend/.prettierrc` has `"trailingComma": "es5"`
  + `tabWidth: 2`; `ai-injury-assistant/.prettierrc` has `"trailingComma": "all"`
  and no tabWidth. Root `frontend/` has no prettier config at all. **[confirmed]**
- ESLint is split across major versions: `backend/` ^10.8.0,
  `ai-injury-assistant/` ^10.9.1, both frontends ^9 (+ `eslint-config-next`).
  Note `backend/`'s lint is currently broken anyway (legacy `.eslintrc` vs
  ESLint 10 flat config — tracked as issue #30). **[confirmed]**

## 3. Markdown/docs consolidation

- `.claude/` now exists in **four** places: root, `ai-injury-assistant/`,
  `ai-injury-extractor/`, `apps/extractor/`. **[confirmed]**
- Six skills are duplicated across root and `ai-injury-assistant/` and **all six
  differ**: `address-review` (549 vs 558 lines), `after-next` (43 vs 42),
  `next` (130 vs 132), `security-checkup` (80 vs 76), `self-review` (146 vs
  148), `ship` (184 vs 211). `agents/explorer.md` and
  `claude-security-guidance.md` also differ. **[confirmed]**
- Skills unique to one app: root has `audit-docs`, `commands/optimize-md.md`,
  `commands/post-merge-analysis.md`, `commands/ui-rework.md`;
  `ai-injury-assistant/` has `post-fix-review`; `ai-injury-extractor/` has `docs-audit`
  and `commands/audit.md`. **[confirmed]**
- These are all *workflow* docs (branching, review, shipping) — exactly the
  category the extractor report said should be unified at root. Recommend one
  root `.claude/skills/` set, with genuinely app-specific steps handled by
  conditional sections inside each skill rather than by forked copies.
  Reconciling six drifted pairs is real work and needs its own pass — the
  `ship` skills differ by 27 lines, which is not a rename-level difference.
  **[confirmed]**
- Keep separate and app-specific: `ai-injury-assistant/CLAUDE.md`,
  `ai-injury-assistant/README.md` (16.3K, has setup/DB/embedding-service
  commands), `ai-injury-assistant/UI_GUIDE.md`, and its `docs/01..07-*.md`
  architecture set. Root `CLAUDE.md` §11 already points at them (added
  this session, uncommitted). **[confirmed]**
- Two `claude-security-guidance.md` files (root and AI) differ — worth
  reconciling since both describe the same security model for what is now one
  repo. **[confirmed]**

## 4. CI/CD pipeline check

- **`ai-injury-assistant/.github/workflows/ci.yml` is currently inert.** GitHub
  Actions only reads workflows from the repo-root `.github/workflows/`, so
  after the subtree merge the AI app has *no CI running at all*. Same is true
  of `apps/extractor/.github/workflows/ci.yml`. **[confirmed]**
- No filename collision today: root has `test.yml`, `frontend-ci.yml`,
  `extractor-ci.yml`; the incoming file is `ci.yml`. It would need renaming
  (e.g. `ai-ci.yml`) on principle, not necessity. **[confirmed]**
- All three existing root workflows correctly use `paths:` filters
  (`backend/**`, `frontend/**`, `ai-injury-extractor/lambda|infrastructure/**`), so
  they will **not** be triggered by `ai-injury-assistant/**` changes. The merge
  did not break existing trigger isolation. **[confirmed]**
- The incoming AI workflow has **no `paths:` filter** (`on: pull_request` +
  `push: branches: [main]`). If moved to root as-is it would run its full
  Postgres+pgvector+Python+LLM-eval pipeline on *every* PR, including
  frontend-only ones. It also has no `working-directory` default, so it would
  need `defaults.run.working-directory: ai-injury-assistant`. **[confirmed]**
- Hardcoded/standalone-repo assumptions in that workflow: `npm ci`,
  `npx prisma db push/seed`, `pip install -r src/embeddings/requirements.txt`,
  and `uvicorn src.embeddings.embedding_api:app` all assume repo-root =
  app-root. **[confirmed]**
- It requires a repo-level secret `secrets.GROQ_API_KEY`, which must now exist
  on *this* repo. The eval step is `continue-on-error: true`, so a missing
  secret would degrade rather than block. **[confirmed]**
- It pins actions by commit SHA (`actions/checkout@08eba0b…`,
  `setup-node@49933ea…`, `setup-python@5fda3b9…`) and sets
  `persist-credentials: false` — stricter supply-chain hygiene than the
  existing root workflows. Worth adopting repo-wide rather than loosening.
  **[confirmed]**

## 5. Dependency, runtime, and environment consistency

- Node: AI CI pins `node-version: 22`; no `engines` field or `.nvmrc` in any
  of the four apps, so nothing else is pinned. **[confirmed]**
- Python: AI CI pins `3.12` for the embedding service; `ai-injury-extractor/lambda`
  pins its own runtime in Terraform (not re-verified this pass). **[inferred]**
- **The embedding service source *is* in this repo**, contrary to the
  "separate self-hosted service" framing: `ai-injury-assistant/src/embeddings/`
  contains `embedding_api.py`, `embedding_service.py`, `requirements.txt`,
  `Dockerfile`, `docker-healthcheck.py`, and two Python unit-test files. It is
  a co-located service, not an external dependency. **[confirmed]**
- **Port collisions, and they are exactly swapped:** AI backend defaults to
  `PORT ?? 3000` (`src/config/port.ts`), colliding with root `frontend/`
  (Next default 3000). AI frontend runs `next dev --port 3001`, colliding with
  root `backend/` (3001, per root CLAUDE.md §5). Running all four locally
  fails today without overrides. **[confirmed]**
- Env handling is consistent in mechanism (`.env` + dotenv everywhere), but
  `ai-injury-assistant/.env.example` documents four vars the root app has never
  needed: `GROQ_API_KEY`, `EMBEDDING_API_KEY`, `ALLOWED_ORIGIN`, plus its own
  `DATABASE_URL`. **[confirmed]**
- **`JWT_SECRET` must be identical across `backend/` and `ai-injury-assistant/`,
  and that requirement is documented in neither app's deploy docs.** The AI
  `.env.example` says "shared secret used to verify Bearer JWTs" but never
  names the issuing app; root `CLAUDE.md` §5 lists `JWT_SECRET` with no
  mention of a second consumer (§11 added this session now says it —
  uncommitted). **[confirmed]**
- Test runners diverge three ways: `backend/` Jest+Supertest (JS, ESM via
  `--experimental-vm-modules`); `ai-injury-assistant/` Jest+ts-jest+Supertest
  plus a bespoke `evaluation/ai-system` LLM-judge harness; root `frontend/`
  Vitest+Testing Library; `ai-injury-assistant/frontend/` has **no test script
  at all** (only `typecheck`). **[confirmed]**
- Configs left self-contained per instruction — reported, not proposed for
  unification this pass.

## 6. Git history and release artifacts

- **Full history came through as intended.** `436cc5d` (the AI repo's tip) is
  an ancestor of `HEAD`; 307 commits are reachable from it; the repo went
  from ~41 to 348 total commits. Original authorship is preserved.
  **[confirmed]**
- **Caveat worth knowing:** `git log -- ai-injury-assistant/` returns only **1**
  commit (the merge). The imported commits recorded their original unprefixed
  paths (`src/…`, `evaluation/…`), so path-filtered log does not follow them.
  The history is in the graph, not in the path filter — use
  `git log 436cc5d` or `--follow` to browse it. This will surprise anyone
  running blame/log on a file under `ai-injury-assistant/`. **[confirmed]**
- Tags/releases: this repo has **0 tags**; `gh release list` on
  `sabrahermassi/injury-journal-ai` returned **no releases**. Nothing was
  lost. **[confirmed]**
- **27 remote-tracking branches** were fetched under `ai-injury-assistant/*`
  (e.g. `124-citation-verification`, `fix/136-chunker-tokenizer-mismatch`,
  `chunk-size-tuning-137`, `next-task`). `gh pr list` on that repo shows **no
  open PRs**, so none of them is awaiting review — but whether any holds
  unmerged work is a question for you, not something I can determine from
  branch names. **[confirmed / open question]**
- The `ai-injury-assistant` git remote is no longer needed for the merge itself.
  Keep it only if that repo will keep receiving independent commits you intend
  to `git subtree pull`; otherwise remove it and archive the source repo so
  there is one source of truth. **[confirmed]**

## 7a. Architecture review post-merge

- **Critical: the two apps' JWTs are incompatible. The D10 integration cannot
  currently work.**
  - `backend/src/utils.js` `createToken` signs `{ userId }`. **[confirmed]**
  - `ai-injury-assistant/src/auth/authenticate.ts` reads `payload.sub`, coerces
    it with `Number()`, and 401s unless it is a positive safe integer.
    **[confirmed]**
  - A real token from `backend/` has no `sub` claim → `Number(undefined)` is
    `NaN` → **every request from a logged-in user gets 401 `invalid_token`**.
  - This is not a docs gap: `ai-injury-assistant/docs/05-api-contract.md` §3
    specifies "a numeric `sub` claim", its `.env.example` shows signing
    `{ sub: 1 }`, and `tests/helpers/auth.ts` mints `{ sub: String(userId) }`.
    The AI side was built and tested against a *spec* of the journal app's
    token, not the token the journal app actually issues. **[confirmed]**
  - Fix is one line on either side, but it is a product decision which:
    change `backend/` to sign `sub` (standard JWT claim, but invalidates every
    live session and touches `authenticate` in `backend/src/middleware.js`), or
    change the AI service to read `userId` (contradicts its own written API
    contract and its test suite). Recommend the latter for now, the former
    later as a deliberate migration.
- **Two databases hold the same journal data with no sync path.** The AI app
  ingests via `prisma.injury.findMany()` against its own DB, which today is
  populated only by its own seed scripts. Nothing copies real user data from
  `backend/`'s database into it. **[confirmed]** So the current end-to-end
  story is: a user logs into `frontend/`, writes journal data to `backend/`'s
  DB, and the AI service answers questions from a *different, unrelated*
  dataset. This is the single biggest thing a newcomer would misread.
- Consequently, the D10 stopgap question is smaller than it looks: the
  temporary read-only `GET /injuries` in the AI service reads *its own* copy,
  so deleting it in favour of `backend`'s endpoint is not a like-for-like swap
  — it only becomes one once the data question above is settled. **Recommend:
  leave the stopgap in place; it is not the real blocker.** The real decision
  is one of: (a) point the AI service's Prisma at `backend`'s database and
  keep only `DocumentChunk` of its own, (b) build a real ingestion sync, or
  (c) merge the two backends outright. (a) is the smallest step that makes the
  product work, given the schemas already match. **[confirmed reasoning,
  inferred recommendation]**
- **No deploy coupling was introduced.** Each app keeps its own package.json,
  build, and (intended) pipeline; there is no root `package.json`, no
  workspaces, no shared build graph, and no cross-app imports. The four remain
  independently deployable. The only shared runtime dependency is the
  `JWT_SECRET` *value*. **[confirmed]**
- No circular references: nothing under `ai-injury-assistant/` imports from
  `backend/` or `frontend/`, and vice versa. **[confirmed]**
- Documentation of how `backend/` and `ai-injury-assistant/` call each other is
  missing from the root and only partly present in the AI app's own docs
  (D10 describes intent, not wiring). Root `CLAUDE.md` §11 (added this
  session, uncommitted) is currently the only place that states the shared-
  secret requirement. **[confirmed]**

## 7b. Security review post-merge

- **No secrets committed.** `ai-injury-assistant/.env.example` holds only empty
  placeholders; the AI CI workflow uses literal *test-only* values
  (`ci-test-only-jwt-secret`, `ci-test-only-embedding-key`) for ephemeral
  services and pulls `GROQ_API_KEY` from repo secrets. **[confirmed]**
- **CORS defaults to permissive**: `app.use(cors({ origin: allowedOrigins ?? true }))`
  — with `ALLOWED_ORIGIN` unset (the documented default), the AI API accepts
  any origin. `backend/` by contrast requires `FRONTEND_URL` in production.
  Inconsistent posture between two apps that will serve the same user.
  **[confirmed]**
- **Shared-secret coupling is now a repo-level security dependency**: the same
  `JWT_SECRET` grants access to both the CRUD API and the AI service. A
  compromise of either app's environment compromises both. Undocumented in
  deploy docs. **[confirmed]**
- Auth approaches differ: `backend/` accepts an httpOnly cookie *or* a Bearer
  header and adds CSRF double-submit for mutations; the AI service is Bearer-
  only with no CSRF (defensible — no cookie auth means no CSRF surface — but
  worth stating deliberately). **[confirmed]**
- Positive: the AI service pins `algorithms: ['HS256']` on verify;
  `backend/src/utils.js` `verifyToken` does **not** pass an `algorithms`
  option. The stricter of the two is the newcomer. Pre-existing issue on
  `backend/`, not introduced by this merge. **[confirmed]**
- The AI service's own `GET /injuries` is scoped to the authenticated
  `userId` per its API contract §5; not independently re-verified in code this
  pass. **[inferred]**
- Rate limiting: the AI service documents two-tier limiting (per-IP 40/60s
  before auth, per-user 20/60s after). `backend/` skips rate limiting entirely
  when `NODE_ENV=test`. Different models, both defensible. **[confirmed]**
- `apps/extractor/` being a stale, diverged duplicate is a security-relevant
  footgun in its own right: it contains a full second copy of workflows and
  handler code that no one is patching. **[confirmed]**

## Actions taken (2026-08-31)

Executed immediately after this report, in the same branch:

- **JWT claim mismatch fixed** (§7a). `src/auth/authenticate.ts` now reads the
  `userId` claim that `backend/` actually issues, falling back to a numeric
  `sub` for hand-minted legacy tokens. Test helpers, unit tests,
  `docs/05-api-contract.md` §3, and `.env.example` updated to match.
- **AI CI is live again** (§4). `ai-injury-assistant/.github/workflows/ci.yml` →
  `.github/workflows/ai-ci.yml`, renamed to "AI Injury Journal CI", with
  `paths:` filters, `defaults.run.working-directory: ai-injury-assistant`, and
  an explicit `cache-dependency-path` (setup-node is a `uses:` step, so the
  working-directory default does not apply to it). All four workflows
  re-validated as parseable with non-overlapping path filters.
- **Port collisions resolved** (§5). AI service default 3000 → 3002; AI
  frontend 3001 → 3003; its `next.config.ts` proxy origin updated to match.
  `tests/port.test.ts` updated.
- **CORS hardened** (§7b). `src/app.ts` now throws at startup if
  `NODE_ENV=production` and `ALLOWED_ORIGIN` is unset, mirroring `backend/`'s
  existing `FRONTEND_URL` rule. Local/dev behavior unchanged.
- **Shared-secret requirement documented** (§5). New "AI Injury Journal
  Variables" section in `docs/14-deployment.md`, plus root `CLAUDE.md` §11.
- **`shadcn` moved to devDependencies** in root `frontend/` (§2), with a
  3-line surgical lockfile edit rather than a full regeneration (a plain
  `npm install` pulled in ~380 lines of unrelated `@tailwindcss/oxide-wasm32-wasi`
  churn). `npm ci --dry-run` validates; `npm run build` passes.
- **`apps/` deleted** (§1). Verified redundant first: all 7 extractor frontend
  components plus `services/extractor-api.ts` already exist in root
  `frontend/`, and `ai-injury-extractor/lambda/handler.py` is 8 lines *newer* than the
  `apps/` copy (adds an `isinstance` guard and Decimal conversion). Recoverable
  from git history if that judgment was wrong.

### Verification

- `ai-injury-assistant`: `npx tsc --noEmit` clean; `npm run lint` clean;
  `tests/authenticate.test.ts` 14/14; `tests/port.test.ts` passes.
- `ai-injury-assistant` DB-backed and rate-limit tests still fail locally — no
  Postgres/pgvector instance here. Confirmed pre-existing by stashing all
  changes and re-running (baseline failed 5, and the failing set varies per
  run from shared rate-limiter state). The CORS suite passes 4/4 in isolation.
- `frontend`: `npm run build` clean (9 routes), `npm ci --dry-run` clean.

### Deliberately NOT actioned — needs your decision

- **Which database the AI service reads** (§7a). Three options with different
  costs; picking wrong breaks both apps. Unresolved, and it is the thing
  standing between this and a working product.
- **`GROQ_API_KEY` repo secret** (§4). Requires the secret value and a GitHub
  settings change — cannot be done from here.
- **The 27 fetched branches / the `ai-injury-assistant` remote** (§6). Only you
  know whether any hold work worth keeping.
- **`.claude/` consolidation** (§3). Six drifted skill pairs; merging them
  means choosing a winner per skill, which is a judgment call per file, not a
  mechanical merge.
- **Folding `ai-injury-assistant/frontend/` into root `frontend/`** (§1).
  Depends on the database decision above landing first.
