# Post-Merge Analysis: `apps/extractor` subtree merge

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
    └── extractor/         Newly merged Lambda AI-extraction service
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
│   │                     apps/extractor → extractor/ instead — pick ONE
│   │                     convention repo-wide (see action list)
│   └── extractor/      (unchanged internal layout — already coherent)
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
