Run immediately after completing a /next item, before starting another.

Review the completed task's diff/files against:

- CLAUDE.md
- ROADMAP.md

If the change affects architecture, system boundaries, data flow, database design, the API
contract, or another documented architectural decision, also review the relevant file(s) in
`docs/` — most likely `docs/03-system design.md`, `docs/04-database.md`, or `docs/05-api.md`.

Otherwise, do not read those documents.

Read any document at most once per session. For large documents, grep for the relevant section and read
only that line range rather than the whole file.

Look only for documentation that is now stale because of the completed work.

Check for:

- resolved or changed implementation gaps
- changed architectural behavior or invariants (e.g. the ownership-check pattern, auth flow, CORS/rate-limit config)
- changed commands or entry points
- `ROADMAP.md` checklist items that are now complete, in progress, or superseded
- `CLAUDE.md` §8 (Known constraints / gotchas) items that this change resolved

Do not edit these files during the review.

Report each proposed change as:

- file/section — current → proposed

If nothing is stale, say so. Do not invent changes.

Wait for my approval before editing.

After approval, make only the approved documentation changes.

Then remind me to run /clear before /next.

Use `/clear`, not `/compact`, when moving to a new issue. `/compact` keeps a summary and continues the
same session, so context - and the cache-read cost of every later turn - keeps growing across unrelated
work. Reserve `/compact` for continuing the *same* task past a context limit.
