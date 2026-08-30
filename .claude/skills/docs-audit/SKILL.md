# Docs Audit

Audit project documentation against the actual current codebase. Do not modify anything — this is
a report-only command, same discipline as `/self-review`.

This is deliberately named `docs-audit`, not `audit`, to avoid colliding with the pre-existing
`/audit` command in `.claude/commands/audit.md`, which does a full first-time codebase audit +
files GitHub issues. This skill is narrower and invoked separately as `/docs-audit`: it only
checks whether existing docs still match the code, and never files issues on its own.

**Scope, by default:** `CLAUDE.md`, `README.md`, plus every file under `docs/` — list the `docs/`
directory first via a directory listing so nothing is missed. If I name additional or narrower
scope explicitly (e.g. "just CLAUDE.md" or "also check package.json's scripts against what's
documented"), follow that instead.

**For each claim in the audited doc(s), check it against the real code:**

1. **File/function references** — does the named file/function/module still exist, at the path
   stated? Has it moved, been renamed, or been deleted? (e.g. `lambda/handler.py`,
   `frontend/src/lib/api.ts`, specific Terraform resources)
2. **Behavioral claims** — does the code actually do what the doc says? (e.g. "CORS is hardcoded
   to localhost:3000" — grep both `lambda/handler.py` and `infrastructure/api_gateway.tf` to
   confirm both still say that)
3. **Specific facts likely to drift** — model names (`llama-3.1-8b-instant`), table names
   (`InjuryEntries`), endpoint paths (`/extract`, `/injuries`), required env vars
   (`NEXT_PUBLIC_API_URL`, `GROQ_API_KEY`, `DYNAMODB_TABLE`) — verify each directly.
4. **Commands** — do the documented commands actually exist in `frontend/package.json` scripts or
   `lambda/deploy.sh`, and do they do what's claimed?
5. **Cross-references** — do pointers to other docs (e.g. "see `docs/lambda-design.md`") actually
   resolve to a real, current file?
6. **GitHub issues** — for claims like "no tests exist" or "CORS is hardcoded," check whether a
   corresponding GitHub issue already exists and is still open:
   `gh issue list --repo sabrahermassi/ai-injury-extractor --state all --search "<keywords>"`

**Classify every finding into exactly one bucket:**

- **Inaccurate** — actively wrong right now, verified against current code.
- **Stale-risk** — accurate today but likely to drift soon (a specific number/list/status);
  recommend pointing to the actual source of truth (a doc or issue) instead of restating it.
- **Redundant** — states something already fully covered elsewhere.
- **Missing** — something real and currently true that isn't documented but probably should be.
- **Confirmed accurate** — spot-checked, no issue found. List briefly, don't over-explain.

**For each Inaccurate or Stale-risk finding, propose a specific fix** (the exact replacement
text), not just a description of the problem.

Present the full findings report, organized **per file** (one section per doc audited), each with
findings grouped into the 5 buckets. Start with a one-line summary table: file name → count of
Inaccurate / Stale-risk / Redundant / Missing findings.

Do not apply any changes yet.

**Wait for my explicit approval before editing any file.** When I approve, apply only the findings
I select — show the diff before committing.
