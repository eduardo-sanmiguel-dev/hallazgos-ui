import type { Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";
import { scrollContent } from "./support/ui";

// Zona segura de los botones del sistema (Android/iOS). Con
// viewport-fit=cover la página se dibuja detrás de ellos para que se vea el
// fondo del tema; lo que va pegado abajo debe quedar por encima. Se simula
// una barra de 48px con DevTools (Emulation.setSafeAreaInsetsOverride).

const INSET = 48;

const emulateBottomInset = async (page: Page) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send(
    "Emulation.setSafeAreaInsetsOverride" as never,
    {
      insets: { bottom: INSET },
    } as never,
  );
};

const paddingBottom = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom));

test.describe("Zona segura inferior", () => {
  test("la página se dibuja detrás de los botones del sistema", async ({
    page,
  }) => {
    await page.goto("/");
    const viewports = await page
      .locator('meta[name="viewport"]')
      .evaluateAll((metas) =>
        metas.map((meta) => meta.getAttribute("content")),
      );
    expect(viewports).toHaveLength(1);
    expect(viewports[0]).toContain("viewport-fit=cover");
  });

  test("el contenido y el botón flotante quedan por encima", async ({
    page,
  }) => {
    await emulateBottomInset(page);
    await page.goto("/dashboard");

    expect(await paddingBottom(page, "main#contenido")).toBe(INSET);

    // El botón aparece al bajar.
    await scrollContent(page, 1200);
    const fab = page.getByRole("button", { name: "Volver arriba" });
    await expect(fab).toBeVisible();
    // 24px de margen (escritorio) + la zona segura. Se lee `bottom` y no la
    // caja: la animación de entrada (Zoom) escala el botón al aparecer.
    const bottom = await fab.evaluate((el) =>
      parseFloat(getComputedStyle(el).bottom),
    );
    expect(bottom).toBe(24 + INSET);
  });

  test("los diálogos a pantalla completa respetan la zona", async ({
    page,
  }) => {
    await emulateBottomInset(page);
    await page.goto("/ciael");
    await page.getByRole("button", { name: "Crear registro" }).click();
    await expect(page.getByText("Nuevo registro CIAEL")).toBeVisible();

    expect(await paddingBottom(page, ".MuiDialog-paperFullScreen")).toBe(INSET);
  });

  test("el login deja la zona libre al final", async ({ browser }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    await emulateBottomInset(page);
    await page.goto("/");
    expect(await paddingBottom(page, "main")).toBe(INSET);
    await context.close();
  });
});
