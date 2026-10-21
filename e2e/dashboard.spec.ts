import type { Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";
import {
  fillDate,
  pickMany,
  pickOption,
  sessionPlants,
  trackPageErrors,
} from "./support/ui";

// Dashboard con los datos de la base de desarrollo: filtros, vistas
// (gráficas, mapa de calor, histórico) y exportaciones. Solo lectura.

/** Elige la primera planta y espera las gráficas de esa planta. */
const choosePlantAndWait = async (page: Page) => {
  await page.goto("/dashboard");
  const [plant] = await sessionPlants(page);
  await pickOption(page, "Planta", plant.name);
  await page.waitForLoadState("networkidle");
  return plant;
};

test.describe("Dashboard", () => {
  test("filtra por fechas, zonas, responsables y clasificación", async ({
    page,
  }) => {
    // Un año de datos en 10 gráficas: con la suite completa tarda más.
    test.setTimeout(120_000);
    const errors = trackPageErrors(page);
    await choosePlantAndWait(page);

    // Desde el inicio del año, para que haya datos.
    const year = new Date().getFullYear();
    const filterRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/dashboard/") &&
        request.url().includes(`startDate=01%2F01%2F${year}`),
    );
    await fillDate(page, "Fecha inicio", `01/01/${year}`);
    await filterRequest;
    await page.waitForLoadState("networkidle");

    // Varias zonas ocultan las gráficas de proyección.
    const areasRequest = page.waitForRequest((request) =>
      request.url().includes("areaIds="),
    );
    await pickMany(page, "Zonas", 2);
    await areasRequest;
    await page.waitForLoadState("networkidle");

    const responsiblesRequest = page.waitForRequest((request) =>
      request.url().includes("responsibleIds="),
    );
    await pickMany(page, "Responsables");
    await responsiblesRequest;

    const mainTypesRequest = page.waitForRequest((request) =>
      request.url().includes("mainTypeIds="),
    );
    await pickMany(page, "Clasificación");
    await mainTypesRequest;
    await page.waitForLoadState("networkidle");

    // Lleva los filtros a la lista de hallazgos.
    await page.getByRole("button", { name: "Ir a Hallazgos" }).click();
    await expect(page).toHaveURL(
      /\/hallazgos\?manufacturingPlantId=\d+&startDate=.+&endDate=.+&mainTypeIds=.+&areaIds=.+&responsibleIds=.+/,
    );
    expect(errors).toEqual([]);
  });

  test("cambia al mapa de calor, al histórico y regresa", async ({ page }) => {
    const errors = trackPageErrors(page);
    await choosePlantAndWait(page);

    await page.getByRole("button", { name: "Mapa de calor" }).click();
    await expect(page.getByText(/Planta: .+ \| Periodo: /)).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Gráficas" }).click();
    await expect(page.getByRole("button", { name: "Mapa de calor" })).toBeVisible();

    await page.getByRole("button", { name: "Histórico" }).click();
    const back = page.getByRole("button", { name: "Regresar" });
    await expect(back).toBeVisible();
    await page.waitForLoadState("networkidle");
    await back.click();
    await expect(page.getByRole("button", { name: "Histórico" })).toBeVisible();

    await page.getByRole("button", { name: "Volver arriba" }).click();
    expect(errors).toEqual([]);
  });

  test("descarga el informe PDF de las gráficas visibles", async ({ page }) => {
    test.setTimeout(120_000);
    await choosePlantAndWait(page);

    const downloadPromise = page.waitForEvent("download", { timeout: 90_000 });
    await page.getByRole("button", { name: "Descargar informe PDF" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(
      /^Informe_Dashboard_\d{8}_\d{4}\.pdf$/,
    );
  });

  test("sin planta lleva a hallazgos sin filtros de planta", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("button", { name: "Descargar informe PDF" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Ir a Hallazgos" }).click();
    await expect(page).toHaveURL(/\/hallazgos\?startDate=/);
  });
});
