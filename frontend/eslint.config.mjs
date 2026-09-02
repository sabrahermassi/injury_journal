import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Playwright's own test API, not the Next.js app: `test.extend`'s `use`
    // callback trips react-hooks/rules-of-hooks (a function argument named
    // `use`, not a hook), and its fixtures/specs otherwise follow Playwright's
    // conventions rather than this app's. Its own lint story is Playwright's,
    // not eslint-config-next's -- same reasoning as backend/ keeping a
    // separate config from frontend/.
    "e2e/**",
    "playwright.config.ts",
    "playwright-report/**",
    "e2e-results.json",
  ]),
]);

export default eslintConfig;
