Run immediately after completing a `/next` item, before starting another.

Review the completed task's diff/files against:

- `CLAUDE.md`
- `docs/ROADMAP.md`

If the change affects architecture, system boundaries, data flow, infrastructure, the DynamoDB
schema, or the API contract between frontend and Lambda, also review:

- `docs/lambda-design.md`
- `docs/dynamodb-design.md`

Otherwise, do not read those two.

Read any document at most once per session. For large documents, grep for the relevant section and
read only that line range rather than the whole file.

Look only for documentation that is now stale because of the completed work.

Check for:

- resolved or changed implementation gaps (e.g. a "known gotcha" in `CLAUDE.md` that no longer
  applies, or a `docs/ROADMAP.md` item that's now done)
- changed architectural behavior or invariants
- changed commands or entry points
- a GitHub issue that this work closes but that wasn't referenced with `Fixes #N`

Do not edit these files during the review.

Report each proposed change as:

- file/section — current → proposed

If nothing is stale, say so. Do not invent changes.

Wait for my approval before editing.

After approval, make only the approved documentation changes.

Then remind me to run `/clear` before `/next`.

Use `/clear`, not `/compact`, when moving to a new issue. `/compact` keeps a summary and continues
the same session, so context — and the cache-read cost of every later turn — keeps growing across
unrelated work. Reserve `/compact` for continuing the *same* task past a context limit.
