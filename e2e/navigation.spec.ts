import { mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import { FORCED_THEME } from "../app/seasonalTheme";

// Menú lateral (colapsado, expandido y móvil), tema claro/oscuro y menú
// según el rol del usuario.

test.describe("Navegación", () => {
  test("el menú colapsado abre cada grupo en un menú flotante", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: "Menú principal" });
    await nav.getByRole("button", { name: "General" }).click();
    await page.getByRole("menuitem", { name: "Usuarios" }).click();
    await expect(page).toHaveURL(/\/users$/);

    await nav.getByRole("button", { name: "General" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("el menú expandido despliega grupos y navega", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    const nav = page.getByRole("navigation", { name: "Menú principal" });

    // El grupo va antes que su opción del mismo nombre.
    const group = nav
      .getByRole("button", { name: "Criterios", exact: true })
      .first();
    await group.click();
    await nav.getByRole("button", { name: "Tipos de criterios" }).click();
    await expect(page).toHaveURL(/\/secondary-types$/);
    // El grupo con la página activa queda abierto; se puede cerrar.
    await group.click();
    await group.click();

    await nav.getByRole("button", { name: "Hallazgos" }).click();
    await expect(page).toHaveURL(/\/hallazgos$/);
    await page.getByRole("button", { name: "Cerrar menú" }).click();
    await expect(
      page.getByRole("button", { name: "Abrir menú" }),
    ).toBeVisible();
  });

  test("en móvil el menú es un panel que se cierra al navegar", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    const nav = page.getByRole("navigation", { name: "Menú principal" });
    await nav
      .getByRole("button", { name: "Configuración" })
      .or(nav.getByRole("button", { name: "General" }))
      .first()
      .click();
    await nav.getByRole("button", { name: "Plantas" }).click();
    await expect(page).toHaveURL(/\/manufacturing-plants$/);
    await expect(nav).toBeHidden();
  });

  test("el tema elegido se conserva al recargar", async ({ page }) => {
    test.skip(
      !!FORCED_THEME,
      "Tema forzado temporal (app/seasonalTheme.ts): no hay selector de tema.",
    );
    const themeButton = (label: string) =>
      page.getByRole("button", { name: `Cambiar tema (actual: ${label})` });
    const chooseTheme = async (from: string, to: string) => {
      await themeButton(from).click();
      await page.getByRole("menuitemradio", { name: to }).click();
      await expect(themeButton(to)).toBeVisible();
    };

    await page.goto("/dashboard");
    await chooseTheme("Claro", "Oscuro");
    await page.reload();
    await expect(themeButton("Oscuro")).toBeVisible();

    // Halloween agrega la araña al header.
    await chooseTheme("Oscuro", "Halloween");
    await expect(
      page.getByRole("img", { name: "Araña de Halloween" }),
    ).toBeVisible();
    await page.reload();
    await expect(themeButton("Halloween")).toBeVisible();

    await chooseTheme("Halloween", "Claro");
    await expect(
      page.getByRole("img", { name: "Araña de Halloween" }),
    ).toHaveCount(0);
  });

  for (const role of ["General", "Supervisor"]) {
    test(`un usuario ${role} no ve la configuración de administrador`, async ({
      page,
    }) => {
      await mockGet(page, "/users/get-information-current-user", {
        id: 7101,
        name: `E2E ${role}`,
        email: `e2e-${role.toLowerCase()}@example.com`,
        role,
        isActive: true,
        manufacturingPlants: [{ id: 1, name: "Planta" }],
        zones: [],
      });
      await page.goto("/hallazgos");
      await page.getByRole("button", { name: "Abrir menú" }).click();
      const nav = page.getByRole("navigation", { name: "Menú principal" });
      await expect(
        nav.getByRole("button", { name: "Hallazgos" }),
      ).toBeVisible();
      await expect(nav.getByRole("button", { name: "Usuarios" })).toHaveCount(
        0,
      );
      await expect(
        nav.getByRole("button", { name: "Comportamiento seguro (ICS)" }),
      ).toHaveCount(0);
    });
  }
});
