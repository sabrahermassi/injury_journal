import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test as base, expect, type Page } from "@playwright/test";

const SESSION_STORAGE_FILE = path.join(
  __dirname,
  ".auth",
  "session-storage.json",
);

/**
 * Collects console errors and uncaught exceptions for the duration of a test.
 *
 * A `pageerror` (an uncaught exception in the page's own JS) fails the test
 * outright -- that is always a real bug, a white screen or a broken
 * interaction, never noise. A `console.error` does not fail the test on its
 * own: this app deliberately logs expected failures (a network error, a
 * missing env var) with `console.error(err)` before showing a friendly
 * message, so treating every one as fatal would fail on working error
 * handling. Instead they are collected and printed, so a genuine bug hiding
 * among expected logs is still visible in the report rather than lost.
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  // `context.storageState()` captures cookies and localStorage, never
  // sessionStorage -- that omission is deliberate upstream (sessionStorage is
  // meant to be tab-lifetime, storageState is meant to survive a process
  // restart) but it collides with a real bug this sweep found: this app
  // keeps the signed-in user's identity AND its CSRF token in sessionStorage
  // alone, written once at login and nowhere else. A restored session (this
  // fixture, but equally a real reopened tab) has a perfectly valid auth
  // cookie -- reads work, the dashboard renders fully signed in -- but no
  // sessionStorage, so every mutating request's X-CSRF-Token header is
  // missing and backend/src/middleware.js's verifyCsrf 403s it. Without this
  // fixture every write in the sweep would 403, which is exactly how the
  // bug was first found here.
  //
  // This re-seeds sessionStorage from what auth.setup.ts captured right
  // after its own interactive login, via an init script so it lands before
  // the app's first render. It is a workaround for the test tool, not a fix
  // for the app -- a real user's reopened tab gets no such help.
  page: async ({ page }, use) => {
    if (existsSync(SESSION_STORAGE_FILE)) {
      const raw = JSON.parse(readFileSync(SESSION_STORAGE_FILE, "utf-8")) as Record<
        string,
        string | null
      >;
      const seed = Object.fromEntries(
        Object.entries(raw).filter(
          (entry): entry is [string, string] => entry[1] !== null,
        ),
      );
      await page.addInitScript((entries) => {
        for (const [key, value] of Object.entries(entries)) {
          window.sessionStorage.setItem(key, value);
        }
      }, seed);
    }

    await use(page);
  },

  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    await use(errors);

    if (pageErrors.length > 0) {
      throw new Error(
        `Uncaught exception in the page:\n${pageErrors.join("\n")}`,
      );
    }

    if (errors.length > 0) {
      console.log(
        `  [console.error x${errors.length}] ${errors.slice(0, 5).join(" | ")}`,
      );
    }
  },
});

export { expect };

export const TEST_EMAIL = "e2e-sweep@injuryjournal.test";
export const TEST_PASSWORD = "E2eSweep!2026";

export async function expectNoBrokenImage(page: Page, alt = "") {
  // next/image renders a real <img>; a 404'd source still renders the tag
  // with 0 natural size, which naturalWidth/Height catches and a screenshot
  // alone would not -- a broken icon and a correctly-loaded one look
  // identical in a screenshot taken before the network settles, but only one
  // of them has a non-zero decoded size.
  const broken = await page.evaluate((altText) => {
    return Array.from(document.querySelectorAll(`img[alt="${altText}"]`)).some(
      (img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth === 0,
    );
  }, alt);

  expect(broken, "found an <img> that failed to load").toBe(false);
}
