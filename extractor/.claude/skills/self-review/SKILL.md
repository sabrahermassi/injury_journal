# Skeptical Self-Review

Perform a fresh, skeptical review of the current diff, branch changes, or specified PR.

Assume the code was written by someone else. Do not assume the implementation is correct because
you or another agent wrote it.

Do not modify files, commit, push, comment, resolve review threads, or trigger external review
tools.

## Review

First inspect:

- the complete diff against `main`
- the files in the diff, plus one hop of direct callers/consumers — do not survey the whole repo
- documentation relevant to the changed area (`extractor/docs/lambda-design.md` for Lambda/API
  changes, `extractor/docs/dynamodb-design.md` for storage changes) — skip unrelated docs
- existing GitHub issues when a pre-existing problem is relevant:
  `gh issue list --repo sabrahermassi/injury_journal --state all --search "<keywords>"`

Do NOT read `CLAUDE.md` — it's already in context. Read any document at most once per session.

Review for:

- correctness, edge cases, and error handling
- failure/retry behavior (especially around the Groq API call and DynamoDB writes)
- security and data isolation — this repo currently has no auth; flag anything that makes that
  worse without at least noting it, per `CLAUDE.md` §7
- API contract consistency between `extractor/lambda/handler.py` and
  `frontend/services/extractor-api.ts` / `frontend/lib/injury-schema.ts`
- production and performance risks
- regressions and unintended side effects

### Maintainability and Design

When relevant to the changed area, also check:

- unclear or misleading naming
- dead or unused code and imports
- duplicated abstractions (e.g. the `Field`/`BadgeList` pattern already duplicated between
  `extraction-result.tsx` and `injury-history-card.tsx` — don't add a third copy)
- unnecessary complexity or coupling
- whether another engineer could understand the important "why"

Do not recommend splitting or refactoring code merely because it could be structured differently.
Only flag maintainability concerns that create a meaningful problem.

For each concern, determine whether it is:

1. introduced by this change
2. pre-existing but relevant
3. unrelated/pre-existing
4. not actually a problem

Do not blame the change for unrelated pre-existing issues. If a relevant pre-existing issue is
found, check whether it's already tracked before suggesting a new one.

## Findings

Classify every finding as exactly one of:

- **Clearly Correct** — implementation is solid; briefly explain why.
- **Judgment Call** — genuine concern or tradeoff; explain the evidence and recommend an action
  without making the change.
- **Disagree** — apparent problem is not actually a problem or is unrelated/pre-existing; explain
  why.
- **Nitpick** — minor, non-blocking improvement.

For Judgment Call and Nitpick, assign:

- HIGH — could cause data loss, security issues, incorrect behavior, or major regression
- MEDIUM — meaningful correctness, reliability, or maintainability concern
- LOW — minor improvement or low-probability issue

Do not assign severity to Clearly Correct or Disagree findings.

For every Judgment Call provide:

- Location
- Finding
- Why it matters
- Concrete scenario
- Recommendation

For every pre-existing but relevant concern, state whether it's already tracked by an existing
GitHub issue.

## Review Discipline

Be skeptical but evidence-based. Do not manufacture hypothetical problems simply to produce
findings. Do not recommend changes merely because another implementation is possible. Prefer the
simplest explanation supported by the actual code. Do not treat `docs/*.md` as proof that
something is implemented — verify against source.

## Output

Start with:

### Review Summary

- Change/PR reviewed
- Base branch (`main`)
- Overall assessment
- Finding counts by category

Then provide the findings.

For each Judgment Call or Nitpick use:

**[Category] — [Severity] — [short title]**

- Location:
- Finding:
- Why it matters:
- Concrete scenario:
- Recommendation:

For Clearly Correct findings, keep them brief. For Disagree findings, explain the evidence and
whether the issue is already tracked.

Finish with:

### Bottom Line

State whether the change is:

- ready to merge
- ready with minor changes
- requires changes before merge

Do not fix anything. Wait for direction before taking any action.
