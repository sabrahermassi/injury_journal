# End-to-end sweep

A manual, local tool -- not part of `npm test` or CI. It drives a real browser
against the real dev servers, with a real (throwaway) account, and clicks
through the app the way a person would: log in, open every screen, log a
symptom/treatment/visit, check in on a treatment, read the insights it
produces, try the extractor and the assistant.

## Before running

All three services must already be up on their usual ports:

```bash
cd backend && npm run dev              # :3001
cd ai-injury-assistant && npm run dev  # :3002 -- only needed for 50-ai-tools.spec.ts
cd frontend && npm run dev             # :3000
```

## Running

```bash
cd frontend
npx playwright install chromium   # first time only
npm run e2e                       # runs everything
npm run e2e -- e2e/40-dashboard-and-timeline.spec.ts   # just one file
npm run e2e:report                # opens the HTML report for the last run
```

Runs single-worker, strictly in file order (numeric prefixes: `10-`, `20-`,
...). The sweep tests build up state through one shared account across files
-- create an injury in `10-`, log against it in `20-`, read it back in
`30-` -- rather than isolating every test, so running them out of order or in
parallel would race.

## The account

`auth.setup.ts` runs first and always leaves the same fixed test account
(`e2e-sweep@injuryjournal.test`) logged in with a clean slate: if it exists
from a previous run, it deletes it through the real settings-page UI first
(exercising `DELETE /api/auth/me` as a side effect), then registers it fresh.
Never point `TEST_EMAIL` in `fixtures.ts` at a real account.

## Reading a failure

- A red test with `[FINDING]` in its title is not this session's regression --
  read the comment above it; it explains what is broken and why it was left
  failing rather than worked around.
- Anything else red is either a new regression or a selector that drifted from
  the UI -- check the failure screenshot/trace first (`playwright-report/`),
  since a changed label or class name looks identical to a real bug in the
  list reporter's one-line summary.
- `[console.error x3] ...` lines are not failures -- see the comment in
  `fixtures.ts` for why console errors are logged, not asserted on.
