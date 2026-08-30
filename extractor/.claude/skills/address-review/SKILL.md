# Address Review Feedback on the Current PR

Run this workflow to pick up and address review feedback (CodeRabbit and/or human) on an open PR
in this repository.

This repo is a single-developer project with a simple branch-per-feature workflow (no stacked
PRs, no concurrent sessions to protect against). This workflow works directly on the PR's branch —
it does not require a separate git worktree.

---

## Safety and Permission Rules

Read-only repository and GitHub inspection may proceed without approval.

The following actions ALWAYS require explicit approval immediately before they happen:

- modifying source or project files
- committing changes
- pushing to a remote
- posting GitHub comments
- replying to review comments
- resolving GitHub review threads
- triggering external review automation such as CodeRabbit

NEVER:

- run `git reset --hard`
- run `git clean`
- discard uncommitted work
- automatically stash changes
- force-push with `--force` or `--force-with-lease`
- delete branches
- blindly run `git add .` or `git add -A`
- modify `.env`, credentials, secrets, or unrelated generated files
- create a new PR for this workflow

If anything appears ambiguous, destructive, or unexpected, STOP and ask.

---

## Step 1 — Identify the PR

List open PRs:

    gh pr list --repo sabrahermassi/injury_journal --json number,title,headRefName

If more than one is open, ask which one to address. If exactly one, use it.

Inspect it:

    gh pr view <number> --repo sabrahermassi/injury_journal --json reviews,comments
    gh api repos/sabrahermassi/injury_journal/pulls/<number>/comments

Check both CodeRabbit review comments and any human comments. Do not assume previously observed
feedback is still current — refresh it.

Verify:

- the PR is still open
- the head branch still exists locally or can be checked out

Tell me:

- PR number and title
- one-line summary of the unresolved feedback

---

## Step 2 — Check Out the Branch

    git status --short
    git branch --show-current

If the working directory has uncommitted changes that are NOT part of this PR, STOP and ask before
switching branches — do not stash or discard them automatically.

If the PR branch isn't checked out locally:

    git fetch origin <branch>
    git checkout <branch>

---

## Step 3 — Triage Every Review Comment

For every comment (CodeRabbit + human), classify it as one of:

**Clearly Correct / Low Risk** — a genuine bug or straightforward improvement, no real tradeoff.

**Valid but a Judgment Call** — a legitimate concern involving a real design tradeoff, API
contract, data model, or scope decision.

**Disagree / False Positive** — the comment is incorrect, misunderstands the code, or conflicts
with an intentional decision (e.g. CodeRabbit re-flagging something already tracked as a known,
documented dev-only limitation — check `docs/lambda-design.md` / `docs/ROADMAP.md` and open
GitHub issues before disagreeing).

**Nitpick / Out of Scope** — possibly valid but unrelated to this PR's purpose. Check whether it's
already a tracked GitHub issue before proposing new follow-up work.

For every comment record:

- reviewer
- file/location
- classification
- recommended action
- short reasoning

Present the complete triage before making any changes.

**STOP and wait for approval before modifying any files.** A comment marked "Clearly Correct" does
NOT by itself authorize a code change.

---

## Step 4 — Implement Approved Changes

After approval, implement only the approved fixes.

Before modifying a file:

- inspect the current implementation
- check `CLAUDE.md` for relevant conventions/gotchas
- avoid unrelated refactoring

If a fix would require any of the following, STOP and ask first:

- DynamoDB schema/key changes
- API Gateway resource/route changes
- breaking changes to the frontend/backend contract
- new infrastructure

---

## Step 5 — Verify

There is no automated test suite in this repo yet (see `docs/ROADMAP.md` and issue #19). Verify
manually:

- for backend changes: exercise the relevant `curl` example from the README against a deployed
  stack, or at minimum read through the changed logic for correctness
- for frontend changes: run `npm run dev` in `frontend/` and exercise the affected flow in the
  browser
- run `npm run lint` in `frontend/` for any frontend change

Then:

    git status
    git diff

Confirm only intended files changed, no secrets, no unrelated changes.

Do not commit yet.

---

## Step 6 — Review Before Commit

Report:

- files changed
- which review comments were addressed
- checks run and results
- anything deliberately left unchanged and why

Show the proposed commit message.

**STOP and wait for explicit approval to commit.**

---

## Step 7 — Commit and Push

    git add <specific files>
    git diff --cached
    git commit -m "<message describing what review feedback was addressed>"

**STOP and wait for explicit approval before pushing.**

    git push

NEVER force-push.

---

## Step 8 — Respond to Review Feedback

For each addressed comment, prepare a short reply summarizing what changed and why. For comments
deliberately left unchanged, explain why (valid-but-out-of-scope → note if a GitHub issue should
track it; disagree → explain the reasoning).

**STOP and wait for approval before posting any GitHub replies or resolving threads.**

After approval, reply to the relevant threads and resolve them where the reviewer's actual concern
was addressed — do not resolve a thread just because *some* code changed nearby.

---

## Final Report

- PR addressed
- comments fixed / left unchanged (with reasoning) / flagged as separate issues
- files changed
- checks run
- commit hash, push status
- review-response status
