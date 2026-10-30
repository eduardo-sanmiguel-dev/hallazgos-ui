import type { Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";
import { scrollContent, trackPageErrors } from "./support/ui";

// "Volver arriba" en todo el sistema: aparece al bajar en el contenido y
// regresa al inicio. En formularios no (la barra de acciones ocupa esa
// esquina) y en celular queda por encima de la navegación inferior.

const fab = (page: Page) => page.getByRole("button", { name: "Volver arriba" });

const contentScrollTop = (page: Page) =>
  page.locator("main#contenido").evaluate((el) => el.scrollTop);

test.describe("Volver arriba", () => {
  for (const path of ["/hallazgos", "/gemba-walk", "/dashboard"]) {
    test(`aparece al bajar y regresa al inicio en ${path}`, async ({
      page,
    }) => {
      const errors = trackPageErrors(page);
      await page.goto(path);
      // Con la página aún cargando, el scroll vuelve al inicio.
      await page.waitForLoadState("networkidle");
      await expect(fab(page)).toBeHidden();

      await scrollContent(page, 1200);
      await expect(fab(page)).toBeVisible();

      await fab(page).click();
      await expect.poll(() => contentScrollTop(page)).toBe(0);
      await expect(fab(page)).toBeHidden();
      // El foco no se pierde al desaparecer el botón.
      await expect(page.locator("main#contenido")).toBeFocused();
      expect(errors).toEqual([]);
    });
  }

  test("no aparece en formularios", async ({ page }) => {
    await page.goto("/hallazgos/form");
    await page.waitForLoadState("networkidle");
    await scrollContent(page, 1200);
    await expect(fab(page)).toBeHidden();
  });

  test.describe("en celular", () => {
    test.use({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });

    test("queda por encima de la navegación inferior", async ({ page }) => {
      await page.goto("/hallazgos");
      const nav = page.getByRole("navigation", { name: "Accesos rápidos" });
      await expect(nav).toBeVisible();

      await scrollContent(page, 1200);
      await expect(fab(page)).toBeVisible();
      // Se lee `bottom` y no la caja: la animación de entrada (Zoom) escala
      // el botón al aparecer.
      const bottom = await fab(page).evaluate((el) =>
        parseFloat(getComputedStyle(el).bottom),
      );
      const navHeight = await nav.evaluate(
        (el) => el.getBoundingClientRect().height,
      );
      expect(bottom).toBeGreaterThan(navHeight);
    });
  });
});
