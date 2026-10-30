import { readFileSync } from "node:fs";

import type { Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";
import {
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

    // Desde el inicio del año, para que haya datos: el atajo "Este año" del
    // control de periodo (antes, dos fechas sueltas).
    const year = new Date().getFullYear();
    const filterRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/dashboard/") &&
        request.url().includes(`startDate=01%2F01%2F${year}`),
    );
    await pickOption(page, "Periodo", "Este año");
    await filterRequest;
    // Un solo filtro "Periodo" (antes, "Desde" y "Hasta").
    await expect(
      page.getByRole("region", { name: "Filtros" }).getByText("Este año"),
    ).toBeVisible();
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
    await expect(
      page.getByRole("button", { name: "Mapa de calor" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Histórico" }).click();
    const back = page.getByRole("button", { name: "Regresar" });
    await expect(back).toBeVisible();
    await page.waitForLoadState("networkidle");
    await back.click();
    await expect(page.getByRole("button", { name: "Histórico" })).toBeVisible();
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
    // Un PDF de verdad, con todas las gráficas: 2 por página como máximo
    // (una alta puede ocupar su propia página).
    const pdf = readFileSync(await download.path());
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    const visible = await page.locator("[data-dashboard-export=chart]").count();
    const pages = pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? [];
    expect(visible).toBeGreaterThan(0);
    expect(pages.length).toBeGreaterThanOrEqual(Math.ceil(visible / 2));
    expect(pages.length).toBeLessThanOrEqual(visible);
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

// Al entrar ya se ven datos (M5) y la pantalla tiene un solo aviso (sin
// planta, sin hallazgos o error) en lugar de uno por gráfica.
const ddmmyyyy = (date: Date) =>
  [date.getDate(), date.getMonth() + 1]
    .map((n) => String(n).padStart(2, "0"))
    .concat(String(date.getFullYear()))
    .join("/");
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - (days - 1));
  return ddmmyyyy(date);
};

/** Peticiones de estatus (la que decide el estado de la pantalla). */
const statusRequests = (page: Page) => {
  const urls: URL[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.endsWith("/api/v1/dashboard/status-by-filters")) {
      urls.push(url);
    }
  });
  return urls;
};

const charts = (page: Page) => page.locator("[data-dashboard-export=chart]");

