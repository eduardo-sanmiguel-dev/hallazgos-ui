import { test as base } from "@playwright/test";
import { CoverageReport } from "monocart-coverage-reports";

import { coverageOptions } from "./coverage";

export { expect } from "@playwright/test";

/**
 * `test` de Playwright que, con la opción `coverage` (ver
 * playwright.coverage.config.ts), graba el coverage JS de cada prueba.
 */
export const test = base.extend<{
  coverage: boolean;
  collectCoverage: void;
  hideNextDevTools: void;
}>({
  coverage: [false, { option: true }],
  /**
   * Oculta el indicador y overlay de Next en modo dev: su posición se guarda
   * en .next/dev/cache y, en la esquina inferior derecha, tapa el botón
   * "Volver arriba". Los errores de la página los revisa trackPageErrors.
   */
  hideNextDevTools: [
    async ({ page }, use) => {
      await page.addInitScript(() => {
        const hide = () => {
          const style = document.createElement("style");
          style.textContent = "nextjs-portal { display: none !important; }";
          document.head.append(style);
        };
        if (document.head) hide();
        else document.addEventListener("DOMContentLoaded", hide);
      });
      await use();
    },
    { auto: true },
  ],
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
