import type { Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";
import { e2eCredentials } from "./support/env";

// Enlace a un hallazgo (botón "Ver hallazgo" de los correos):
// /hallazgos?evidenceId=N abre la lista solo con él y su detalle. Sin sesión,
// el login regresa al enlace.

/** Id del hallazgo más reciente que ve el usuario de pruebas. */
const latestEvidenceId = async (page: Page) => {
  await page.goto("/hallazgos");
  // Primera columna de la tabla: el id es el encabezado de la fila.
  const firstId = page.getByRole("rowheader").first();
  await expect(firstId).toHaveText(/^\d+$/);
  return Number(await firstId.textContent());
};

const detail = (page: Page, id: number) =>
  page.getByRole("dialog", { name: `Hallazgo #${id}` });

test("abre el detalle del hallazgo enlazado una sola vez", async ({ page }) => {
  const id = await latestEvidenceId(page);

  await page.goto(`/hallazgos?evidenceId=${id}`);
  await expect(detail(page, id)).toBeVisible();

  // Al cerrarlo queda la lista filtrada y no se vuelve a abrir.
  await detail(page, id).getByRole("button", { name: "Cerrar" }).click();
  await expect(detail(page, id)).toBeHidden();
  await expect(page.getByRole("rowheader")).toHaveText([String(id)]);
  await expect(detail(page, id)).toBeHidden();
});

test.describe("sin sesión", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("el login regresa al hallazgo enlazado", async ({ page, browser }) => {
    // El id se lee con la sesión guardada del usuario de pruebas.
    const context = await browser.newContext({
      storageState: "e2e/.auth/user.json",
    });
    const id = await latestEvidenceId(await context.newPage());
    await context.close();

    await page.goto(`/hallazgos?evidenceId=${id}`);
    await expect(page).toHaveURL(
      `/?next=${encodeURIComponent(`/hallazgos?evidenceId=${id}`)}`,
    );

    const { email, password } = e2eCredentials();
    await page.getByLabel("Correo Electrónico").fill(email);
    await page.getByLabel("Contraseña", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Iniciar" }).click();

    await expect(page).toHaveURL(`/hallazgos?evidenceId=${id}`);
    await expect(detail(page, id)).toBeVisible();
  });
});
