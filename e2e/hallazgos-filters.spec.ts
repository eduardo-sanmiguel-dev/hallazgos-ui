import type { Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";
import {
  fillDate,
  pickMany,
  pickOption,
  sessionPlants,
  trackPageErrors,
} from "./support/ui";

// Filtros de la lista de hallazgos con los catálogos reales. Cada filtro
// viaja como variable de la consulta GraphQL.

/** Espera la siguiente consulta de hallazgos cuyas variables cumplan `match`. */
const nextQuery = (page: Page, match: (variables: Record<string, unknown>) => boolean) =>
  page.waitForRequest((request) => {
    if (!request.url().includes("/graphql")) return false;
    const variables = request.postDataJSON()?.variables;
    return !!variables && match(variables);
  });

const chip = (page: Page, text: string | RegExp) =>
  page.locator(".MuiChip-root").filter({ hasText: text });

test.describe("Hallazgos: filtros", () => {
  test("aplica cada filtro y los limpia", async ({ page }) => {
    test.setTimeout(120_000);
    const errors = trackPageErrors(page);
    await page.goto("/hallazgos");
    await expect(chip(page, "Sin filtros seleccionados")).toBeVisible();

    // IDs: se normalizan las comas y se aplican tras una pausa.
    const byIds = nextQuery(page, (v) => Array.isArray(v.ids));
    await page.getByLabel("ID(s)").fill("1,,2,");
    await byIds;
    await expect(chip(page, "IDs: 1,2")).toBeVisible();
    const byId = nextQuery(page, (v) => v.id === 1);
    await page.getByLabel("ID(s)").fill("1");
    await byId;
    await page.getByLabel("ID(s)").fill("");

    const [plant] = await sessionPlants(page);
    const byPlant = nextQuery(page, (v) => v.manufacturingPlantId === plant.id);
    await pickOption(page, "Planta", plant.name);
    await byPlant;
    await expect(chip(page, `Planta: ${plant.name}`)).toBeVisible();

    const byMainTypes = nextQuery(page, (v) => Array.isArray(v.mainTypeIds));
    await pickMany(page, "Clasificación", 3);
    await byMainTypes;
    await expect(chip(page, /^Clasificación: .+ \+1$/)).toBeVisible();

    const bySecondary = nextQuery(page, (v) => Array.isArray(v.secondaryTypeIds));
    await pickMany(page, "Tipo");
    await bySecondary;

    const byAreas = nextQuery(page, (v) => Array.isArray(v.areaIds));
    await pickMany(page, "Zonas");
    await byAreas;

    const byZones = nextQuery(page, (v) => Array.isArray(v.zoneIds));
    await pickMany(page, "Lugar");
    await byZones;

    const byStatuses = nextQuery(page, (v) => Array.isArray(v.statuses));
    await pickMany(page, "Estatus", 2);
    await byStatuses;

    const year = new Date().getFullYear();
    const byDate = nextQuery(page, (v) => !!v.startDate);
    await fillDate(page, "Fecha inicio", `01/01/${year}`);
    await byDate;
    await fillDate(page, "Fecha fin", `31/12/${year}`);

    await page.getByRole("button", { name: "Limpiar filtros" }).click();
    await expect(chip(page, "Sin filtros seleccionados")).toBeVisible();
    await expect(page.getByRole("button", { name: "Limpiar filtros" })).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("filtra por responsables", async ({ page }) => {
    await page.goto("/hallazgos");
    const [plant] = await sessionPlants(page);
    await pickOption(page, "Planta", plant.name);
    const byResponsibles = nextQuery(page, (v) => Array.isArray(v.responsibleIds));
    await pickMany(page, "Responsables", 3);
    await byResponsibles;
    await expect(chip(page, /^Responsables: /)).toBeVisible();
  });

  test("llega con los filtros del dashboard en la URL", async ({ page }) => {
    await page.goto("/hallazgos");
    const [plant] = await sessionPlants(page);
    const query = nextQuery(
      page,
      (v) =>
        v.manufacturingPlantId === plant.id &&
        Array.isArray(v.mainTypeIds) &&
        Array.isArray(v.areaIds) &&
        v.startDate === "01/01/2026",
    );
    await page.goto(
      `/hallazgos?manufacturingPlantId=${plant.id}&startDate=01/01/2026&endDate=31/12/2026&mainTypeIds=1,2&areaIds=1&responsibleIds=1`,
    );
    await query;
    await expect(chip(page, `Planta: ${plant.name}`)).toBeVisible();
  });
});
