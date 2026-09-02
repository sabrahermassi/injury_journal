import { test, expect, expectNoBrokenImage } from "./fixtures";

test.describe("home, timeline, injuries -- rendering and known gaps", () => {
  test("home renders the pain chart and every art icon actually loads", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /good (morning|afternoon|evening)/i })).toBeVisible();
    await expect(page.getByText("How you've been feeling")).toBeVisible();
    await expect(page.locator("svg[role='img']")).toBeVisible();

    await expectNoBrokenImage(page);
  });

  test("Today card logs a pain check-in with one tap", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /log today's pain as 5 out of 10/i }).click();
    await expect(page.getByText("5.0")).toBeVisible({ timeout: 8_000 });
  });

  // Not a regression from this session, and left as a genuinely failing test
  // rather than xfail'd or skipped, so it stays visible instead of going
  // quiet: createSymptom, createTreatment and createMedicalVisit only ever
  // write to their own tables. Recent activity reads GET /api/events
  // (TimelineEvent), which nothing writes to except the AI extractor's
  // "accept" path. Every symptom, treatment and visit logged in
  // 20-logging.spec.ts is real and visible on the injury detail page, but
  // invisible here and on the Timeline page below -- the empty-state CTAs on
  // both promise otherwise ("Log the first entry" / "Log your first entry").
  test("[FINDING] Home's Recent activity does not show entries logged through New entry", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Physiotherapy")).toBeVisible();
  });

  test("timeline page renders its four filters and icons load", async ({ page }) => {
    await page.goto("/dashboard/timeline");
    await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();

    for (const label of ["All", "Symptoms", "Treatments", "Visits"]) {
      await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
    }

    await expectNoBrokenImage(page);
  });

  // Same gap as Home's Recent activity, same reasoning for leaving it red.
  test("[FINDING] Timeline page is empty despite everything logged in 20-logging.spec.ts", async ({
    page,
  }) => {
    await page.goto("/dashboard/timeline");
    await expect(page.getByText("Physiotherapy")).toBeVisible();
  });

  test("injuries list and injury detail page render without a crash", async ({
    page,
  }) => {
    await page.goto("/dashboard/injuries");
    await expect(page.getByText("Right knee sprain")).toBeVisible();

    await page.getByRole("link", { name: /right knee sprain/i }).click();
    await expect(page.getByRole("heading", { name: "Right knee sprain" })).toBeVisible();
    await expect(page.getByText("Physiotherapy")).toBeVisible();
    await expect(page.getByText("Dr. Okafor")).toBeVisible();

    await expectNoBrokenImage(page);
  });
});
