import { mkdirSync, writeFileSync } from "node:fs";
import { test as setup, expect } from "@playwright/test";

import { TEST_EMAIL, TEST_PASSWORD } from "./fixtures";

const AUTH_FILE = "e2e/.auth/user.json";
const SESSION_STORAGE_FILE = "e2e/.auth/session-storage.json";

/**
 * Runs once before the sweep. Gets a known-clean account logged in and saves
 * that session, so every sweep test starts already authenticated instead of
 * re-running the login form per test.
 *
 * Done through the real UI (typing into the real forms), not raw API calls,
 * for two reasons: it exercises login and register as real tests in their own
 * right, and it is the only way the app's own JS populates the CSRF token it
 * keeps in sessionStorage after login -- a fetch made outside the page never
 * touches that page's storage.
 *
 * The account is deleted and recreated every run rather than reused, so the
 * sweep always starts from the same empty state and also exercises
 * DELETE /api/auth/me through its own UI on every run.
 */
setup("clean account, then log in", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();

  const onDashboard = page
    .waitForURL("**/dashboard", { timeout: 8_000 })
    .then(() => true)
    .catch(() => false);
  const loginFailed = page
    .getByText(/login failed/i)
    .waitFor({ timeout: 8_000 })
    .then(() => false)
    .catch(() => true);

  const accountExists = await Promise.race([onDashboard, loginFailed]);

  if (accountExists) {
    await page.goto("/dashboard/settings");
    await page.getByRole("button", { name: /delete account/i }).click();
    await page
      .getByLabel(/type.*to confirm/i)
      .fill(TEST_EMAIL);
    await page.getByRole("button", { name: /delete everything/i }).click();
    await page.waitForURL("**/login", { timeout: 8_000 });
  }

  await page.goto("/register");
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel(/^password/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page.getByText(/user created/i)).toBeVisible({ timeout: 8_000 });
  await page.waitForURL("**/login", { timeout: 8_000 });

  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 8_000 });

  await page.context().storageState({ path: AUTH_FILE });

  // storageState never captures sessionStorage (see fixtures.ts for why that
  // matters here). Saved separately and replayed by every sweep test's page
  // fixture, or the CSRF token this login just wrote would be lost the
  // moment this setup test's own page closes, and the very first write any
  // sweep test attempts would 403.
  const sessionStorageSeed = await page.evaluate(() => ({
    csrfToken: window.sessionStorage.getItem("csrfToken"),
    currentUser: window.sessionStorage.getItem("currentUser"),
  }));

  mkdirSync("e2e/.auth", { recursive: true });
  writeFileSync(
    SESSION_STORAGE_FILE,
    JSON.stringify(sessionStorageSeed, null, 2),
  );
});
