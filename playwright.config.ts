import { defineConfig } from "@playwright/test";

import { loadE2EEnv } from "./e2e/support/env";

loadE2EEnv();

const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";

/**
 * Pruebas e2e del UI contra el API local (base de DESARROLLO).
 *
 * Requisitos: API corriendo (pnpm start:dev en hallazgos-api) y el usuario
 * de pruebas creado (ver e2e/README.md). La suite prepara su propio build
 * y servidor; el puerto 3000 debe estar libre. Se usa el Chrome instalado: no descarga navegadores.
 */
export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/unit/**"],
  outputDir: "./test-results",
  // Las pruebas son independientes (las escrituras se interceptan), así que
  // corren en paralelo. E2E_WORKERS=1 vuelve a una a la vez si el API o el
  // equipo no aguanta la carga. Seis workers se validaron con la suite completa.
  fullyParallel: true,
  workers: Number(process.env.E2E_WORKERS) || 6,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL,
    channel: "chrome",
    storageState: "e2e/.auth/user.json",
    acceptDownloads: true,
    // En Windows, con varios workers, grabar traces a veces falla al cerrar
    // (ENOENT en .playwright-artifacts). Para depurar: E2E_TRACE=1.
    trace: process.env.E2E_TRACE ? "retain-on-failure" : "off",
    screenshot: "only-on-failure",
    locale: "es-MX",
    timezoneId: "America/Mexico_City",
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: "node scripts/serve-e2e.mjs",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
