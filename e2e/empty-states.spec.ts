import type { Page } from "@playwright/test";

import { mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import { pickOption, sessionPlants, trackPageErrors } from "./support/ui";

// Pantallas sin datos o con filtros incompletos: cada gráfica y tabla debe
// mostrar su mensaje sin romperse.

const LISTS = [
  "/areas",
  "/zones",
  "/processes",
  "/main-types",
  "/secondary-types",
  "/manufacturing-plants",
  "/users",
  "/employees",
  "/emergency-teams",
  "/equipments",
  "/epp",
  "/ics",
  "/ciael",
  "/extinguisher-inspection",
  "/gemba-walk",
  "/gemba-walk/zones",
  "/gemba-walk/observers",
  "/gemba-walk/evaluations",
  "/gemba-walk/calendar",
];

/** Toda consulta paginada (`?page=`) responde sin registros. */
const emptyPages = (page: Page) =>
  page.route(
    (url) => url.pathname.includes("/api/v1/") && url.searchParams.has("page"),
    (route) =>
      route.request().method() === "GET"
        ? route.fulfill({ json: { data: [], count: 0 } })
        : route.fallback(),
  );

const clickTabs = async (page: Page) => {
  const tabs = page.getByRole("tab");
  for (let i = 0; i < (await tabs.count()); i++) {
    await tabs.nth(i).click();
    await page.waitForTimeout(300);
  }
};

test.describe("Sin datos", () => {
  for (const route of LISTS) {
    test(`listado vacío ${route}`, async ({ page }) => {
      const errors = trackPageErrors(page);
      await emptyPages(page);
      await page.goto(route);
      await expect(page.getByText(/^0 registros$/).first()).toBeVisible();
      // La tabla dice que no hay datos (antes solo mostraba encabezados).
      // EPP tiene su propio mensaje.
      if (route !== "/epp") {
        await expect(page.getByText(/^Sin registros/).first()).toBeVisible();
      }
      await page.waitForLoadState("networkidle");
      expect(errors).toEqual([]);
    });
  }

  test("si la lista de hallazgos no carga: un solo intento, sin repetir, y Reintentar", async ({
    page,
  }) => {
    let fail = true;
    let queries = 0;
    let permissions = 0;
    await page.route(
      (url) => url.pathname.endsWith("/api/v1/evidences"),
      (route) => {
        queries++;
        return fail
          ? route.fulfill({ status: 500, body: "E2E caído" })
          : route.fallback();
      },
    );
    await page.route(
      (url) => url.pathname.endsWith("/api/v1/evidences/permissions/config"),
      (route) => {
        permissions++;
        return route.fallback();
      },
    );
    await page.goto("/hallazgos");

    const alert = page
      .getByRole("alert")
      .filter({ hasText: "No se pudo cargar" });
    await expect(alert).toBeVisible();
    // Antes, cada error provocaba otra consulta: decenas por segundo.
    await page.waitForTimeout(2_000);
    expect(queries).toBe(1);

    fail = false;
    await alert.getByRole("button", { name: "Reintentar" }).click();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(alert).toHaveCount(0);
    expect(queries).toBe(2);
    // Los permisos de las acciones se piden una vez, no en cada búsqueda.
    expect(permissions).toBe(1);
  });

  test("si la lista no carga, lo dice y deja reintentar", async ({ page }) => {
    let fail = true;
    await page.route(
      (url) =>
        url.pathname.endsWith("/api/v1/zones") && url.searchParams.has("page"),
      (route) =>
        fail
          ? route.fulfill({ status: 500, json: { message: "E2E caído" } })
          : route.fulfill({
              json: {
                data: [
                  {
                    id: 9701,
                    name: "E2E Lugar recuperado",
                    isActive: true,
                    createdAt: "2026-10-01T12:00:00.000Z",
                    updatedAt: "2026-10-01T12:00:00.000Z",
                    manufacturingPlant: { id: 1, name: "Planta" },
                  },
                ],
                count: 1,
              },
            }),
    );
    await page.goto("/zones");

    const alert = page
      .getByRole("alert")
      .filter({ hasText: "No se pudo cargar" });
    await expect(alert).toBeVisible();
    // No se confunde con "no hay datos".
    await expect(page.getByText(/^Sin registros/)).toHaveCount(0);

    fail = false;
    await alert.getByRole("button", { name: "Reintentar" }).click();
    await expect(page.getByText("E2E Lugar recuperado")).toBeVisible();
    await expect(alert).toHaveCount(0);
  });

  test("análisis de datos EPP con y sin datos", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/business-intelligence/epp");
    await page.waitForLoadState("networkidle");
    await clickTabs(page);

    const zeros = {
      gasto: 0,
      unidades: 0,
      entregas: 0,
      fueraDeRango: 0,
      empleados: 0,
      primeraVez: 0,
    };
    await mockGet(page, "/dashboard/business-intelligence/epp", {
      hasPrices: true,
      tracksDeliveryFrequency: true,
      kpis: {
        periodo: {
          actual: { desde: "2026-10-01", hasta: "2026-10-22" },
          anterior: { desde: "2026-09-01", hasta: "2026-09-22" },
        },
        actual: zeros,
        anterior: zeros,
        promedioGlobal: 0,
      },
      chart1: [],
      chart3: [],
      chart4: [],
      chart8: [],
      chart9: [],
    });
    const plants = await sessionPlants(page);
    if (plants.length > 1) {
      await pickOption(page, "Planta", plants[1].name);
    } else {
      await page.reload();
    }
    // Un solo aviso en lugar de "Sin datos" en cada gráfica.
    await expect(
      page.getByText("Sin entregas de EPP en este periodo"),
    ).toHaveCount(1);
    await expect(page.getByText("Sin datos", { exact: true })).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("el dashboard siempre tiene periodo: Personalizado parte del rango que se veía", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    await page.goto("/dashboard");
    const [plant] = await sessionPlants(page);
    await pickOption(page, "Planta", plant.name);
    await page.waitForLoadState("networkidle");

    // Antes se podían borrar las dos fechas y cada gráfica quedaba vacía;
    // ahora es un control de periodo con atajos y nunca queda sin rango.
    await pickOption(page, "Periodo", "Personalizado");
    const filters = page.getByRole("region", { name: "Filtros" });
    await expect(filters.getByRole("group", { name: "Desde" })).toBeVisible();
    await expect(filters.getByRole("group", { name: "Hasta" })).toBeVisible();
    await expect(page.getByText("Elige el periodo")).toHaveCount(0);

    await page.getByRole("button", { name: "Ir a Hallazgos" }).click();
    await expect(page).toHaveURL(
      /\/hallazgos\?manufacturingPlantId=\d+&startDate=.+&endDate=.+/,
    );
    expect(errors).toEqual([]);
  });
});
