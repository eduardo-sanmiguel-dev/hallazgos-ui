import { expect, test as base, type Page } from "@playwright/test";
import { CoverageReport } from "monocart-coverage-reports";

import { COOKIE_NOTICE_KEY, COOKIE_NOTICE_VERSION } from "../../app/_shared/utils/cookieNotice";
import { coverageOptions } from "./coverage";

export { expect };

/**
 * Lo que el navegador bloqueó por la política de seguridad de contenido (CSP,
 * scripts/csp.mjs) en todas las páginas del contexto, popups incluidos.
 */
const watchCspViolations = (context: import("@playwright/test").BrowserContext) => {
  const violations: string[] = [];
  const watch = (page: Page) =>
    page.on("console", (message) => {
      const text = message.text();
      if (/Content Security Policy/i.test(text)) violations.push(`${page.url()}: ${text}`);
    });
  context.pages().forEach(watch);
  context.on("page", watch);
  return violations;
};

/**
 * `test` de Playwright que, con la opción `coverage` (ver
 * playwright.coverage.config.ts), graba el coverage JS de cada prueba.
 */
export const test = base.extend<{
  coverage: boolean;
  collectCoverage: void;
  cookieNotice: boolean;
}>({
  coverage: [false, { option: true }],
  // El aviso de cookies queda fijo abajo y taparía botones: se da por visto,
  // salvo en las pruebas que lo revisan (test.use({ cookieNotice: true })).
  cookieNotice: [false, { option: true }],
  context: async ({ context, cookieNotice }, provide) => {
    if (!cookieNotice) {
      await context.addInitScript(
        ([key, version]) => {
          try {
            localStorage.setItem(key, version);
          } catch {
            // about:blank y similares no tienen almacenamiento.
          }
        },
        [COOKIE_NOTICE_KEY, COOKIE_NOTICE_VERSION] as const,
      );
    }
    const violations = watchCspViolations(context);
    await provide(context);
    // Toda la suite comprueba que la CSP no bloquea nada de la app.
    expect(violations, "La CSP bloqueó algo de la app").toEqual([]);
  },
  collectCoverage: [
    async ({ page, coverage }, use) => {
      if (!coverage) return use();

      await page.coverage.startJSCoverage({ resetOnNavigation: false });
      await use();
      const data = await page.coverage.stopJSCoverage();
      if (data.length) await new CoverageReport(coverageOptions).add(data);
    },
    { auto: true },
  ],
});
