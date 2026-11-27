import { expect, test } from "./support/fixtures";
import { trackPageErrors } from "./support/ui";

// Regresión (RUM 2026-11-26, /dashboard en 3G): una descarga del JS de la
// pantalla se colgó, el import() falló y se mostró "No se pudo mostrar esta
// página" aunque el archivo existía. Ahora se reintenta antes del error.

const routeErrorTitle = "No se pudo mostrar esta página";

test("si falla la descarga del JS de una pantalla, se reintenta y la pantalla abre", async ({
  page,
}) => {
  const errors = trackPageErrors(page);
  await page.goto("/processes");
  const createButton = page.getByRole("button", { name: "Crear proceso", exact: true });
  await expect(createButton).toBeVisible();

  // Solo falla la primera descarga de JS que pida la pantalla nueva.
  let aborted = 0;
  await page.route("**/assets/*.js", (route) => {
    if (aborted++ === 0) return route.abort("connectionreset");
    return route.fallback();
  });
  await createButton.click();

  await expect(page).toHaveURL(/\/processes\/form$/);
  await expect(page.getByRole("heading", { level: 1, name: "Nuevo proceso" })).toBeVisible();
  await expect(page.getByText(routeErrorTitle)).toHaveCount(0);
  expect(aborted).toBeGreaterThan(1);
  expect(errors).toEqual([]);
});

test("si la descarga sigue fallando, muestra el error con Reintentar", async ({ page }) => {
  await page.goto("/processes");
  const createButton = page.getByRole("button", { name: "Crear proceso", exact: true });
  await expect(createButton).toBeVisible();

  let aborted = 0;
  // Cada corte tarda 1 s (como una red lenta): con los reintentos la
  // navegación dura ~7 s, lejos de los 4 s del aviso de conexión lenta.
  await page.route("**/assets/*.js", async (route) => {
    aborted++;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    await route.abort("internetdisconnected");
  });
  await createButton.click();

  // Mientras reintenta (1 s + 3 s), avisa que la conexión está lenta.
  const slowNotice = page.getByText("La conexión está lenta. Seguimos abriendo la página…");
  await expect(slowNotice).toBeVisible({ timeout: 6_000 });
  await expect(page.getByText(routeErrorTitle)).toBeVisible({ timeout: 15_000 });
  await expect(slowNotice).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
  // El intento inicial y los dos reintentos pidieron el JS.
  expect(aborted).toBeGreaterThanOrEqual(3);
});
