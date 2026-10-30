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

  test("la ambientación es solo decoración: no se toca ni se lee", async ({
    page,
  }) => {
    await page.goto("/users/form");
    const decor = page.locator("[data-halloween-decor]");
    // Fondo, cuervos y murciélagos, y la escena del header.
    await expect(decor).toHaveCount(3);
    const styles = await decor.evaluateAll((nodes) =>
      nodes.map((node) => ({
        hidden: node.getAttribute("aria-hidden"),
        pointerEvents: getComputedStyle(node).pointerEvents,
      })),
    );
    for (const style of styles) {
      expect(style).toEqual({ hidden: "true", pointerEvents: "none" });
    }

    // Lo que queda debajo de los adornos sigue respondiendo.
    await page.getByLabel("Nombre").fill("E2E Halloween");
    await expect(page.getByLabel("Nombre")).toHaveValue("E2E Halloween");
    const save = (await page
      .getByRole("button", { name: "Guardar" })
      .boundingBox())!;
    const hit = await page.evaluate(
      ([x, y]) =>
        !!document.elementFromPoint(x, y)?.closest("[data-halloween-decor]"),
      [save.x + save.width / 2, save.y + save.height / 2],
    );
    expect(hit).toBe(false);
  });

  test("con «reducir movimiento» no vuela nada", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/dashboard");
    await expect(page.locator("[data-halloween-decor]")).toHaveCount(3);
    const flying = await page
      .locator("[data-halloween-decor]")
      .evaluateAll(
        (nodes) =>
          nodes.filter(
            (node) =>
              getComputedStyle(node).position === "fixed" &&
              getComputedStyle(node).display !== "none",
          ).length,
      );
    expect(flying).toBe(0);
  });

  test.describe("sin sesión", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("el login también lo usa", async ({ page }) => {
      await page.goto("/login");
      await expect(page.locator("body")).toHaveCSS(
        "background-color",
        HALLOWEEN_BACKGROUND,
      );
      // La noche del login (luna, estrellas y cementerio) y lo que vuela.
      await expect(page.locator("[data-halloween-decor]")).toHaveCount(2);
    });
  });
});
