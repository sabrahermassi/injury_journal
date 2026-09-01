# Next

Run this workflow to pick up the next prioritized GitHub issue and implement it.

## 1. Select the issue

Run:

`gh issue list --repo sabrahermassi/injury_journal --state open --limit 30 --json number,title,labels`

Do NOT request `body` here. After selecting the issue, fetch only that one:

`gh issue view <number> --repo sabrahermassi/injury_journal --json title,body`

Priority: prefer issues labeled `security`, then `bug`, then `tests`/`tech-debt`, unless I say
otherwise. There is no `P##`/priority-label system in this repo — just labels
(`security`/`bug`/`tech-debt`/`tests`/`documentation`) and severity noted in each issue body
(critical/high/medium/low). Prefer higher severity within a label.

`docs/ROADMAP.md` is background context only. Do not start work on a roadmap item that has no
corresponding GitHub issue — report that instead.

Briefly report:

- issue number, title, severity (from the issue body)
- one-line implementation plan

## 2. Understand the scope

Use the issue title/body and a quick read of directly relevant files
(`ai-injury-extractor/lambda/handler.py`, `frontend/`, `ai-injury-extractor/infrastructure/*.tf`) to determine scope.

Do not spawn a subagent if the scope is clear. Use `.claude/agents/explorer.md` only when the task
is genuinely large or ambiguous (e.g. touches multiple unfamiliar areas, or the issue explicitly
says scope is unclear). Never use a separate planning subagent.

After exploration, create the plan yourself. Wait for my confirmation before editing files.

## 3. Prepare the work

After plan approval:

This repo has no GitHub Projects board and no `status:*` labels — issue status is tracked by
open/closed only. Skip the status-field step from other projects' workflows.

Ask whether I want a new local branch. If yes:

- check `git branch --show-current`
- propose a short kebab-case branch name containing the issue number
- wait for confirmation
- create it from the current branch with `git checkout -b <name>`

Do not push or create a PR yet.

## 4. Implement

Before adding new logic:

- inspect existing implementations and relevant consumers
- reuse existing abstractions where appropriate (see `CLAUDE.md` §5)
- avoid unrelated refactoring
- follow `CLAUDE.md`, especially §7 Safe-Change Rules

Make only changes required for the issue.

## 5. Verify

Run the verification steps from `CLAUDE.md` §9:

- Backend changes: `cd ai-injury-extractor/lambda && pytest` (also run in CI via
  `.github/workflows/extractor-ci.yml`); for anything not covered, read the changed logic carefully
  and exercise it with the `curl` examples in `ai-injury-extractor/README.md` against a deployed stack.
- Frontend changes: `cd frontend && npm run lint && npm run build` (also run in CI via
  `.github/workflows/frontend-ci.yml`), then `npm run dev` and exercise the flow.

Do not invent commands or scripts that don't exist.

## 6. Check test coverage

`ai-injury-extractor/lambda` has a pytest suite; add cases there for backend logic changes where it makes
sense. Before handing off, explicitly note:

- whether this change would be a good candidate for a new test case
- any pre-existing coverage gap in the area touched, and whether it's already tracked

Do not add new test infrastructure (a different framework, a new CI job) without my approval.

## 7. Handoff

Report:

- issue completed
- files changed
- implementation summary
- checks run
- coverage gaps
- any out-of-scope pre-existing issues found

Stop here.

Use `/self-review` for a skeptical review and `/ship` when ready to commit/push/create the PR.

Do not commit, push, create a PR, or trigger external review automation.

If asked to abandon or pause the issue, ask what should happen to the branch rather than guessing.
