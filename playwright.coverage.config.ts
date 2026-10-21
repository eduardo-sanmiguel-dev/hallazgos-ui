import { defineConfig } from "@playwright/test";

import config from "./playwright.config";

/** Mismas pruebas e2e, midiendo el coverage del UI (reporte en coverage/). */
export default defineConfig<{ coverage: boolean }>({
  ...config,
  globalSetup: ["./e2e/coverage-setup.ts", "./e2e/global-setup.ts"],
  globalTeardown: "./e2e/global-teardown.ts",
  use: { ...config.use, coverage: true },
});
