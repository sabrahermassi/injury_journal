import { test, expect } from "./fixtures";

test.describe("AI extractor and assistant", () => {
  test("extractor page renders and fails gracefully with no analyzer configured", async ({
    page,
  }) => {
    // frontend/.env.local has no NEXT_PUBLIC_EXTRACTOR_API_URL on this
    // machine (PR #76, which wires the backend proxy, is still open). This
    // asserts the app degrades to a message rather than a white screen or an
    // uncaught exception -- see extractor-api.ts, which throws synchronously
    // when the env var is missing.
    await page.goto("/dashboard/extractor");
    await expect(page.getByRole("heading", { name: "AI Injury Extractor" })).toBeVisible();

    await page.getByLabel(/paste the note/i).fill(
      "Sharp pain in the right knee after running, worse going downstairs.",
    );
    await page.getByRole("button", { name: /analyze injury/i }).click();

    // Whatever the message says, it must be a message, not a crash -- the
    // fixture's pageerror listener fails this test on an uncaught exception
    // regardless of what is asserted here.
    await expect(
      page.getByText(/not configured|failed|error|try again/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("assistant page answers or fails without crashing", async ({ page }) => {
    // Best-effort: needs the AI assistant service (:3002) up and a working
    // GROQ_API_KEY, neither of which this test controls. The only hard
    // requirement is what the fixture already enforces -- no uncaught
    // exception -- so a real answer and a clean error message both count as
    // this test passing; only a broken page does not.
    await page.goto("/dashboard/assistant");
    await expect(page.getByRole("heading", { name: "AI Assistant" })).toBeVisible();

    await page.getByLabel(/your question/i).fill("What treatments have I tried?");
    await page.getByRole("button", { name: /^ask$/i }).click();

    const answered = page
      .locator("p.whitespace-pre-wrap")
      .waitFor({ timeout: 20_000 })
      .then(() => "answered" as const);
    const errored = page
      .locator("p.text-destructive")
      .waitFor({ timeout: 20_000 })
      .then(() => "errored" as const);

    const outcome = await Promise.race([answered, errored]).catch(() => "neither");
    test.info().annotations.push({ type: "assistant-outcome", description: outcome });
    expect(outcome, "assistant showed neither an answer nor an error message").not.toBe(
      "neither",
    );
  });
});
