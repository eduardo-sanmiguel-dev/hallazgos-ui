import type { Page } from "@playwright/test";

import { mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import { pickMany, recordCount, sessionPlants } from "./support/ui";

// Nombre de los archivos descargados: se toma de Content-Disposition y, si no
// sirve, se arma uno de respaldo. Las descargas devuelven un archivo fijo.

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Responde la descarga con el Content-Disposition dado (o sin él). */
const serveDownload = (page: Page, path: RegExp, disposition?: string) =>
  page.route(path, (route) =>
    route.fulfill({
      status: 200,
      contentType: XLSX,
      headers: {
        "access-control-expose-headers": "Content-Disposition",
        ...(disposition && { "content-disposition": disposition }),
      },
      body: Buffer.from("PK e2e"),
    }),
  );

/** Total del diálogo del Excel (lista con limit=1): fijo, sin depender de la base. */
const mockExportCount = (page: Page, count = 5) =>
  mockGet(
    page,
    "/evidences",
    { data: [], count },
    { when: (url) => url.searchParams.get("limit") === "1" },
  );

/** Botón Excel → diálogo de planta y período → Descargar. */
const downloadExcel = async (page: Page) => {
  await page.getByRole("button", { name: "Excel" }).click();
  const dialog = page.getByRole("dialog", { name: "Descargar Excel de hallazgos" });
  await expect(dialog.getByText(/Se exportarán/)).toBeVisible();
  await dialog.getByRole("button", { name: "Descargar" }).click();
  return dialog;
};

const CASES: Array<[string, string | undefined, RegExp]> = [
  [
    "nombre UTF-8 del back",
    "attachment; filename*=UTF-8''Hallazgos%20%C3%A1rea.xlsx",
    /^Hallazgos área\.xlsx$/,
  ],
  ["nombre simple del back", 'attachment; filename="Reporte_E2E.xlsx"', /^Reporte_E2E\.xlsx$/],
  // Mal codificado: se usa filename=.
  [
    "nombre mal codificado",
    "attachment; filename*=UTF-8''%E0%A4%A.xlsx; filename=\"Respaldo.xlsx\"",
    /^Respaldo\.xlsx$/,
  ],
  [
    "extensión distinta",
    'attachment; filename="Reporte.csv"',
    /^Hallazgos_\d{4}-\d{2}-\d{2}_\d{4}_UTC[+-]\d{2}/,
  ],
  ["sin header", undefined, /^Hallazgos_\d{4}-\d{2}-\d{2}_\d{4}_UTC[+-]\d{2}/],
];

test.describe("Nombres de descarga", () => {
  for (const [name, disposition, expected] of CASES) {
    test(`Excel de hallazgos: ${name}`, async ({ page }) => {
      await serveDownload(page, /\/api\/v1\/evidences\/download\/xlsx/, disposition);
      await page.goto("/hallazgos");
      await expect.poll(() => recordCount(page), { timeout: 30_000 }).toBeGreaterThan(0);
      await mockExportCount(page);

      const download = page.waitForEvent("download");
      const dialog = await downloadExcel(page);
      expect((await download).suggestedFilename()).toMatch(expected);
      // Al terminar la descarga, el diálogo se cierra.
      await expect(dialog).toBeHidden();
    });
  }

  test("Excel de una inspección de extintores sin header", async ({ page }) => {
    await serveDownload(page, /\/api\/v1\/extinguisher-inspections\/download\/file\/\d+/);
    // Una inspección fija en la lista (la base puede no tener ninguna).
    await page.route(
      (url) =>
        url.pathname.endsWith("/api/v1/extinguisher-inspections") && url.searchParams.has("page"),
      (route) =>
        route.fulfill({
          json: {
            data: [
              {
                id: 9600,
                inspectionDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                manufacturingPlant: { id: 1, name: "Planta" },
                responsible: { id: 1, name: "E2E Responsable" },
                createdBy: null,
                evaluations: [],
              },
            ],
            count: 1,
          },
        }),
    );
    await page.goto("/extinguisher-inspection");
    const button = page.getByRole("button", { name: "Descargar Excel" }).first();
    const download = page.waitForEvent("download");
    await button.click();
    expect((await download).suggestedFilename()).toMatch(/^RGOSGSST49_\d+\.xlsx$/);
  });

  test("Excel de hallazgos: propone los últimos 90 días, muestra el total y sin registros no descarga", async ({
    page,
  }) => {
    await serveDownload(page, /\/api\/v1\/evidences\/download\/xlsx/);
    await page.goto("/hallazgos");
    await expect.poll(() => recordCount(page), { timeout: 30_000 }).toBeGreaterThan(0);
    const ddMmYyyy = (date: Date) =>
      `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 89);

    // Sin registros: el diálogo lo dice y no deja descargar.
    await mockExportCount(page, 0);
    await page.getByRole("button", { name: "Excel" }).click();
    const dialog = page.getByRole("dialog", { name: "Descargar Excel de hallazgos" });
    await expect(
      dialog.getByText("No hay hallazgos con esta planta, período y filtros."),
    ).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Descargar" })).toBeDisabled();
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toBeHidden();

    // Con registros: muestra el total y descarga los últimos 90 días. Se
    // recarga porque el total se guarda un momento; la ruta más nueva manda.
    await mockExportCount(page, 1234);
    await page.reload();
    await expect.poll(() => recordCount(page), { timeout: 30_000 }).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Excel" }).click();
    await expect(dialog.getByText("Se exportarán 1,234 hallazgos.")).toBeVisible();
    const request = page.waitForRequest((r) => r.url().includes("/download/xlsx"));
    await dialog.getByRole("button", { name: "Descargar" }).click();
    const url = new URL((await request).url());
    expect(url.searchParams.get("startDate")).toBe(ddMmYyyy(start));
    expect(url.searchParams.get("endDate")).toBe(ddMmYyyy(today));
  });

  test("Excel de hallazgos: con el período incompleto se bloquea en la pantalla, sin llamar a la API", async ({
    page,
  }) => {
    await page.goto("/hallazgos");
    await expect.poll(() => recordCount(page), { timeout: 30_000 }).toBeGreaterThan(0);
    await mockExportCount(page);
    await page.getByRole("button", { name: "Excel" }).click();
    const dialog = page.getByRole("dialog", { name: "Descargar Excel de hallazgos" });
    await expect(dialog.getByText(/Se exportarán/)).toBeVisible();

    // Desde aquí no debe salir ni el conteo ni la descarga.
    const calls: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.pathname.includes("/download/xlsx") || url.searchParams.get("limit") === "1")
        calls.push(request.url());
    });

    // Borrar la fecha de inicio (todas las secciones del campo).
    const start = dialog.getByRole("group", { name: "Fecha inicio" });
    await start.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.press("Backspace");

    await expect(dialog.getByText("Seleccione la fecha de inicio y la de fin")).toBeVisible();
    const button = dialog.getByRole("button", { name: "Descargar" });
    await expect(button).toBeDisabled();
    await button.click({ force: true });
    await page.waitForTimeout(500);
    expect(calls).toEqual([]);
  });

  test("Excel y PDF de hallazgos llevan todos los filtros", async ({ page }) => {
    await serveDownload(page, /\/api\/v1\/evidences\/download\/(xlsx|pdf)/);
    await page.goto("/hallazgos");
    const [plant] = await sessionPlants(page);
    // Catálogos fijos: cada filtro depende del anterior y la base de
    // desarrollo puede no tener, por ejemplo, tipos en su primera
    // clasificación. Solo se valida que la descarga lleve los filtros.
    await mockGet(page, "/main-types", [
      {
        id: 9701,
        name: "E2E Clasificación",
        isActive: true,
        secondaryTypes: [{ id: 9711, name: "E2E Tipo", isActive: true }],
      },
    ]);
    await mockGet(page, "/zones", [
      {
        id: 9721,
        name: "E2E Lugar",
        manufacturingPlant: { id: plant.id, name: plant.name },
        area: { id: 9731, name: "E2E Zona" },
      },
    ]);
    await mockGet(page, "/users", [
      { id: 9741, name: "E2E Responsable", email: "e2e-resp@example.com" },
    ]);
    await page.goto(
      `/hallazgos?manufacturingPlantId=${plant.id}&startDate=01/01/2026&endDate=31/12/2026`,
    );
    await mockExportCount(page);
    // Cada filtro depende del anterior: se eligen en orden desde la pantalla.
    for (const label of ["Clasificación", "Tipo", "Zonas", "Lugar", "Responsables"]) {
      await pickMany(page, label);
    }
    await pickMany(page, "Estatus", 2);

    for (const ids of ["5", "5,6"]) {
      await page.getByLabel("ID(s)").fill(ids);
      // Los IDs se aplican tras una pausa.
      await page.waitForTimeout(1200);
      const request = page.waitForRequest((r) => r.url().includes("/download/xlsx"));
      const download = page.waitForEvent("download");
      await downloadExcel(page);
      const url = new URL((await request).url());
      await download;
      expect(url.searchParams.get(ids.includes(",") ? "ids" : "id")).toBe(ids);
      for (const param of [
        "manufacturingPlantId",
        "startDate",
        "endDate",
        "mainTypeIds",
        "secondaryTypeIds",
        "areaIds",
        "zoneIds",
        "responsibleIds",
        "statuses",
      ]) {
        expect(url.searchParams.get(param), param).toBeTruthy();
      }
    }

    // El PDF se nombra como el Excel. Sin header, el respaldo con la hora
    // local (antes, siempre "Hallazgos.pdf").
    const pdfRequest = page.waitForRequest((r) => r.url().includes("/download/pdf"));
    const pdf = page.waitForEvent("download");
    await page.getByRole("button", { name: "PDF" }).click();
    expect(new URL((await pdfRequest).url()).searchParams.get("timeZone")).toBeTruthy();
    expect((await pdf).suggestedFilename()).toMatch(
      /^Hallazgos_\d{4}-\d{2}-\d{2}_\d{4}_UTC[+-]\d{2}.*\.pdf$/,
    );

    // Con el nombre del back (misma lógica que el Excel), se usa ese.
    await serveDownload(
      page,
      /\/api\/v1\/evidences\/download\/pdf/,
      "attachment; filename*=UTF-8''Hallazgos_Tepotzotl%C3%A1n_%2B2filtros_2026-10-29_0930_UTC-06.pdf",
    );
    const named = page.waitForEvent("download");
    await page.getByRole("button", { name: "PDF" }).click();
    expect((await named).suggestedFilename()).toBe(
      "Hallazgos_Tepotzotlán_+2filtros_2026-10-29_0930_UTC-06.pdf",
    );
  });
});
