import type { Page } from "@playwright/test";

import { mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import { sessionPlants } from "./support/ui";

// Usuarios con reglas especiales por correo (solo HDS, EPP, dashboard
// restringido) y fallas al consultar permisos. La sesión se simula.

const asUser = async (page: Page, email: string, role = "General") => {
  await mockGet(page, "/users/get-information-current-user", {
    id: 7201,
    name: "E2E Especial",
    email,
    role,
    isActive: true,
    manufacturingPlants: [{ id: 1, name: "Planta" }],
    zones: [],
  });
};

const nav = (page: Page) =>
  page.getByRole("navigation", { name: "Menú principal" });

test.describe("Usuarios especiales", () => {
  test("el usuario de HDS solo ve HDS y el dashboard lo redirige", async ({
    page,
  }) => {
    await asUser(page, "cosmeticostrujillo0023@gmail.com");
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/hds$/);
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(
      nav(page).getByRole("button", { name: "Hojas de datos de seguridad" }),
    ).toBeVisible();
    await expect(nav(page).getByRole("button", { name: "Hallazgos" })).toHaveCount(0);
  });

  test("el usuario de EPP ve EPP y extintores, no HDS", async ({ page }) => {
    await asUser(page, "malonso@hadainternational.com");
    await page.goto("/epp");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(
      nav(page).getByRole("button", { name: "Inspección de extintores" }),
    ).toBeVisible();
    await expect(
      nav(page).getByRole("button", { name: "Hojas de datos de seguridad" }),
    ).toHaveCount(0);
  });

  test("el dashboard restringido oculta clasificaciones de comportamiento", async ({
    page,
  }) => {
    await asUser(page, "glora@hadainternational.com", "Administrador");
    await page.goto("/dashboard");
    await page.getByRole("combobox", { name: "Clasificación" }).click();
    const options = page.getByRole("listbox").getByRole("option");
    await expect(options.first()).toBeVisible();
    await expect(
      options.filter({ hasText: /^Comportamiento inseguro$|^Condición insegura$/ }),
    ).toHaveCount(0);
  });

  test("si falla la consulta de acceso a Gemba Walk se oculta el módulo", async ({
    page,
  }) => {
    await asUser(page, "e2e-general@example.com");
    await mockGet(page, "/gemba-walk/walks/access", { message: "Error" }, { status: 500 });
    await page.goto("/hallazgos");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(
      nav(page).getByRole("button", { name: "Gemba Walk - Recorridos" }),
    ).toHaveCount(0);
  });

  test("hallazgos funciona aunque falle la configuración de permisos", async ({
    page,
  }) => {
    await mockGet(page, "/evidences/permissions/config", { message: "Error" }, { status: 500 });
    await page.goto("/hallazgos");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await sessionPlants(page);
  });
});
