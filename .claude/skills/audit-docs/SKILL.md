Audit project documentation against the actual current codebase. Do not modify anything — this is a report-only command, same discipline as self-review.

**Scope, by default:** `CLAUDE.md`, `README.md`, `ROADMAP.md`, `frontend/UI_GUIDE.md`, plus every file under `docs/` (list the `docs/` directory first via a directory listing so nothing is missed — don't assume the current set matches what existed last time this was run). If I name additional or narrower scope explicitly (e.g. "just CLAUDE.md" or "also check package.json's scripts against what's documented"), follow that instead.

**For each claim in the audited doc(s), check it against the real code:**

1. **File/function references** — does the named file/function/module still exist, at the path stated? Has it moved, been renamed, or been deleted?
2. **Behavioral claims** — does the code actually do what the doc says it does? (e.g. "rate limiting is skipped in test env" — grep `backend/src/app.js`/`backend/src/routes.js` to confirm or refute)
3. **Specific facts likely to drift** — endpoint lists, test counts, "currently X of Y resources covered," specific parameter lists, specific commands — verify each one directly rather than trusting it.
4. **Commands** — do the documented commands actually exist in `backend/package.json`/`frontend/package.json` scripts, and do they do what's claimed?
5. **Cross-references** — do pointers to other docs/files (e.g. "see docs/05-api.md") actually resolve to a real, current file?

**Classify every finding into exactly one bucket:**

- **Inaccurate** — actively wrong right now, verified against current code. Following it as written would produce a wrong outcome.
- **Stale-risk** — accurate today, but is a specific fact (endpoint list, count, status) likely to drift soon; recommend replacing with a pointer to the actual source of truth (e.g. `backend/src/routes.js`) rather than restating it.
- **Redundant** — states something already fully covered elsewhere (another doc, or trivially inferable from reading the code/file structure) with no added value from restating it here.
- **Missing** — something real and currently true that isn't documented but probably should be (a note, not a demand — only include genuinely useful additions, not padding).
- **Confirmed accurate** — spot-checked, no issue found. List briefly, don't over-explain.

**For each Inaccurate or Stale-risk finding, propose a specific fix** (the exact replacement text), not just a description of the problem.

Present the full findings report, organized **per file** (one clearly-labeled section per doc audited), each with its own findings grouped into the 5 buckets above. Start the whole report with a one-line summary table: file name → count of Inaccurate / Stale-risk / Redundant / Missing findings, so I can see at a glance which files need real attention versus which came back clean. Do not apply any changes yet.

**Wait for my explicit approval before editing any file.** When I approve, apply only the findings I select — show the diff before committing, same as every other workflow in this project.
