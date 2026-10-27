import type { Page } from "@playwright/test";

import { mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";

// Entrar por URL directa a una página que el menú no le muestra al usuario:
// se ve "sin acceso" en vez de una pantalla vacía o con errores. Solo es UI;
// el API sigue validando cada petición. La sesión se simula.

const asUser = async (page: Page, email: string, role = "General") => {
  await mockGet(page, "/users/get-information-current-user", {
    id: 7301,
    name: "E2E Acceso",
    email,
    role,
    isActive: true,
    manufacturingPlants: [{ id: 1, name: "Planta" }],
    zones: [],
  });
};

const noAccess = (page: Page) =>
  page.getByText("No tienes acceso a esta sección");

test.describe("Acceso por URL directa", () => {
  for (const route of [
    "/users",
    "/users/form",
    "/employees",
    "/ics",
    "/ciael",
    "/epp",
    "/gemba-walk/zones/form",
    "/business-intelligence/epp",
  ]) {
    test(`un usuario general no ve ${route}`, async ({ page }) => {
      const tableRequests: string[] = [];
      page.on("request", (request) => {
        if (request.url().includes("page=")) tableRequests.push(request.url());
      });
      await asUser(page, "e2e-general@example.com");
      await page.goto(route);

      await expect(noAccess(page)).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Ir al inicio" }),
      ).toHaveAttribute("href", "/dashboard");
      await expect(page.getByRole("table")).toHaveCount(0);
      // La página no se monta: no consulta su lista.
      expect(tableRequests).toEqual([]);
    });
  }

  test("un usuario general sí entra a hallazgos", async ({ page }) => {
    await asUser(page, "e2e-general@example.com");
    await page.goto("/hallazgos");
    await expect(
      page.getByRole("heading", { level: 1, name: "Hallazgos" }),
    ).toBeVisible();
    await expect(noAccess(page)).toHaveCount(0);
  });

  test("el usuario de EPP entra a EPP pero no a HDS", async ({ page }) => {
    await asUser(page, "malonso@hadainternational.com");
    await page.goto("/hds");
    await expect(noAccess(page)).toBeVisible();

    await page.goto("/epp");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(noAccess(page)).toHaveCount(0);
  });

  test("el usuario de HDS vuelve a HDS desde una página sin acceso", async ({
    page,
  }) => {
    await asUser(page, "cosmeticostrujillo0023@gmail.com");
    await page.goto("/hallazgos");
    await expect(noAccess(page)).toBeVisible();
    await page.getByRole("link", { name: "Ir al inicio" }).click();
    await expect(page).toHaveURL(/\/hds$/);
  });
});
