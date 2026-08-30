HISTORICAL COMMAND: this was written and run for one specific past event — the
initial `apps/extractor` subtree merge, before the repo was restructured to its
current top-level `extractor/` + `frontend/` + `backend/` layout (see
`docs/post-merge-analysis.md`, the report it produced, and the restructuring
PR that followed it). The `apps/extractor` / `apps/web` paths below are frozen
to describe that layout as it existed at the time; they no longer match the
current repo. If reusing this command for a future subtree merge (e.g.
`apps/ai-assistant`), update the paths below to match whatever layout exists
at that time first.

Context: I just merged a standalone repo (injury-journal-extractor, a
Lambda-based AI extraction service) into this monorepo via git subtree,
now sitting at apps/extractor. This main app also has apps/web (backend +
frontend) and will eventually include apps/ai-assistant (not yet merged).

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
- Map out what's in apps/extractor (infra, lambda, frontend if any, tests,
  configs) vs. apps/web.
- Identify anything in apps/extractor that should logically move —
  specifically: does it have any frontend/UI code that belongs in
  apps/web/frontend instead of staying with the backend/infra service?
  Flag it, but don't move it yet.
- Propose a final target folder structure as a tree diagram, with a
  one-line reason for each placement decision.

## 2. Duplication check

- Compare package.json / requirements.txt / dependency files across
  apps/web and apps/extractor — list any duplicated dependencies,
  version mismatches, or conflicting dev tooling (linting, formatting,
  test runners).
- Check for duplicated logic or utility code (e.g. shared types, API
  client code, validation logic) that exists in both places and could be
  moved to a shared location (packages/ui or a future packages/shared).
- Check for duplicated or conflicting environment variable names between
  the two apps.
- Check for duplicated or conflicting TypeScript/build configs.

## 3. Markdown/docs consolidation

- Find every .md file in the repo (README.md, CLAUDE.md, any docs/
  folders, etc.) in both apps/web and apps/extractor.
- Keep a separate CLAUDE.md per app (apps/web/CLAUDE.md,
  apps/extractor/CLAUDE.md) — these should stay app-specific with their
  own build/test/architecture notes.
- BUT: identify any workflow-level docs that should be unified at the
  repo root instead of duplicated per-app — specifically anything related
  to git workflow, PR/review process, merge conventions, deployment
  process, or Claude Code "skills"/slash-commands. List what you find in
  each app and propose what should be consolidated into a single root-level
  doc (e.g. root CLAUDE.md or CONTRIBUTING.md) versus what's genuinely
  app-specific and should stay separate.
- Check apps/extractor's .claude/ directory (if it has one) for any
  custom commands/skills and compare against anything similar in apps/web
  — flag duplicates or conflicts, and propose which version should become
  the single shared version if they overlap.

## 4. CI/CD pipeline check

- List every GitHub Actions workflow file (.github/workflows/) that came
  from each original repo.
- Flag any filename collisions.
- Check whether each workflow has correct path-based triggers (paths:
  filters) so that changes to apps/web don't trigger apps/extractor's
  deploy pipeline and vice versa, now that both live in one repo.
- Flag any hardcoded paths, secrets references, or environment names in
  the workflows that assumed the code was still in a standalone repo
  (e.g. references to a repo name, old working directory assumptions).

## 5. Dependency, runtime, and environment consistency

- Compare Node.js (or Python, if applicable) versions each app was built
  for — check .nvmrc, engines fields in package.json, or Lambda runtime
  versions in Terraform/infra configs. Flag any mismatch.
- Check for the same dependency pinned at different major versions across
  apps/web and apps/extractor. Not necessarily a problem if apps deploy
  independently — just list what you find.
- Compare how each app handles secrets/environment variables (.env +
  dotenv vs. AWS Secrets Manager vs. Terraform vars vs. something else).
  Flag inconsistency, but don't standardize yet — just report it.
- Check ESLint/Prettier/.editorconfig in each app — flag whether they
  conflict, and note whether unifying to one root-level config makes
  sense or whether app-specific configs should stay.
- Check each app's test runner and testing conventions (unit vs.
  integration vs. eval-style tests) — flag if apps/web has a different
  pattern than the eval harness style used in apps/extractor.
- Check for local dev server port conflicts if both apps run a local dev
  server (e.g. both defaulting to the same port).

## 6. Git history and release artifacts

- Note that git subtree --squash collapses the extractor's commit history
  into a single commit, and that git tags/releases from the original repo
  do NOT carry over automatically. Confirm whether apps/extractor had any
  version tags or GitHub Releases I should be aware I've lost the direct
  link to (I can still view them on the original GitHub repo separately,
  just flag it so I'm not surprised later). If the original
  injury-journal-extractor remote/repo isn't reachable from here (no
  configured remote, no gh access), say so explicitly rather than
  skipping this check silently — I'll check it manually on GitHub.

## 7a. Architecture review post-merge

- Given the monorepo now contains a main web app and a separate Lambda
  service, review whether there are any structural problems: circular
  references, unclear service boundaries, missing documentation of how
  apps/web is supposed to call apps/extractor's API, or anything that
  looks like it'll cause confusion for someone new to the repo.
- Confirm the merge did NOT introduce any coupling that would force
  apps/web and apps/extractor to deploy together — they should remain
  independently deployable services that simply share a repo. Check
  Terraform state file scoping and CI triggers specifically for this.
- This subsection is the judgment-heavy part of the report (service
  boundaries, coupling, structural risk) — if these findings look
  consequential, re-run just 7a through Opus rather than trusting a
  single Sonnet pass on it.

## 7b. Security review post-merge

- Flag anything security-relevant (e.g. secrets committed in configs,
  overly permissive CORS, inconsistent auth approaches between the two
  apps, IAM roles broader than needed) — don't fix it, just flag it
  clearly for a separate review pass.
- This is checklist/pattern-matching work, not deep judgment — default
  Sonnet high effort is fine here; no need to escalate to Opus. If you
  want a deeper dedicated security pass later, the repo already has a
  `/security-review` skill that can take these flags as a starting point.

## Output format

Write the full report to a file at docs/post-merge-analysis.md, with
clear numbered sections matching above (1–6, 7a, 7b). Under each
section, use short bullet points, not prose.

In chat, do NOT paste the full report. Print only:
- A 1-line status per section (e.g. "1. Structure — ✅ clean" /
  "2. Duplication — ⚠️ 3 issues" / "6. Git history — ❓ 1 open question").
- The single prioritized list of proposed actions — ordered by what
  should happen first — inline in chat (not just in the file), so I can
  approve or push back on individual items without opening the file. Do
  not combine multiple proposed actions into one bullet; each action
  should be independently approvable.
