import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // services/api.ts throws at module load without this, and any component
    // that reaches the journal API pulls it in transitively. The value is
    // never actually requested: fetch is mocked wherever it matters.
    env: {
      NEXT_PUBLIC_API_URL: "http://localhost:3001",
    },
    environment: "jsdom",
    pool: "threads",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
});
