# Post-Merge Analysis Procedure (archived)

> **ARCHIVED — no longer an invocable command.** Retired 2026-08-31.
>
> This was `.claude/commands/post-merge-analysis.md`. It has been run for both
> subtree merges this repo needed (`ai-injury-extractor`, then
> `ai-injury-assistant`) and there is no third pending, so it no longer earns a
> slot in the active command surface. It is kept here because the seven-step
> procedure is genuinely reusable.
>
> **If another subtree merge happens:** copy this back to
> `.claude/commands/`, and update every path first — it still refers to
> `apps/extractor`, a layout that no longer exists.

---

Reused command: originally written and run for the `apps/extractor` subtree merge
(see `docs/post-merge-analysis.md`, the report it produced, and the restructuring
PR that followed it — that merge used `git subtree --squash` and the repo has
since been restructured to its current top-level `ai-injury-extractor/` + `frontend/` +
`backend/` layout). Now updated for a second subtree merge: `ai-injury-assistant`.
If reusing this command again for a future merge, update the paths and context
below to match whatever layout exists at that time first.

Context: I just merged a standalone repo (injury-journal-ai, an AI/RAG
assistant that answers questions grounded in a user's own journal data) into
this monorepo via git subtree, now sitting at ai-injury-assistant/. Unlike the
extractor merge, this one used a plain `git subtree add` (no `--squash`), so
the other repo's full commit history was preserved and is now interleaved
with this repo's own `git log`. This main repo also has backend/ (Express +
Prisma API), frontend/ (Next.js app), and ai-injury-extractor/ (the previously-merged
Lambda-based AI extraction service).

Do NOT make any changes yet. This is a planning and analysis pass only —
give me a full structured report, then wait for my explicit go-ahead
before executing anything. If you're unsure about something, flag it as
a question rather than guessing.

Model/effort: run sections 1-6 and 7b at default Sonnet, high effort —
they're mechanical (tree diffing, config/dependency comparison,
security checklist). Section 7a (architecture review) is the one part
that requires real judgment (service boundaries, deploy coupling,
circular deps) — if its findings look consequential, re-run just 7a
through Opus rather than trusting a single Sonnet pass on it.

For every claim in the report, mark it as "confirmed" (you read the
actual file/config) or "inferred" (you're guessing from naming/structure
without direct confirmation) — don't present inferred claims as fact.

## 1. Structure analysis

- Explore the full repo tree as it stands now.
- Map out what's in ai-injury-assistant/ (its own backend src/, prisma/,
  frontend/, evaluation/, tests/, docs/, configs) vs. backend/ and frontend/
  at the repo root.
- Identify anything in ai-injury-assistant/ that should logically move —
  specifically: does ai-injury-assistant/frontend/ contain UI code that
  belongs in the root frontend/ instead of staying with its own AI/RAG
  backend? (The extractor merge did exactly this move for its own
  frontend — check whether the same reasoning applies here, and whether
  ai-injury-assistant's own docs already say anything about this, since its
  `docs/02-architecture.md` decision D10 already anticipates the two apps
  merging eventually.) Flag it, but don't move it yet.
- Propose a final target folder structure as a tree diagram, with a
  one-line reason for each placement decision.

## 2. Duplication check

- Compare package.json files across backend/, frontend/, ai-injury-extractor/, and
  ai-injury-assistant/ (and ai-injury-assistant/frontend/) — list any
  duplicated dependencies, version mismatches, or conflicting dev tooling
  (linting, formatting, test runners).
- Check for duplicated logic or utility code (e.g. shared types, API
  client code, validation logic, JWT verification) that exists in more
  than one place and could be moved to a shared location. Pay particular
  attention to auth: ai-injury-assistant verifies JWTs issued by backend/
  and must share its `JWT_SECRET` — check whether the verification logic
  itself is duplicated (reimplemented) rather than shared.
- Check for duplicated or conflicting environment variable names across
  all four apps.
