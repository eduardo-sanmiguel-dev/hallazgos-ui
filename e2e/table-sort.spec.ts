import type { Page, Request } from "@playwright/test";

import { expect, test } from "./support/fixtures";
import { openFilters, trackPageErrors } from "./support/ui";

// Orden de las tablas resuelto por la API: referencia "Ordenado por" en la
// barra de filtros, encabezados ordenables, controles del panel (celular) y
// el orden recordado durante la sesión. Solo lecturas: no toca la base.

/** Orden predeterminado de cada listado, como lo resume la barra de filtros. */
const DEFAULTS: Array<[path: string, summary: string]> = [
  ["/hallazgos", "ID · Mayor a menor"],
  ["/areas", "ID · Mayor a menor"],
  ["/zones", "ID · Mayor a menor"],
  ["/processes", "ID · Mayor a menor"],
  ["/main-types", "ID · Mayor a menor"],
  ["/secondary-types", "ID · Mayor a menor"],
  ["/manufacturing-plants", "ID · Mayor a menor"],
  ["/users", "ID · Mayor a menor"],
  ["/employees", "Nombre · A → Z"],
  ["/emergency-teams", "ID · Mayor a menor"],
  ["/equipments", "Nombre · A → Z"],
  ["/epp", "Empleado · A → Z"],
  ["/ics", "Fecha de registro · Más reciente primero"],
  ["/ciael", "Fecha de creación · Más reciente primero"],
  ["/hds", "Nombre · A → Z"],
  ["/extinguisher-inspection", "ID · Mayor a menor"],
  ["/gemba-walk", "Fecha de realización · Más reciente primero"],
  ["/gemba-walk/zones", "ID · Mayor a menor"],
  ["/gemba-walk/observers", "ID · Mayor a menor"],
  ["/gemba-walk/evaluations", "ID · Mayor a menor"],
  ["/gemba-walk/calendar", "Fecha y hora programada · Más antiguo primero"],
];

const sortReference = (page: Page) =>
  page.getByRole("region", { name: "Filtros" }).getByLabel("Orden de los resultados");

/** Espera la consulta de la lista con ese orden y que la API la acepte. */
const listRequest = (page: Page, endpoint: string, orderBy: string, order: string) =>
  page.waitForResponse((response) => {
    const url = new URL(response.request().url());
    return (
      url.pathname.endsWith(`/api/v1/${endpoint}`) &&
      url.searchParams.has("page") &&
      url.searchParams.get("orderBy") === orderBy &&
      url.searchParams.get("order") === order
    );
  });

for (const [path, summary] of DEFAULTS) {
  test(`${path}: muestra por qué está ordenada la lista`, async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto(path);

    const reference = sortReference(page);
    await expect(reference).toContainText("Ordenado por");
    await expect(reference).toContainText(summary);
    await expect(reference).toContainText("(predeterminado)");
    expect(errors).toEqual([]);
  });
}

test("el encabezado ordena en la API y la referencia lo refleja", async ({ page }) => {
  const errors = trackPageErrors(page);
  const requests: Request[] = [];
  page.on("request", (request) => {
    if (/\/api\/v1\/areas\?/.test(request.url())) requests.push(request);
  });
  await page.goto("/areas");
  await expect(sortReference(page)).toContainText("ID · Mayor a menor");

  const byName = listRequest(page, "areas", "name", "asc");
  await page
    .getByRole("columnheader", { name: /^Nombre/ })
    .getByRole("button")
    .click();
  expect((await byName).status()).toBe(200);

  await expect(sortReference(page)).toContainText("Nombre · A → Z");
  await expect(sortReference(page)).not.toContainText("(predeterminado)");
  await expect(page.getByRole("columnheader", { name: /^Nombre/ })).toHaveAttribute(
    "aria-sort",
    "ascending",
  );

  // Segundo clic: dirección contraria.
  const desc = listRequest(page, "areas", "name", "desc");
  await page
    .getByRole("columnheader", { name: /^Nombre/ })
    .getByRole("button")
    .click();
  expect((await desc).status()).toBe(200);
  await expect(sortReference(page)).toContainText("Nombre · Z → A");

  // Restablecer desde la referencia vuelve al predeterminado.
  const reset = listRequest(page, "areas", "id", "desc");
  await sortReference(page).getByRole("img", { name: "Restablecer orden predeterminado" }).click();
  expect((await reset).status()).toBe(200);
  await expect(sortReference(page)).toContainText("(predeterminado)");

  // Cada consulta lleva el orden: nunca se ordena solo en el navegador.
  expect(requests.every((request) => new URL(request.url()).searchParams.has("orderBy"))).toBe(
    true,
  );
  expect(errors).toEqual([]);
});

test("en celular se ordena desde la barra de filtros y se recuerda en la sesión", async ({
  page,
}) => {
  const errors = trackPageErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/users");
  await openFilters(page);

  const bar = page.getByRole("region", { name: "Filtros" });
  const byEmail = listRequest(page, "users", "email", "asc");
  await bar.getByRole("combobox", { name: "Ordenar por" }).click();
  await page.getByRole("option", { name: "Correo electrónico" }).click();
  expect((await byEmail).status()).toBe(200);

  const desc = listRequest(page, "users", "email", "desc");
  await bar.getByRole("button", { name: "Z → A" }).click();
  expect((await desc).status()).toBe(200);
  await expect(sortReference(page)).toContainText("Correo electrónico · Z → A");

  // Al volver a la pantalla (misma sesión) conserva el orden elegido.
  const again = listRequest(page, "users", "email", "desc");
  await page.reload();
  expect((await again).status()).toBe(200);
  await expect(sortReference(page)).toContainText("Correo electrónico · Z → A");

  await openFilters(page);
  const reset = listRequest(page, "users", "id", "desc");
  await bar.getByRole("button", { name: "Restablecer orden", exact: true }).click();
  expect((await reset).status()).toBe(200);
  await expect(sortReference(page)).toContainText("ID · Mayor a menor");
  expect(errors).toEqual([]);
});

test("hallazgos: el Excel indica que sale en el orden de la lista", async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto("/hallazgos");

  const byPlant = listRequest(page, "evidences", "manufacturingPlant", "asc");
  await page
    .getByRole("columnheader", { name: /^Planta/ })
    .getByRole("button")
    .click();
  expect((await byPlant).status()).toBe(200);

  await page.getByRole("button", { name: "Excel", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Orden de las filas: Planta · A → Z");
  expect(errors).toEqual([]);
});
