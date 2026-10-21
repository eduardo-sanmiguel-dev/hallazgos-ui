import { CoverageReport } from "monocart-coverage-reports";

import { coverageOptions } from "./support/coverage";

/** Borra el coverage de corridas anteriores antes de empezar. */
export default async function coverageSetup() {
  new CoverageReport(coverageOptions).cleanCache();
}
