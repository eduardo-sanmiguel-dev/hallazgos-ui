import type { Page } from "@playwright/test";

import { mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import {
  fillDate,
  openFilters,
  pickMany,
  pickOption,
  sessionPlants,
  trackPageErrors,
} from "./support/ui";

// Filtros de la lista de hallazgos con los catálogos reales. Cada filtro
// viaja como parámetro de GET /evidences (listas separadas por comas).

/** Espera la siguiente consulta de hallazgos cuyos parámetros cumplan `match`. */
const nextQuery = (
  page: Page,
  match: (params: Record<string, string>) => boolean,
) =>
  page.waitForRequest((request) => {
    const url = new URL(request.url());
    if (!url.pathname.endsWith("/api/v1/evidences")) return false;
    return match(Object.fromEntries(url.searchParams));
  });

const chip = (page: Page, text: string | RegExp) =>
  page.locator(".MuiChip-root").filter({ hasText: text });

test.describe("Hallazgos: filtros", () => {
  test("aplica cada filtro y los limpia", async ({ page }) => {
    test.setTimeout(120_000);
    const errors = trackPageErrors(page);
    await page.goto("/hallazgos");
    await openFilters(page);
    await expect(chip(page, "Sin filtros seleccionados")).toBeVisible();

    // IDs: se normalizan las comas y se aplican tras una pausa.
    const byIds = nextQuery(page, (v) => v.ids === "1,2");
    await page.getByLabel("ID(s)").fill("1,,2,");
    await byIds;
    await expect(chip(page, "IDs: 1,2")).toBeVisible();
    const byId = nextQuery(page, (v) => v.id === "1");
    await page.getByLabel("ID(s)").fill("1");
    await byId;
    await page.getByLabel("ID(s)").fill("");

    const [plant] = await sessionPlants(page);
    const byPlant = nextQuery(
      page,
      (v) => v.manufacturingPlantId === String(plant.id),
    );
    await pickOption(page, "Planta", plant.name);
    await byPlant;
    await expect(chip(page, `Planta: ${plant.name}`)).toBeVisible();

    const byMainTypes = nextQuery(page, (v) => !!v.mainTypeIds);
    await pickMany(page, "Clasificación", 3);
    await byMainTypes;
    await expect(chip(page, /^Clasificación: .+ \+1$/)).toBeVisible();

    const bySecondary = nextQuery(page, (v) => !!v.secondaryTypeIds);
    await pickMany(page, "Tipo");
    await bySecondary;

    const byAreas = nextQuery(page, (v) => !!v.areaIds);
    await pickMany(page, "Zonas");
    await byAreas;

    const byZones = nextQuery(page, (v) => !!v.zoneIds);
    await pickMany(page, "Lugar");
    await byZones;

    const byStatuses = nextQuery(page, (v) => !!v.statuses);
    await pickMany(page, "Estatus", 2);
    await byStatuses;

    const year = new Date().getFullYear();
    const byDate = nextQuery(page, (v) => !!v.startDate);
    await fillDate(page, "Fecha inicio", `01/01/${year}`);
    await byDate;
    await fillDate(page, "Fecha fin", `31/12/${year}`);

    await page.getByRole("button", { name: "Limpiar filtros" }).click();
    await expect(chip(page, "Sin filtros seleccionados")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Limpiar filtros" }),
    ).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("filtra por responsables", async ({ page }) => {
    await page.goto("/hallazgos");
    const [plant] = await sessionPlants(page);
    await pickOption(page, "Planta", plant.name);
    const byResponsibles = nextQuery(page, (v) => !!v.responsibleIds);
    await pickMany(page, "Responsables", 3);
    await byResponsibles;
    await expect(chip(page, /^Responsables: /)).toBeVisible();
  });

  // Los responsables de los lugares elegidos los filtra la API (zoneIds):
  // el UI ya no recibe las zonas de cada usuario.
  test("los responsables se piden por planta y lugar a la API", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const user = (id: number, name: string) => ({
      id,
      name,
      email: `e2e-${id}@example.com`,
      role: "Supervisor",
    });
    const requests: URL[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.pathname.endsWith("/api/v1/users")) requests.push(url);
    });
    await mockGet(
      page,
      "/users",
      [user(9902, "E2E De la planta"), user(9901, "E2E Del lugar")],
      {
        when: (url) => !url.searchParams.has("zoneIds"),
      },
    );
    await mockGet(page, "/users", [user(9901, "E2E Del lugar")], {
      when: (url) => url.searchParams.has("zoneIds"),
    });

    await page.goto("/hallazgos");
    const [plant] = await sessionPlants(page);
    await pickOption(page, "Planta", plant.name);
    // Elige al que no está en el lugar: al filtrar por lugar debe quitarse.
    expect(await pickMany(page, "Responsables")).toEqual(["E2E De la planta"]);
    await expect(chip(page, "Responsables: E2E De la planta")).toBeVisible();

    await pickMany(page, "Lugar");
    await expect(chip(page, /^Responsables: /)).toHaveCount(0);
    await page
      .getByRole("combobox", { name: "Responsables", exact: true })
      .click();
    const options = page
      .getByRole("listbox")
      .getByRole("option")
      .filter({ hasNotText: /^(Todos|Ninguno)$/ });
    await expect(options).toHaveText(["E2E Del lugar"]);

    const last = requests.at(-1)!;
    expect(last.searchParams.get("view")).toBe("options");
    expect(last.searchParams.get("manufacturingPlantId")).toBe(
      String(plant.id),
    );
    expect(last.searchParams.get("zoneIds")).toMatch(/^\d+(,\d+)*$/);
    expect(errors).toEqual([]);
  });

  test("llega con los filtros del dashboard en la URL", async ({ page }) => {
    await page.goto("/hallazgos");
    const [plant] = await sessionPlants(page);
    const query = nextQuery(
      page,
      (v) =>
        v.manufacturingPlantId === String(plant.id) &&
        !!v.mainTypeIds &&
        !!v.areaIds &&
        v.startDate === "01/01/2026",
    );
    await page.goto(
      `/hallazgos?manufacturingPlantId=${plant.id}&startDate=01/01/2026&endDate=31/12/2026&mainTypeIds=1,2&areaIds=1&responsibleIds=1`,
    );
    await query;
    // Con la barra cerrada, el resumen muestra los filtros recibidos.
    const summary = page.getByRole("group", { name: "Filtros aplicados" });
    await expect(
      summary
        .locator(".MuiChip-root")
        .filter({ hasText: `Planta: ${plant.name}` }),
    ).toBeVisible();
  });
});
