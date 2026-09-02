import { test, expect } from "./fixtures";

// Runs first against the fresh account auth.setup.ts just created: no
// injuries, no entries. Exercises the empty state and the exact path this
// session's user reported broken -- "New entry" -> "Add a new injury".
test.describe.serial("onboarding: empty account -> first injury", () => {
  test("home shows the empty-account state, not a crash", async ({ page, consoleErrors }) => {
    await page.goto("/dashboard");
    // [FINDING] Not `getByRole("heading", ...)`: CardTitle
    // (components/ui/card.tsx) renders a <div>, not an <h1>-<h6>, so every
    // card title in the app -- this one included -- is invisible to a screen
    // reader's "jump by heading" navigation. Worth fixing in the shared
    // component sometime; not attempted here, since it touches every card in
    // the app at once.
    await expect(page.getByText("Start your record")).toBeVisible();
  });

  test("New entry opens as a modal over a dimmed page", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /^new entry$/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("New entry", { exact: true })).toBeVisible();
    // Nothing to select yet on a fresh account.
    await expect(dialog.getByText("No injury profiles yet")).toBeVisible();
  });

  test('"Add a new injury" opens the create dialog without closing New entry', async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /^new entry$/i }).click();

    // Opens the injury picker to reach "Add a new injury".
    await page.getByRole("button", { name: /no injury profiles yet/i }).click();
    await page.getByRole("button", { name: /add a new injury/i }).click();

    // This is the path that was reported broken: it used to navigate to
    // /dashboard/injuries, which closed the New entry sheet and left the user
    // on a page with no create control at all.
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: /create injury/i })).toBeVisible();
  });

  test("creating an injury there selects it back in New entry", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /^new entry$/i }).click();
    await page.getByRole("button", { name: /no injury profiles yet/i }).click();
    await page.getByRole("button", { name: /add a new injury/i }).click();

    await page.getByLabel("Injury name").fill("Right knee sprain");
    await page.getByLabel("Body area").fill("Knee");
    await page.getByLabel("Start date").fill(
      new Date().toISOString().slice(0, 10),
    );
    await page.getByRole("button", { name: /create injury/i }).click();

    // Back in New entry, with the injury it just made selected -- not by
    // guessing which entry in a re-fetched list is newest (getInjuries has no
    // orderBy), but from the record the create call returned directly.
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Right knee sprain")).toBeVisible({
      timeout: 8_000,
    });

    // Close without saving an entry -- this test is about the injury path.
    await page.getByRole("button", { name: /^close$/i }).click();
    await expect(dialog).not.toBeVisible();
  });

  test("the new injury shows up on the injuries page", async ({ page }) => {
    await page.goto("/dashboard/injuries");
    await expect(page.getByText("Right knee sprain")).toBeVisible();
  });
});
