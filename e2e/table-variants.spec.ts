import type { Page } from "@playwright/test";

import { captureWrites, mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import { toast, trackPageErrors } from "./support/ui";

// Tablas con filas de casos extremos (datos completos y faltantes), servidas
// como la respuesta paginada del API.

const servePage = (page: Page, path: string, data: unknown[]) =>
  page.route(
    (url) => url.pathname.endsWith(`/api/v1${path}`) && url.searchParams.has("page"),
    (route) =>
      route.request().method() === "GET"
        ? route.fulfill({ json: { data, count: data.length } })
        : route.fallback(),
  );

const walk = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  startedAt: new Date().toISOString(),
  performedAt: new Date().toISOString(),
  durationSeconds: 3725,
  isActive: true,
  gembaWalkCalendar: {
    id: id + 1,
    scheduledAt: new Date().toISOString(),
    isAdditional: true,
    gembaWalkZone: {
      id: 1,
      nameZone: "E2E Zona",
      nameLocation: "Pasillo",
      manufacturingPlant: { id: 1, name: "Planta" },
    },
  },
  results: [
    { id: 1, area: "EPP", category: "SHE", description: "x", isCompliant: true },
    { id: 2, area: "Orden", category: "CALIDAD", description: "y", isCompliant: false },
  ],
  createdBy: { id: 1, name: "E2E Observador", email: "e2e@example.com" },
  ...overrides,
});

test.describe("Tablas con casos extremos", () => {
  test("recorridos de Gemba Walk completos e incompletos", async ({ page }) => {
    const errors = trackPageErrors(page);
    await servePage(page, "/gemba-walk/walks", [
      walk(9501),
      walk(9502, {
        durationSeconds: null,
        results: [],
        createdBy: null,
        gembaWalkCalendar: {
          id: 9503,
          scheduledAt: new Date().toISOString(),
          isAdditional: false,
          gembaWalkZone: null,
        },
      }),
    ]);
    await mockGet(page, "/gemba-walk/walks/9501", walk(9501));
    await page.goto("/gemba-walk");

    const complete = page.getByRole("row").filter({ hasText: "E2E Observador" });
    await expect(complete).toContainText("C: 1");
    await expect(complete).toContainText("NC: 1");
    await expect(complete).toContainText("50%");
    const empty = page.getByRole("row").filter({ hasText: "9502" });
    await expect(empty).toContainText("0%");

    await complete.getByRole("button", { name: "Ver" }).click();
    await expect(page).toHaveURL(/\/gemba-walk\/view\?id=9501$/);
    expect(errors).toEqual([]);
  });

  test("colaboradores activos e inactivos con datos faltantes", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    await servePage(page, "/employees", [
      {
        id: 9601,
        code: 601,
        name: "E2E Activo",
        isActive: true,
        birthdate: "1990-03-15T00:00:00.000Z",
        dateOfAdmission: "2020-02-01T00:00:00.000Z",
        area: { id: 1, name: "E2E Área" },
        position: { id: 1, name: "E2E Puesto" },
        gender: { id: 1, name: "E2E Género" },
        manufacturingPlants: [{ id: 1, name: "Planta" }],
      },
      {
        id: 9602,
        code: 602,
        name: "E2E Inactivo",
        isActive: false,
        birthdate: null,
        dateOfAdmission: null,
        area: null,
        position: null,
        gender: null,
        manufacturingPlants: [],
      },
    ]);
    await page.goto("/employees");
    await expect(page.getByRole("row").filter({ hasText: "E2E Activo" })).toContainText("Activo");
    await expect(page.getByRole("row").filter({ hasText: "E2E Inactivo" })).toContainText("Inactivo");
    expect(errors).toEqual([]);
  });

  test("equipo sin frecuencia de entrega ni precio (sin guardar)", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    const equipment = {
      id: 9701,
      name: "E2E Sin precio",
      deliveryFrequency: null,
      manufacturingPlant: { id: 1, name: "Planta" },
      costHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: { id: 1, name: "E2E Creó" },
      updatedBy: null,
    };
    await servePage(page, "/equipments", [equipment]);
    await mockGet(page, "/equipments/9701", equipment);
    await page.goto("/equipments");

    await page.getByRole("button", { name: "Editar" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Editar equipo" });
    await expect(dialog.getByLabel("Nombre")).toHaveValue("E2E Sin precio");
    await expect(dialog.getByLabel("Precio")).toHaveValue("");
    await dialog.getByRole("button", { name: "Guardar" }).click();
    await expect(toast(page, "Equipo actualizado correctamente")).toBeVisible();
    expect(writes[0]).toMatchObject({
      method: "PATCH",
      path: "/equipments/9701",
      body: { deliveryFrequency: null, price: null },
    });
  });
});
