import { test as base } from "@playwright/test";
import { CoverageReport } from "monocart-coverage-reports";

import { coverageOptions } from "./coverage";

export { expect } from "@playwright/test";

/**
 * `test` de Playwright que, con la opción `coverage` (ver
 * playwright.coverage.config.ts), graba el coverage JS de cada prueba.
 */
export const test = base.extend<{ coverage: boolean; collectCoverage: void }>({
  coverage: [false, { option: true }],
  collectCoverage: [
    async ({ page, coverage }, use) => {
      if (!coverage) return use();

      await page.coverage.startJSCoverage({ resetOnNavigation: false });
      await use();
      const data = await page.coverage.stopJSCoverage();
      await new CoverageReport(coverageOptions).add(data);
    },
    { auto: true },
  ],
});