test.describe("Dashboard: al entrar y estado de la pantalla", () => {
  test("por omisión, los últimos 30 días; con varias plantas pide elegir una y la recuerda", async ({
    page,
  }) => {
    const requests = statusRequests(page);
    await page.goto("/dashboard");
    const plants = await sessionPlants(page);
    test.skip(plants.length < 2, "El usuario de pruebas tiene una planta");

    // Sin planta: un solo aviso, sin gráficas ni consultas.
    await expect(page.getByText("Elige una planta")).toBeVisible();
    await expect(charts(page)).toHaveCount(0);
    expect(requests).toHaveLength(0);

    // Con o sin hallazgos en la base de desarrollo: se revisa la consulta.
    await pickOption(page, "Planta", plants[1].name);
    await expect.poll(() => requests.length).toBeGreaterThan(0);
    expect(requests[0].searchParams.get("startDate")).toBe(daysAgo(30));
    expect(requests[0].searchParams.get("endDate")).toBe(ddmmyyyy(new Date()));

    // Al volver se propone la última planta elegida en este dispositivo.
    const before = requests.length;
    await page.goto("/dashboard");
    await expect
      .poll(() => requests[before]?.searchParams.get("manufacturingPlantId"))
      .toBe(String(plants[1].id));
    await expect(page.getByText("Elige una planta")).toHaveCount(0);
  });

  test("sin hallazgos en el periodo: un solo aviso y se puede ampliar a 3 meses", async ({
    page,
  }) => {
    const requests = statusRequests(page);
    await page.route(
      (url) => url.pathname.endsWith("/api/v1/dashboard/status-by-filters"),
      (route) =>
        route.fulfill({
          json: {
            total: 0,
            seriesData: [],
          },
        }),
    );
    await choosePlantAndWait(page);

    await expect(page.getByText("Sin hallazgos en este periodo")).toBeVisible();
    await expect(charts(page)).toHaveCount(0);
    // Sin gráficas no hay informe que descargar.
    await expect(
      page.getByRole("button", { name: "Descargar informe PDF" }),
    ).toHaveCount(0);
    // Antes cada gráfica decía lo suyo.
    await expect(
      page.getByText("Seleccione planta, fecha inicio y fecha fin"),
    ).toHaveCount(0);

    // El atajo "Últimos 3 meses" del control de periodo (antes, 90 días).
    await page.getByRole("button", { name: "Ver últimos 3 meses" }).click();
    const today = new Date();
    await expect
      .poll(() => requests.at(-1)?.searchParams.get("startDate"))
      .toBe(ddmmyyyy(new Date(today.getFullYear(), today.getMonth() - 2, 1)));
    await expect(page.getByRole("combobox", { name: "Periodo" })).toHaveText(
      "Últimos 3 meses",
    );
  });

  test("encabezado con el periodo y su comparación, e indicadores con su variación", async ({
    page,
  }) => {
    // Últimos 30 días (por omisión) contra los 30 previos, como el análisis
    // EPP; la API calcula la comparación.
    const iso = (date: Date) =>
      [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");
    const shift = (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() - days);
      return date;
    };
    const series = (open: number, inProgress: number, closed: number) => [
      { name: "Abierto", y: open },
      { name: "En progreso", y: inProgress },
      { name: "Cerrado", y: closed },
      { name: "Cancelado", y: 0 },
    ];
    await page.route(
      (url) => url.pathname.endsWith("/api/v1/dashboard/status-by-filters"),
      (route) =>
        route.fulfill({
          json: {
            total: 10,
            seriesData: series(4, 1, 5),
            periodo: {
              actual: { desde: iso(shift(29)), hasta: iso(shift(0)) },
              anterior: { desde: "2020-01-01", hasta: "2020-01-30" },
            },
            anterior: { total: 8, seriesData: series(6, 0, 2) },
          },
        }),
    );
    await choosePlantAndWait(page);

    // Título visible (antes solo para lectores de pantalla) y la leyenda.
    await expect(
      page.getByRole("heading", { level: 1, name: "Dashboard de hallazgos" }),
    ).toBeVisible();
    await expect(page.getByText(/ comparado con 1–30 ene 2020$/)).toBeVisible();

    const indicators = page.getByRole("region", {
      name: "Indicadores del periodo",
    });
    const tile = (label: string) =>
      indicators
        .locator(".MuiPaper-root")
        .filter({ has: page.getByText(label, { exact: true }) });
    await expect(tile("Hallazgos")).toContainText("10");
    await expect(tile("Hallazgos")).toContainText("25.0%");
    // Abiertos bajan (6 → 4): bueno, en verde.
    await expect(
      tile("Abiertos").getByLabel("Bajó 33.3% contra 1–30 ene 2020"),
    ).toBeVisible();
    // % de cierre: 50 % contra 25 %, en puntos.
    await expect(tile("% de cierre")).toContainText("50.0%");
    await expect(tile("% de cierre")).toContainText("25.0 pts");
    await expect(tile("% de cierre")).toContainText("5 de 10 cerrados");
  });

  test("si falla la consulta: un solo error con Reintentar", async ({
    page,
  }) => {
    let fail = true;
    await page.route(
      (url) => url.pathname.endsWith("/api/v1/dashboard/status-by-filters"),
      (route) =>
        fail
          ? route.fulfill({ status: 500, json: { statusCode: 500 } })
          : route.fallback(),
    );
    await choosePlantAndWait(page);

    const error = page
      .getByRole("alert")
      .filter({ hasText: "No se pudo cargar" });
    await expect(error).toHaveCount(1);
    await expect(charts(page)).toHaveCount(0);

    fail = false;
    await error.getByRole("button", { name: "Reintentar" }).click();
    await expect(charts(page).first()).toBeVisible();
  });

  test.describe("en celular", () => {
    test.use({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });

    test("los filtros no quedan fijos, nada se desplaza de lado y las donas no cortan etiquetas", async ({
      page,
    }) => {
      await choosePlantAndWait(page);
      await expect(charts(page).first()).toBeVisible();

      const bar = page.getByRole("region", { name: "Filtros" });
      const position = await bar.evaluate(
        (element) => getComputedStyle(element.parentElement!).position,
      );
      expect(position).not.toBe("sticky");

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);

      // Dona de estatus: la leyenda lleva cantidad y porcentaje, y no hay
      // etiquetas afuera de la dona.
      const status = charts(page).first();
      await expect(status.locator(".highcharts-legend")).toContainText(
        /\d+ \(\d+%\)/,
      );
      await expect(status.locator(".highcharts-data-label")).toHaveCount(0);
    });
  });
});
