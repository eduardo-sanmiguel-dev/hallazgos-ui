import { expect, test } from "./support/fixtures";
import { pickOption } from "./support/ui";
import { captureWrites } from "./support/api";

const catalogs = [
  "users",
  "employees",
  "manufacturing-plants",
  "zones",
  "areas",
  "processes",
  "main-types",
  "secondary-types",
  "equipments",
  "emergency-teams",
  "gemba-walk-zones",
  "gemba-walk-observers",
  "gemba-walk-calendar",
  "gemba-walk-evaluations",
];
for (const catalog of catalogs) {
  test(`${catalog}: muestra inactivos con Reactivar y activos con Editar/Eliminar`, async ({
    page,
  }) => {
    const path = "/" + catalog.replace("gemba-walk-", "gemba-walk/");
    const person = { id: 1, name: "Usuario prueba", email: "user@hallazgos.test", isActive: true };
    const plant = { id: 1, name: "Planta prueba", isActive: true };
    const record = {
      id: 99331,
      name: "Registro prueba",
      code: 99331,
      email: "inactive@hallazgos.test",
      role: "General",
      isActive: false,
      manufacturingPlant: plant,
      manufacturingPlants: [plant],
      mainType: { id: 1, name: "Criterio", isActive: true },
      secondaryTypes: [],
      createdBy: person,
      updatedBy: null,
      createdAt: "2026-01-01T12:00:00Z",
      updatedAt: "2026-01-01T12:00:00Z",
      area: catalog === "gemba-walk-evaluations" ? "EPP" : { id: 1, name: "Zona" },
      position: null,
      gender: null,
      costHistory: [],
      deliveryFrequency: 30,
      typeResponsible: "Seguridad",
      requiresEvidence: true,
      location: "Almacén",
      extinguisherNumber: "E-1",
      typeOfExtinguisher: "PQS",
      capacity: 5,
      nameZone: "Zona prueba",
      nameLocation: "Lugar prueba",
      user: person,
      gembaWalkZone: { id: 1, nameZone: "Zona", nameLocation: "Lugar", manufacturingPlant: plant },
      scheduledAt: "2099-01-01T12:00:00Z",
      isAdditional: true,
      category: "SHE",
      description: "Concepto",
      lat: 1,
      lng: 1,
      link: "https://test.com",
    };
    const queries: URL[] = [];
    await page.route(
      (url) => url.pathname.endsWith("/api/v1" + path),
      (route) => {
        if (route.request().method() !== "GET") return route.fallback();
        const url = new URL(route.request().url());
        queries.push(url);
        return route.fulfill({
          json: url.searchParams.has("page") ? { data: [record], count: 1 } : [],
        });
      },
    );
    const writes = await captureWrites(page, {
      respond: () => {
        record.isActive = true;
        return { id: record.id, isActive: true };
      },
    });
    await page.goto(path);
    await expect(page.getByText("Inactivo", { exact: true })).toBeVisible();
    await expect(page.getByText("Editar", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Eliminar", { exact: true })).toHaveCount(0);
    await page.getByText("Reactivar", { exact: true }).click();
    await page
      .getByRole("dialog", { name: "Reactivar registro" })
      .getByRole("button", { name: "Reactivar", exact: true })
      .click();
    await expect(page.getByText("Activo", { exact: true })).toBeVisible();
    await expect(page.getByText("Editar", { exact: true })).toBeVisible();
    await expect(page.getByText("Reactivar", { exact: true })).toHaveCount(0);
    expect(writes.map(({ method, path }) => ({ method, path }))).toEqual([
      { method: "PATCH", path: `/catalogs/${catalog}/${record.id}/activate` },
    ]);
    expect(
      queries
        .filter((url) => url.searchParams.has("page"))
        .every((url) => url.searchParams.get("includeInactive") === "true"),
    ).toBe(true);
  });
}

test("colaboradores: puede volver de Inactivos a Todos", async ({ page }) => {
  const queries: URL[] = [];
  await page.route(
    (url) => url.pathname.endsWith("/api/v1/employees"),
    (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      queries.push(new URL(route.request().url()));
      return route.fulfill({ json: { data: [], count: 0 } });
    },
  );
  await page.goto("/employees");
  await pickOption(page, "Estado", /^Inactivos$/);
  await expect.poll(() => queries.at(-1)?.searchParams.get("isActive")).toBe("false");
  await pickOption(page, "Estado", /^Todos$/);
  await expect.poll(() => queries.at(-1)?.searchParams.get("isActive")).toBe(null);
  expect(queries.at(-1)?.searchParams.get("includeInactive")).toBe("true");
});
