import { CoverageReport } from "monocart-coverage-reports";

import { coverageOptions } from "./support/coverage";

/** Junta el coverage de todas las pruebas y genera el reporte en coverage/. */
export default async function globalTeardown() {
  await new CoverageReport(coverageOptions).generate();
}
