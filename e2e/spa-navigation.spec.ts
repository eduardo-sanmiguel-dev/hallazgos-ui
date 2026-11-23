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
    // Este contexto no pasa por el fixture: el aviso de cookies tapa el pie.
    await page.getByRole("button", { name: "Entendido" }).click();
    await expect(
      page.getByRole("heading", { name: "Política de privacidad", exact: true }),
    ).toBeVisible();
    await expect(page).toHaveTitle("Política de privacidad | HADA");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
    // Debe declarar lo que la app hace con los datos (grabación de sesiones,
    // datos de salud de accidentes) y los derechos en México y Colombia.
    for (const title of ["Datos sensibles", "Monitoreo y grabación de sesiones", "Tus derechos"]) {
      await expect(page.getByRole("heading", { level: 2, name: new RegExp(title) })).toBeVisible();
    }

    // Ida y vuelta desde el login, sin sesión y sin recargar la página.
    await page.getByRole("link", { name: "Ir al inicio" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page).toHaveTitle("HADA");
    await page.getByRole("link", { name: "Política de privacidad" }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(
      page.getByRole("heading", { name: "Política de privacidad", exact: true }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test("SPA: términos y condiciones son públicos y enlazan con privacidad", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    storageState: { cookies: [], origins: [] },
  });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("button", { name: "Entendido" }).click();
    await page.getByRole("link", { name: "Términos y condiciones" }).click();
    await expect(page).toHaveURL(/\/terms$/);
    await expect(
      page.getByRole("heading", { name: "Términos y condiciones", exact: true }),
    ).toBeVisible();
    await expect(page).toHaveTitle("Términos y condiciones | HADA");
    for (const title of ["Uso aceptable", "Alcance de la plataforma", "Suspensión del acceso"]) {
      await expect(page.getByRole("heading", { level: 2, name: new RegExp(title) })).toBeVisible();
    }

    // El enlace dentro del texto lleva a la política sin recargar.
    await page.getByRole("main").getByRole("link", { name: "política de privacidad" }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page).toHaveTitle("Política de privacidad | HADA");
  } finally {
    await context.close();
  }
});
