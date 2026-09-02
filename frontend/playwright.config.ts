import { defineConfig } from "@playwright/test";

// A local, manual sweep tool -- not part of `npm test` or CI. It drives the
// real dev servers (frontend :3000, backend :3001, and the AI assistant on
// :3002 for the assistant screen) with a real logged-in session and writes
// real data, so it must never run against anything but a developer's own
// local stack. `webServer` is deliberately omitted: this assumes those
// services are already running -- the same precondition every session in
// this repo has needed checking by hand, now enforced by the setup project
// failing fast instead of the whole sweep timing out against a dead server.
//
// One worker throughout. The sweep tests build up state through one shared
// test account across files (create an injury, then log against it, then
// read it back in insights) rather than isolating each test with its own
// fixtures, so running them out of order or in parallel would race.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["json", { outputFile: "e2e-results.json" }]],
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "public",
      testMatch: /public-pages\.spec\.ts/,
    },
    {
      name: "sweep",
      testMatch: /\d\d-.*\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: "e2e/.auth/user.json" },
    },
  ],
});