- Check for duplicated or conflicting TypeScript/build configs.

## 3. Markdown/docs consolidation

- Find every .md file in the repo (README.md, CLAUDE.md, any docs/
  folders, etc.) across backend/, frontend/, ai-injury-extractor/, and
  ai-injury-assistant/.
- Keep a separate CLAUDE.md per app (backend/ and frontend/ share the
  root CLAUDE.md; ai-injury-extractor/CLAUDE.md and ai-injury-assistant/CLAUDE.md
  stay separate) — these should stay app-specific with their own
  build/test/architecture notes.
- BUT: identify any workflow-level docs that should be unified at the
  repo root instead of duplicated per-app — specifically anything related
  to git workflow, PR/review process, merge conventions, deployment
  process, or Claude Code "skills"/slash-commands. List what you find in
  each app (ai-injury-extractor/.claude/, ai-injury-assistant/.claude/, and the root
  .claude/) and propose what should be consolidated into a single
  root-level doc (e.g. root CLAUDE.md or CONTRIBUTING.md) versus what's
  genuinely app-specific and should stay separate.
- Check ai-injury-assistant's .claude/ directory for any custom
  commands/skills and compare against extractor's and the root's — flag
  duplicates or conflicts, and propose which version should become the
  single shared version if they overlap.

## 4. CI/CD pipeline check

- List every GitHub Actions workflow file (.github/workflows/) that came
  from ai-injury-assistant, and compare against what already exists at the
  repo root (test.yml, extractor-ci.yml, frontend-ci.yml, dependabot.yml).
- Flag any filename collisions.
- Check whether each workflow has correct path-based triggers (paths:
  filters) so that changes to ai-injury-assistant don't trigger backend's,
  frontend's, or extractor's pipelines and vice versa, now that all four
  live in one repo.
- Flag any hardcoded paths, secrets references, or environment names in
  the workflows that assumed the code was still in a standalone repo
  (e.g. references to the injury-journal-ai repo name, old working
  directory assumptions).

## 5. Dependency, runtime, and environment consistency

- Compare Node.js versions each app was built for — check .nvmrc,
  engines fields in package.json, or any Python version pinning (the
  embedding service is a separate self-hosted Python/FastAPI process per
  ai-injury-assistant's docs — confirm whether that service's source lives
  inside ai-injury-assistant or is genuinely external/undeployed here).
  Flag any mismatch against backend/frontend/extractor.
- Check for the same dependency pinned at different major versions across
  the four apps (e.g. Prisma, Express, Zod all appear in both backend/
  and ai-injury-assistant/ — compare versions specifically). Not
  necessarily a problem if apps deploy independently — just list what
  you find.
- Compare how each app handles secrets/environment variables (.env +
  dotenv vs. something else). Flag inconsistency, but don't standardize
  yet — just report it. Specifically confirm: does ai-injury-assistant
  expect the exact same `JWT_SECRET` value as backend/, and is that
  documented anywhere a future deploy would actually see it?
- Check ESLint/Prettier/tsconfig in each app — flag whether they
  conflict, and note whether unifying to one root-level config makes
  sense or whether app-specific configs should stay (ai-injury-assistant
  brought its own eslint.config.js, tsconfig.json, .prettierrc — was
  told to leave these self-contained for now, so just report, don't
  propose unifying them yet).
- Check each app's test runner and testing conventions (unit vs.
  integration vs. eval-style tests) — flag if ai-injury-assistant's pattern
  (it has its own evaluation/ai-system harness) differs from backend's
  Jest+Supertest convention or extractor's eval harness style.
- Check for local dev server port conflicts if multiple apps run a local
  dev server (backend defaults to 3001, frontend to 3000 — check what
  ai-injury-assistant's backend and its own frontend default to).

## 6. Git history and release artifacts

- This merge used a plain `git subtree add` without `--squash`, so
  ai-injury-assistant's full commit history should be present and
  interleaved into this repo's `git log` (unlike the extractor merge,
  which squashed). Confirm this is actually true (`git log --oneline -- 
  ai-injury-assistant/` should show more than one commit, with original
  authorship preserved) rather than assuming it worked as intended.
