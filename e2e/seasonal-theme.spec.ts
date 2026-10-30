import { FORCED_THEME } from "../app/seasonalTheme";
import { expect, test } from "./support/fixtures";

// TEMPORAL: tema forzado (app/seasonalTheme.ts, Halloween 2026). Al quitar
// el tema de Halloween se borra este archivo; con FORCED_THEME = null se
// salta solo.

test.skip(!FORCED_THEME, "Sin tema forzado (app/seasonalTheme.ts).");

// Fondo del papel y de la página del tema de Halloween (app/theme.tsx).
const HALLOWEEN_PAPER = "rgb(28, 20, 38)";
const HALLOWEEN_BACKGROUND = "rgb(18, 12, 26)";

test.describe("Tema forzado de temporada", () => {
  test("se usa aunque el usuario haya elegido otro, sin selector y sin tocar su preferencia", async ({
    page,
  }) => {
    // Lo que el usuario eligió antes (se recupera al quitar el forzado).
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("e2e-color-mode")) {
        localStorage.setItem("colorMode", "dark");
        sessionStorage.setItem("e2e-color-mode", "1");
      }
    });
    await page.goto("/dashboard");

    await expect(page.locator("header").first()).toHaveCSS(
      "background-color",
      HALLOWEEN_PAPER,
    );
    await expect(
      page.getByRole("img", { name: "Araña de Halloween" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Cambiar tema/ }),
    ).toHaveCount(0);

    await page.reload();
    await expect(page.locator("header").first()).toHaveCSS(
      "background-color",
      HALLOWEEN_PAPER,
    );
    expect(await page.evaluate(() => localStorage.getItem("colorMode"))).toBe(
      "dark",
    );
  });

  test.describe("sin sesión", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("el login también lo usa", async ({ page }) => {
      await page.goto("/login");
      await expect(page.locator("body")).toHaveCSS(
        "background-color",
        HALLOWEEN_BACKGROUND,
      );
    });
  });
});
