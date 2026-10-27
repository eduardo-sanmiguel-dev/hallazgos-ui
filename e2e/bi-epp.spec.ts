import type { Page } from "@playwright/test";

import { mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import { trackPageErrors } from "./support/ui";

// Análisis de datos EPP: solo administradores; sin precios capturados en la
// planta no se muestra nada de gasto; el periodo lo elige el usuario (la API
// calcula la comparación); pestaña "Fuera de rango" por equipo y persona.
// La API se simula.

const PLANT = { id: 1, name: "Planta E2E" };

const biData = (hasPrices: boolean, tracksDeliveryFrequency = true) => ({
  hasPrices,
  tracksDeliveryFrequency,
  kpis: {
    periodo: {
      actual: { desde: "2026-10-01", hasta: "2026-10-22" },
      anterior: { desde: "2026-09-01", hasta: "2026-09-22" },
    },
    actual: {
      gasto: 1200,
      unidades: 10,
      entregas: 8,
      fueraDeRango: 2,
      empleados: 4,
      primeraVez: 3,
    },
    anterior: {
      gasto: 800,
      unidades: 6,
      entregas: 5,
      fueraDeRango: 0,
      empleados: 2,
      primeraVez: 1,
    },
    promedioGlobal: 250,
  },
  chart1: [],
  chart3: [],
  chart4: [],
  chart8: [],
  chart9: [],
});

const asUser = (page: Page, role: string) =>
  mockGet(page, "/users/get-information-current-user", {
    id: 7401,
    name: "E2E Rol",
    email: "e2e-rol@example.com",
    role,
    isActive: true,
    manufacturingPlants: [PLANT],
    zones: [],
  });

const openAnalysis = async (
  page: Page,
  hasPrices: boolean,
  tracksDeliveryFrequency = true,
) => {
  await mockGet(
    page,
    "/dashboard/business-intelligence/epp",
    biData(hasPrices, tracksDeliveryFrequency),
  );
  await page.goto("/business-intelligence/epp");
  await expect(page.getByRole("tab", { name: "Entregas" })).toBeVisible();
};

/**
 * Tarjeta del indicador con esa etiqueta. Los indicadores van antes de las
 * pestañas: la primera coincidencia es el KPI y no una gráfica con el mismo
 * título (p. ej. "Gasto promedio por colaborador").
 */
const kpi = (page: Page, label: string) =>
  page
    .locator(".MuiPaper-root")
    .filter({ has: page.getByText(label, { exact: true }) })
    .first();

test.describe("Análisis de datos EPP", () => {
  test("un usuario que no es administrador no lo ve ni puede abrirlo", async ({
    page,
  }) => {
    await asUser(page, "General");
    let requested = false;
    page.on("request", (request) => {
      if (request.url().includes("/business-intelligence/epp?"))
        requested = true;
    });

    // Antes redirigía al dashboard; ahora dice que no tiene acceso, igual
    // que el resto de páginas ocultas del menú.
    await page.goto("/business-intelligence/epp");
    await expect(
      page.getByText("No tienes acceso a esta sección"),
    ).toBeVisible();
    expect(requested).toBe(false);

    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(
      page
        .getByRole("navigation", { name: "Menú principal" })
        .getByText("Análisis de datos"),
    ).toHaveCount(0);
  });

  test("con precios: gasto y entregas, comparando los mismos días", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    await openAnalysis(page, true);

    await expect(
      page.getByText("1–22 oct 2026 comparado con 1–22 sep 2026"),
    ).toBeVisible();
    await expect(page.getByRole("tab")).toHaveText([
      "Gasto",
      "Entregas",
      "Fuera de rango",
    ]);

    // Fuera de rango: 2 de 8 = 25 %; promedio por colaborador: 1200 / 4.
    await expect(kpi(page, "Entregas fuera de rango")).toContainText("25.0%");
    await expect(kpi(page, "Gasto promedio por colaborador")).toContainText(
      "$300",
    );
    await expect(kpi(page, "Primera entrega de EPP")).toContainText("3");

    // Eliminados: cobertura, precio vigente y equipos de colaboradores nuevos.
    for (const removed of [
      "Cobertura",
      "Precio vigente por equipo",
      "Equipos entregados a colaboradores nuevos",
    ]) {
      await expect(page.getByText(removed)).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });

  test("sin precios oculta lo de gasto y avisa por qué", async ({ page }) => {
    const errors = trackPageErrors(page);
    await openAnalysis(page, false);

    await expect(page.getByText(/no tienen precio registrado/)).toBeVisible();
    await expect(page.getByRole("tab")).toHaveText([
      "Entregas",
      "Fuera de rango",
    ]);
    await expect(page.getByText("Gasto", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Gasto promedio por colaborador")).toHaveCount(
      0,
    );

    // Lo que no depende de precios sigue disponible.
    await expect(page.getByText("Unidades entregadas")).toBeVisible();
    await expect(page.getByText("Entregas fuera de rango")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("el periodo elegido se envía a la API", async ({ page }) => {
    const periods: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (
        // Solo la API (la página tiene la misma ruta).
        url.pathname.endsWith("/api/v1/dashboard/business-intelligence/epp")
      ) {
        periods.push(
          `${url.searchParams.get("startDate")}-${url.searchParams.get("endDate")}`,
        );
      }
    });
    await openAnalysis(page, true);

    const pad = (n: number) => String(n).padStart(2, "0");
    const ddmmyyyy = (d: Date) =>
      `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    // Por omisión: este mes a la fecha.
    await expect
      .poll(() => periods[0])
      .toBe(`${ddmmyyyy(monthStart)}-${ddmmyyyy(today)}`);

    await page.getByRole("combobox", { name: "Periodo" }).click();
    await page.getByRole("option", { name: "Mes anterior" }).click();
    const lastMonth = [
      new Date(today.getFullYear(), today.getMonth() - 1, 1),
      new Date(today.getFullYear(), today.getMonth(), 0),
    ];
    await expect
      .poll(() => periods.at(-1))
      .toBe(`${ddmmyyyy(lastMonth[0])}-${ddmmyyyy(lastMonth[1])}`);

    // Personalizado muestra las fechas, partiendo del rango anterior.
    await page.getByRole("combobox", { name: "Periodo" }).click();
    await page.getByRole("option", { name: "Personalizado" }).click();
    await expect(page.getByRole("group", { name: "Desde" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Hasta" })).toBeVisible();
  });

  test("fuera de rango: por equipo, a quién y el detalle por persona", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const employee = (
      employeeId: number,
      name: string,
      equipmentId: number,
      equipmentName: string,
      outOfRange: number,
      averageDaysEarly: number | null,
    ) => ({
      employeeId,
      name,
      code: String(employeeId * 100),
      area: "Producción",
      position: "Operador",
      equipmentId,
      equipmentName,
      deliveries: 3,
      outOfRange,
      averageDaysEarly,
      lastDelivery: "2026-10-20",
    });
    await mockGet(page, "/dashboard/business-intelligence/epp/out-of-range", {
      periodo: { desde: "2026-10-01", hasta: "2026-10-22" },
      byEquipment: [
        {
          equipmentId: 10,
          equipmentName: "E2E Guante",
          deliveries: 6,
          outOfRange: 4,
          employees: 2,
          averageDaysEarly: 8,
        },
        {
          equipmentId: 20,
          equipmentName: "E2E Bota",
          deliveries: 3,
          outOfRange: 1,
          employees: 1,
          averageDaysEarly: 40,
        },
      ],
      byEmployeeEquipment: [
        employee(1, "E2E Ana", 10, "E2E Guante", 1, 5),
        employee(1, "E2E Ana", 20, "E2E Bota", 1, 40),
        employee(2, "E2E Beto", 10, "E2E Guante", 3, 9),
      ],
    });
    await mockGet(page, "/dashboard/business-intelligence/epp/employees/1", {
      periodo: { desde: "2026-10-01", hasta: "2026-10-22" },
      employee: {
        id: 1,
        name: "E2E Ana",
        code: "100",
        area: "Producción",
        position: "Operador",
      },
      deliveries: [
        {
          id: 91,
          date: "2026-10-20",
          equipmentName: "E2E Bota",
          quantity: 1,
          frequencyDays: 365,
          previousDelivery: "2026-03-01",
          outOfRange: true,
          daysEarly: 40,
          registeredBy: "E2E Registró",
        },
        {
          id: 90,
          date: "2026-10-02",
          equipmentName: "E2E Guante",
          quantity: 1,
          frequencyDays: 15,
          previousDelivery: null,
          outOfRange: false,
          daysEarly: null,
          registeredBy: "E2E Registró",
        },
      ],
    });
    await openAnalysis(page, false);
    await page.getByRole("tab", { name: "Fuera de rango" }).click();

    await expect(
      page.getByText("Equipos más entregados fuera de rango"),
    ).toBeVisible();
    const ranking = page.getByRole("region", {
      name: "Colaboradores con más entregas fuera de rango",
    });
    const names = () =>
      ranking.getByRole("row").filter({ hasText: "E2E" }).allInnerTexts();

    // Todos los equipos: Beto (3) antes que Ana (2).
    await expect.poll(async () => (await names()).length).toBe(2);
    expect((await names())[0]).toContain("E2E Beto");

    // Elegir un equipo filtra a quién se le entregó.
    await ranking.getByRole("combobox", { name: "Equipo" }).click();
    await page.getByRole("option", { name: "E2E Bota" }).click();
    await expect.poll(async () => (await names()).length).toBe(1);
    expect((await names())[0]).toContain("E2E Ana");
    await ranking.getByRole("combobox", { name: "Equipo" }).click();
    await page.getByRole("option", { name: "Todos los equipos" }).click();

    // Búsqueda por nombre.
    await ranking.getByLabel("Buscar colaborador").fill("beto");
    await expect.poll(async () => (await names()).length).toBe(1);
    await ranking.getByLabel("Buscar colaborador").fill("");

    // Detalle de la persona: qué equipos pide y cuánto antes.
    await ranking.getByRole("row", { name: "Ver detalle de E2E Ana" }).click();
    const dialog = page.getByRole("dialog", { name: /E2E Ana/ });
    await expect(
      dialog.getByText("Fuera de rango · 40 días antes"),
    ).toBeVisible();
    await expect(dialog.getByText("E2E Registró").first()).toBeVisible();
    await expect(dialog).toContainText("1 de 2 entregas fuera de rango");
    await dialog.getByRole("button", { name: "Cerrar" }).click();
    await expect(dialog).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("sin frecuencias de entrega oculta lo de fuera de rango (como México)", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    let outOfRangeRequested = false;
    page.on("request", (request) => {
      if (request.url().includes("/business-intelligence/epp/out-of-range"))
        outOfRangeRequested = true;
    });
    await openAnalysis(page, true, false);

    await expect(
      page.getByText(/no tiene frecuencia de entrega/),
    ).toBeVisible();
    await expect(page.getByRole("tab")).toHaveText(["Gasto", "Entregas"]);
    // exact: el aviso también menciona "entregas fuera de rango".
    await expect(
      page.getByText("Entregas fuera de rango", { exact: true }),
    ).toHaveCount(0);

    // En "Entregas" no está la gráfica en rango / fuera de rango.
    await page.getByRole("tab", { name: "Entregas" }).click();
    await expect(
      page.getByText("Colaboradores con entrega por mes"),
    ).toBeVisible();
    await expect(
      page.getByText("Entregas en rango vs fuera de rango"),
    ).toHaveCount(0);
    expect(outOfRangeRequested).toBe(false);
    expect(errors).toEqual([]);
  });

  test("sin precios ni frecuencias: un solo aviso con ambos motivos", async ({
    page,
  }) => {
    await openAnalysis(page, false, false);

    await expect(
      page.getByText(/no tienen precio ni frecuencia de entrega/),
    ).toBeVisible();
    // Solo avisos de MUI (Next.js agrega su propio role="alert").
    await expect(page.locator(".MuiAlert-root")).toHaveCount(1);
    await expect(page.getByRole("tab")).toHaveText(["Entregas"]);
  });
});
