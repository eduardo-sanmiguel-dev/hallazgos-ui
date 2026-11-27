import type { Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";
import { trackPageErrors } from "./support/ui";

// Con señal débil, abrir una pantalla puede tardar: pasados 4 s se avisa que
// sigue cargando (antes la pantalla anterior se quedaba quieta sin aviso).

const slowText = "La conexión está lenta. Seguimos abriendo la página…";

/** Registra si el aviso aparece en algún momento (aunque sea un instante). */
const watchSlowNotice = (page: Page) =>
  page.evaluate((text) => {
    const w = window as unknown as { slowNoticeSeen: boolean };
    w.slowNoticeSeen = false;
    new MutationObserver(() => {
      if (document.body.textContent?.includes(text)) w.slowNoticeSeen = true;
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }, slowText);

const slowNoticeSeen = (page: Page) =>
  page.evaluate(() => (window as unknown as { slowNoticeSeen: boolean }).slowNoticeSeen);

/** Retrasa la descarga del JS de las pantallas que aún no se han abierto. */
const delayAssets = (page: Page, ms: number) =>
  page.route("**/assets/*.js", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    await route.fallback();
  });

test("si abrir una pantalla tarda, avisa que la conexión está lenta hasta que abre", async ({
  page,
}) => {
  const errors = trackPageErrors(page);
  await page.goto("/processes");
  const createButton = page.getByRole("button", { name: "Crear proceso", exact: true });
  await expect(createButton).toBeVisible();

  await delayAssets(page, 7_000);
  await createButton.click();

  const notice = page.getByRole("status").filter({ hasText: slowText });
  await expect(notice).toBeVisible({ timeout: 6_000 });
  await expect(notice.getByRole("progressbar", { name: "Abriendo la página" })).toBeVisible();

  await expect(page.getByRole("heading", { level: 1, name: "Nuevo proceso" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(notice).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("una pantalla que abre rápido no muestra el aviso", async ({ page }) => {
  await page.goto("/processes");
  const createButton = page.getByRole("button", { name: "Crear proceso", exact: true });
  await expect(createButton).toBeVisible();
  await watchSlowNotice(page);

  // Lenta, pero por debajo de los 4 s del aviso.
  await delayAssets(page, 2_000);
  await createButton.click();

  await expect(page.getByRole("heading", { level: 1, name: "Nuevo proceso" })).toBeVisible();
  expect(await slowNoticeSeen(page)).toBe(false);
});

test("el aviso de una navegación lenta no pasa a la siguiente", async ({ page }) => {
  await page.goto("/processes");
  const createButton = page.getByRole("button", { name: "Crear proceso", exact: true });
  await expect(createButton).toBeVisible();

  await delayAssets(page, 5_000);
  await createButton.click();
  await expect(page.getByText(slowText)).toBeVisible({ timeout: 6_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Nuevo proceso" })).toBeVisible({
    timeout: 15_000,
  });

  // Volver ya no descarga nada nuevo: es inmediato y sin aviso.
  await page.unrouteAll({ behavior: "wait" });
  await watchSlowNotice(page);
  await page.goBack();
  await expect(createButton).toBeVisible();
  await page.waitForTimeout(500);
  expect(await slowNoticeSeen(page)).toBe(false);
});