- Confirm whether ai-injury-assistant had any version tags or GitHub
  Releases I should be aware I've lost the direct link to (tags do NOT
  carry over via subtree regardless of --squash) — I can still view them
  on the original GitHub repo (sabrahermassi/injury-journal-ai)
  separately, just flag it so I'm not surprised later.
- ai-injury-assistant's own repo has a large number of other branches
  (feature/fix branches, eval-tuning branches, etc.) that were fetched
  as remote-tracking refs (`ai-injury-assistant/*`) but not merged. Confirm
  whether any of those represent in-progress work I should be aware of
  before considering the migration "done," and whether the `ai-injury-assistant`
  git remote should be removed now that the subtree add is complete (it's
  no longer needed for the merge itself, only for pulling future upstream
  changes if that repo is still being developed independently).

## 7a. Architecture review post-merge

- Given the monorepo now contains a CRUD/auth web app (backend/ +
  frontend/), a Lambda-based extraction service (ai-injury-extractor/), and a
  full AI/RAG service with its own database (ai-injury-assistant/), review
  whether there are any structural problems: circular references, unclear
  service boundaries, missing documentation of how backend/ and
  ai-injury-assistant/ are supposed to call each other, or anything that
  looks like it'll cause confusion for someone new to the repo.
- ai-injury-assistant's own docs (docs/02-architecture.md, decision D10)
  already state it does not own Injury CRUD or auth, verifies JWTs issued
  by backend/, and has one deliberate temporary exception (a minimal
  read-only GET /injuries in its own backend, tracked for deletion once
  the two apps "genuinely merge" per its issue #195). Now that they
  physically share a repo, assess whether that stopgap should be revisited
  as part of this merge, or whether it's still legitimately needed because
  the two backends remain separately deployed services. Don't act on this
  — just give a clear recommendation.
- Confirm the merge did NOT introduce any coupling that would force
  backend/, frontend/, ai-injury-extractor/, and ai-injury-assistant/ to deploy
  together — they should remain independently deployable services that
  simply share a repo. Check CI triggers and any shared infra config
  specifically for this.
- This subsection is the judgment-heavy part of the report (service
  boundaries, coupling, structural risk) — if these findings look
  consequential, re-run just 7a through Opus rather than trusting a
  single Sonnet pass on it.

## 7b. Security review post-merge

- Flag anything security-relevant (e.g. secrets committed in configs,
  overly permissive CORS, inconsistent auth approaches between backend/
  and ai-injury-assistant/, the shared-JWT_SECRET coupling itself as a
  security dependency worth documenting, the read-only GET /injuries
  stopgap endpoint's scoping) — don't fix it, just flag it clearly for a
  separate review pass.
- This is checklist/pattern-matching work, not deep judgment — default
  Sonnet high effort is fine here; no need to escalate to Opus. If you
  want a deeper dedicated security pass later, the repo already has a
  `/security-review` skill that can take these flags as a starting point.

## Output format

Write the full report to a file at docs/post-merge-analysis.md, with
clear numbered sections matching above (1–6, 7a, 7b). Under each
section, use short bullet points, not prose. If docs/post-merge-analysis.md
already contains the extractor merge's report, append this merge's
report as a new top-level section (e.g. "# ai-injury-assistant merge")
rather than overwriting the existing one — both are historical records
of separate merge events.

In chat, do NOT paste the full report. Print only:
- A 1-line status per section (e.g. "1. Structure — ✅ clean" /
  "2. Duplication — ⚠️ 3 issues" / "6. Git history — ❓ 1 open question").
- The single prioritized list of proposed actions — ordered by what
  should happen first — inline in chat (not just in the file), so I can
  approve or push back on individual items without opening the file. Do
  not combine multiple proposed actions into one bullet; each action
  should be independently approvable.
