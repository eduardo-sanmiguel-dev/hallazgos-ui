import { expect, test } from "./support/fixtures";

import { trackPageErrors } from "./support/ui";

// Pantallas principales: cargan sin errores de
// JavaScript y sin caer en la pantalla de error.
const ROUTES = [
  "/dashboard",
  "/hallazgos",
  "/ics",
  "/ciael",
  "/epp",
  "/business-intelligence/epp",
  "/gemba-walk",
  "/gemba-walk/calendar",
  "/extinguisher-inspection",
  "/emergency-teams",
  "/hds",
  "/users",
  "/employees",
  "/manufacturing-plants",
  "/zones",
  "/areas",
  "/processes",
  "/main-types",
  "/secondary-types",
  "/equipments",
];

for (const route of ROUTES) {
  test(`carga ${route}`, async ({ page }) => {
    const errors = trackPageErrors(page);

    const response = await page.goto(route);
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL(new RegExp(`${route}$`));

    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByText("No se pudo mostrar esta página")).toHaveCount(
      0,
    );
    // Deja terminar las peticiones iniciales.
    await page.waitForLoadState("networkidle");

    expect(errors).toEqual([]);
  });
}
