import { test, expect, TEST_EMAIL, expectNoBrokenImage } from "./fixtures";

// Deliberately does not click Sign out or Delete account: the account is torn
// down by auth.setup.ts at the start of the *next* run, and this file should
// leave the session intact for whatever runs after it in this one.
test("settings page shows the signed-in account and renders cleanly", async ({
  page,
}) => {
  await page.goto("/dashboard/settings");

  await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
  // The email appears three times (sidebar footer, the account header, and
  // the Email row) -- any one of them confirms identity resolved.
  await expect(page.getByText(TEST_EMAIL).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /delete account/i })).toBeVisible();

  await expectNoBrokenImage(page);
});
