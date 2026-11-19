import { spawnSync } from "node:child_process";

import { CoverageReport } from "monocart-coverage-reports";

import { coverageOptions } from "./support/coverage";

/**
 * Borra el coverage de corridas anteriores y corre las pruebas unitarias
 * grabando su coverage (UNIT_COVERAGE=1, ver e2e/unit/coverage-setup.ts): el
 * reporte final junta unitarias y e2e. Si una unitaria falla, no sigue.
 */
export default async function coverageSetup() {
  new CoverageReport(coverageOptions).cleanCache();

  const unit = spawnSync(process.execPath, ["scripts/toolchain.mjs", "test", "run"], {
    stdio: "inherit",
    env: { ...process.env, UNIT_COVERAGE: "1" },
  });
  if (unit.error) throw unit.error;
  if (unit.status !== 0) throw new Error("Fallaron las pruebas unitarias.");
}
