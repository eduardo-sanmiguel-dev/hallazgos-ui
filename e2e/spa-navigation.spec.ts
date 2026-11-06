import { expect, test } from "./support/fixtures";
import { trackPageErrors } from "./support/ui";

test("SPA: conserva la navegación atrás y adelante entre lista y formulario", async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto("/processes");
  await page.getByRole("button", { name: "Crear proceso", exact: true }).click();
  await expect(page).toHaveURL(/\/processes\/form$/);
  await expect(page.getByRole("heading", { level: 1, name: "Nuevo proceso" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/processes$/);
  await expect(page.getByRole("button", { name: "Crear proceso", exact: true })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/processes\/form$/);
  await expect(page.getByRole("heading", { level: 1, name: "Nuevo proceso" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("SPA: normaliza barras finales y permite recargar enlaces de formulario", async ({ page }) => {
  await page.goto("/processes/form/");
  await expect(page).toHaveURL(/\/processes\/form$/);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Nuevo proceso" })).toBeVisible();
});

test("SPA: una ruta desconocida muestra la página de no encontrado", async ({ page }) => {
  await page.goto("/ruta-inexistente-e2e");
  await expect(page.getByText("Página no encontrada", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ir al inicio" })).toBeVisible();
});

test("SPA: privacidad es pública y conserva sus metadatos", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    storageState: { cookies: [], origins: [] },
  });
  try {
    const page = await context.newPage();
    await page.goto("/privacy");
    await expect(
      page.getByRole("heading", { name: "Politica de privacidad", exact: true }),
    ).toBeVisible();
    await expect(page).toHaveTitle("Politica de privacidad | HADA");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
  } finally {
    await context.close();
  }
});
