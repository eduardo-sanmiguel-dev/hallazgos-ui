import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "deployment-updates.spec.ts",
  outputDir: "./test-results/deployment-updates",
  reporter: "list",
  use: { channel: "chrome", headless: true },
});
