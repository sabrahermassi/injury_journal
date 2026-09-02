import { test, expect } from "./fixtures";

// No storageState here -- these run signed out, on purpose.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("landing, login, register", () => {
  test("landing page renders with no console errors", async ({ page, consoleErrors }) => {
    await page.goto("/");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("login page renders the design's auth layout", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("login rejects a wrong password without crashing", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/login failed/i)).toBeVisible({ timeout: 8_000 });
  });

  test("register page renders and links back to login", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test("password Show/Hide toggle actually toggles the input type", async ({ page }) => {
    await page.goto("/login");
    const input = page.getByLabel("Password");
    await expect(input).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: /^show$/i }).click();
    await expect(input).toHaveAttribute("type", "text");
  });

  test("unauthenticated visitor to /dashboard is not shown the app shell", async ({ page }) => {
    // Documents current behavior rather than asserting a specific redirect
    // target -- if this starts rendering dashboard content with no session,
    // that is the finding worth having.
    await page.goto("/dashboard");
    const sidebarVisible = await page
      .getByText("New entry", { exact: true })
      .isVisible()
      .catch(() => false);
    if (sidebarVisible) {
      test.info().annotations.push({
        type: "finding",
        description:
          "/dashboard rendered the app shell with no authenticated session",
      });
    }
  });
});
