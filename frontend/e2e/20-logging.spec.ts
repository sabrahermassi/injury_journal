import { test, expect } from "./fixtures";

/**
 * Logs one of each entry kind through the New entry modal against the
 * injury 10-onboarding.spec.ts created, including the staged batch-save path,
 * then confirms each landed on the injury detail page's own card for that
 * resource (Symptoms / Treatments / Visits).
 *
 * Deliberately NOT asserted here: that these show up on Home's "Recent
 * activity" or on the Timeline page. Both read TimelineEvent rows, and
 * nothing in this modal -- or the older full-page log form it replaced --
 * ever wrote one. See 40-dashboard-home.spec.ts and 50-timeline.spec.ts,
 * where that gap is asserted explicitly and reported as a finding rather than
 * silently worked around here.
 */
test.describe.serial("logging entries through New entry", () => {
  test("go to the injury created in onboarding", async ({ page }) => {
    await page.goto("/dashboard/injuries");
    await page.getByRole("link", { name: /right knee sprain/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/injuries\/\d+$/);
  });

  test("logs a single symptom", async ({ page }) => {
    await page.goto("/dashboard/injuries");
    await page.getByRole("link", { name: /right knee sprain/i }).click();

    await page.getByRole("button", { name: /log symptom/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: /pain 6 out of 10/i }).click();
    await dialog.getByRole("button", { name: /^save entry$/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 8_000 });

    await expect(page.getByText("No symptoms recorded yet")).not.toBeVisible();
    await expect(page.getByText("6", { exact: true }).first()).toBeVisible();
  });

  test("stages a treatment, then adds a visit and saves both together", async ({
    page,
  }) => {
    await page.goto("/dashboard/injuries");
    await page.getByRole("link", { name: /right knee sprain/i }).click();

    await page.getByRole("button", { name: /log treatment/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Treatment" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await dialog.getByLabel("Treatment", { exact: true }).fill("Physiotherapy");
    await dialog.getByRole("button", { name: /add another/i }).click();
    await expect(dialog.getByText("Ready to save")).toBeVisible();
    await expect(dialog.getByText(/^Physiotherapy/)).toBeVisible();

    await dialog.getByRole("button", { name: "Visit" }).click();
    await dialog.getByLabel(/who did you see/i).fill("Dr. Okafor");

    await dialog.getByRole("button", { name: /save 2 entries/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 8_000 });

    await expect(page.getByText("Physiotherapy")).toBeVisible();
    await expect(page.getByText("Dr. Okafor")).toBeVisible();
  });

  test("a failed save keeps the unsaved entries staged, not silently dropped", async ({
    page,
  }) => {
    // Forces the create call to fail so the partial-failure path actually
    // runs, rather than trusting it works because it reads correctly.
    await page.route("**/api/injuries/*/symptoms", (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({ status: 500, body: "{}" });
      }
      return route.continue();
    });

    await page.goto("/dashboard/injuries");
    await page.getByRole("link", { name: /right knee sprain/i }).click();

    await page.getByRole("button", { name: /log symptom/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /pain 3 out of 10/i }).click();
    await dialog.getByRole("button", { name: /^save entry$/i }).click();

    await expect(dialog.getByText(/couldn't save that/i)).toBeVisible({
      timeout: 8_000,
    });
    // Still open, still holding the entry -- not silently discarded.
    await expect(dialog).toBeVisible();

    await page.unroute("**/api/injuries/*/symptoms");
  });
});
