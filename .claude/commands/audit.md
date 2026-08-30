I'm handing you an existing codebase you haven't worked in before. Before making
any code changes, I need a full audit and a CLAUDE.md file. Do NOT fix anything
yet — this is audit-only, followed by filing GitHub issues for me to triage.

## Step 1: Generate CLAUDE.md

Create a CLAUDE.md at the project root covering:

- Project purpose and high-level architecture (in your own words, based on what
  you find — not assumed)
- Directory structure and what each major folder/module is responsible for
- Tech stack, key dependencies, and why they're likely used
- How to run the project locally (dev server, build, tests)
- Testing approach and how to run the test suite
- Any conventions you notice (naming, error handling patterns, file organization)
- Known constraints or gotchas you notice during the audit (fill this in after Step 2)

## Step 2: Full audit (read-only, no changes)

Review the codebase and produce a written report covering:

1. **Architecture** — overall structure, coupling/cohesion issues, any
   inconsistent patterns across similar modules, anything that will make the
   codebase hard to extend or maintain
2. **Bugs** — actual correctness issues you can identify by reading the code
   (not style preferences), including edge cases that look unhandled
3. **Security** — run a real security pass: injection risks, auth/authz gaps,
   secrets or credentials committed to the repo, insecure dependency versions,
   unsafe data handling
4. **Tests** — coverage gaps, untested critical paths, tests that look broken
   or skipped, missing edge case coverage
5. **Documentation** — README or other docs that are stale, incorrect, or
   describe behavior that no longer matches the code
6. **Dependencies** — outdated or vulnerable packages, unused dependencies

For each finding, note: file/location, severity (critical/high/medium/low),
and a one-line description of the problem (not the fix yet).

## Step 3: Update README

Update the README to reflect the current actual state of the project (setup
instructions, features, usage) based on what you learned in the audit. Don't
fix the underlying bugs — just make the README accurate to what exists today.

## Step 4: File GitHub issues — one per finding

For every item in the Step 2 report, open a separate GitHub issue using `gh issue 
create`. Each issue should have:

- Title: short, specific (e.g. "CORS: blank ALLOWED_ORIGIN not validated")
- Body: what the problem is, where it is (file/line), why it matters, and a
  suggested fix approach (but don't implement it)
- Label by category if labels exist in this repo (security / bug / tech-debt /
  docs / tests) — create the labels first if they don't exist
- Severity noted in the body

Do not close, merge, or fix anything after filing. Give me a summary list of
all issues you opened (with links) when done so I can go through them one by one.
