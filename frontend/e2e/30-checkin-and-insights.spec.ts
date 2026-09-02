import { test, expect } from "./fixtures";

test.describe.serial("treatment check-in feeds Insights", () => {
  test("records a check-in on the Physiotherapy logged earlier", async ({ page }) => {
    await page.goto("/dashboard/injuries");
    await page.getByRole("link", { name: /right knee sprain/i }).click();

    await page.getByRole("button", { name: /how's it going/i }).click();
    await page.getByRole("button", { name: /record a check-in/i }).click();
    await page.getByRole("button", { name: "Still helping" }).click();
    await page.getByLabel(/pain now/i).fill("4");
    await page.getByLabel(/relief lasted/i).fill("5");
    await page.getByRole("button", { name: /save check-in/i }).click();

    await expect(page.getByText("Still helping")).toBeVisible({ timeout: 8_000 });
  });

  test("insights renders real stats and the What helped row with no crash", async ({
    page,
    consoleErrors,
  }) => {
    await page.goto("/dashboard/insights");

    await expect(page.getByRole("heading", { name: "Insights" })).toBeVisible();

    // Three stat cards -- days tracked, check-ins logged, average pain -- each
    // a real serif number, never left blank or "NaN".
    const stats = page.locator("p.font-serif.text-\\[46px\\]");
    await expect(stats).toHaveCount(3);
    for (const value of await stats.allTextContents()) {
      expect(value.trim().length, `stat rendered empty: "${value}"`).toBeGreaterThan(0);
      expect(value).not.toMatch(/nan/i);
    }

    // "What helped": the Physiotherapy row, with its change figure and its
    // relief-duration line -- both computed from the check-in just recorded,
    // not placeholder text.
    await expect(page.getByText("Physiotherapy")).toBeVisible();
    await expect(page.getByText(/relief held 5 days/i)).toBeVisible();
  });
});
