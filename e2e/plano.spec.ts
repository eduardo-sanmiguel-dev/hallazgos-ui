import type { Page } from "@playwright/test";

import { captureWrites, mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import { pickOption, sessionPlants, toast, trackPageErrors } from "./support/ui";

// Plano de la planta: marcar la ubicación de una zona (formulario de zonas) y
// el mapa de calor del dashboard con puntos fijos.

const plano = (page: Page) => page.getByRole("img", { name: /plano/i }).first();

const heatPoint = (
  areaId: number,
  open: number,
  zoomLevel: number | null = 1,
) => ({
  areaId,
  areaName: `E2E Zona ${areaId}`,
  x: 200 + areaId * 40,
  y: 150 + areaId * 20,
  zoomLevel,
  value: open + 1,
  dominantStatus: "Abierto",
  statusCounts: { Abierto: open, "En progreso": 1, Cerrado: 0, Cancelado: 0 },
});

const heatmap = (points: ReturnType<typeof heatPoint>[]) => ({
  startDate: "01/01/2026",
  endDate: "31/12/2026",
  totalAreas: points.length,
  totalEvidences: points.length * 3,
  totalOpenEvidences: points.reduce((sum, p) => sum + p.statusCounts.Abierto, 0),
  totalOpenEvidencesWithCoordinates: points.length,
  maxX: 1000,
  maxY: 800,
  maxValue: 10,
  points,
});

test.describe("Plano", () => {
  test("marca la ubicación de una zona nueva (sin guardar)", async ({ page }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);
    await page.goto("/areas/form");
    await page.getByLabel("Nombre").fill("E2E Zona con ubicación");
    const [plant] = await sessionPlants(page);
    await pickOption(page, "Planta", plant.name);

    await expect(page.getByText("Haz click sobre la imagen para marcar un punto")).toBeVisible();
    await page.getByRole("button", { name: "Acercar" }).click();
    await page.getByRole("button", { name: "Alejar" }).click();
    await page.getByRole("button", { name: "Reset" }).click();

    // La rueda del mouse acerca y aleja.
    const image = plano(page);
    const box = (await image.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -150);
    await page.mouse.wheel(0, 150);

    // Arrastrar no marca punto; un clic sí.
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 40, { steps: 5 });
    await page.mouse.up();
    await expect(page.getByText("Haz click sobre la imagen para marcar un punto")).toBeVisible();
    // La imagen está bajo la capa que recibe el puntero: clic por coordenadas.
    await page.mouse.click(box.x + box.width / 3, box.y + box.height / 3);
    await expect(page.getByText(/^Punto seleccionado: X \d+, Y \d+, Zoom /)).toBeVisible();

    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(toast(page, "Zona creada correctamente")).toBeVisible();
    expect(writes[0].body).toMatchObject({
      name: "E2E Zona con ubicación",
      coordinateX: expect.any(Number),
      coordinateY: expect.any(Number),
      zoomLevel: expect.any(Number),
    });
    expect(errors).toEqual([]);
  });

  test("muestra el punto guardado al editar una zona", async ({ page }) => {
    const writes = await captureWrites(page);
    await mockGet(page, "/areas/9901", {
      id: 9901,
      name: "E2E Zona ubicada",
      manufacturingPlant: { id: 1, name: "Planta" },
      coordinateX: 320,
      coordinateY: 240,
      zoomLevel: 2,
    });
    await page.goto("/areas/form?id=9901");
    await expect(page.getByText("Punto seleccionado: X 320, Y 240, Zoom 2.00x")).toBeVisible();
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(toast(page, "Zona actualizada correctamente")).toBeVisible();
    expect(writes[0]).toMatchObject({
      method: "PATCH",
      path: "/areas/9901",
      body: { coordinateX: 320, coordinateY: 240, zoomLevel: 2 },
    });
  });

  for (const [name, points] of [
    ["sin puntos abiertos", []],
    ["un punto", [heatPoint(1, 5)]],
    ["dos puntos", [heatPoint(1, 5), heatPoint(2, 2, null)]],
    [
      "varios puntos por intensidad",
      [heatPoint(1, 9), heatPoint(2, 6), heatPoint(3, 3), heatPoint(4, 1), heatPoint(5, 0)],
    ],
  ] as const) {
    test(`mapa de calor con ${name}`, async ({ page }) => {
      const errors = trackPageErrors(page);
      await mockGet(page, "/dashboard/heatmap-by-filters", heatmap([...points]));
      await page.goto("/dashboard");
      const [plant] = await sessionPlants(page);
      await pickOption(page, "Planta", plant.name);
      await page.getByRole("button", { name: "Mapa de calor" }).click();

      if (!points.length) {
        await expect(
          page.getByText("No hay hallazgos abiertos con coordenadas"),
        ).toBeVisible();
      } else {
        const image = plano(page);
        await expect(image).toBeVisible();
        const box = (await image.boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, -150);
        await page.mouse.wheel(0, 150);
      }
      expect(errors).toEqual([]);
    });
  }
});
