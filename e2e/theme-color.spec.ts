import type { Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";

// Color de las barras del sistema (<meta name="theme-color">): sigue al tema
// elegido y coincide con la barra superior de la app. Si no, en la app
// instalada los botones de navegación de Android se pierden sobre el fondo.

const EXPECTED = {
  light: { color: "#ffffff", label: "Claro" },
  dark: { color: "#121212", label: "Oscuro" },
  halloween: { color: "#1C1426", label: "Halloween" },
} as const;

/** "#FFF" / "#ffffff" → "#ffffff", para comparar colores y no el texto. */
const normalize = (color: string | null) => {
  const hex = (color ?? "").trim().toLowerCase();
  return /^#[0-9a-f]{3}$/.test(hex)
    ? `#${[...hex.slice(1)].map((c) => c + c).join("")}`
    : hex;
};

const themeColors = async (page: Page) =>
  (
    await page
      .locator('meta[name="theme-color"]')
      .evaluateAll((metas) => metas.map((meta) => meta.getAttribute("content")))
  ).map(normalize);

/** Color de fondo de la barra superior de la app, en hex. */
const appBarColor = (page: Page) =>
  page
    .locator("header")
    .first()
    .evaluate((header) => {
      const [r, g, b] = getComputedStyle(header)
        .backgroundColor.match(/\d+/g)!
        .map(Number);
      return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
    });

test.describe("Color de las barras del sistema", () => {
  for (const [name, { color }] of Object.entries(EXPECTED)) {
    test(`tema ${name}: una sola etiqueta, igual a la barra de la app`, async ({
      page,
    }) => {
      await page.addInitScript((name) => {
        localStorage.setItem("colorMode", name);
      }, name);
      await page.goto("/dashboard");

      await expect.poll(() => themeColors(page)).toEqual([normalize(color)]);
      expect(await appBarColor(page)).toBe(normalize(color));
    });
  }

  test("cambia al momento al elegir otro tema", async ({ page }) => {
    await page.goto("/dashboard");
    await expect
      .poll(() => themeColors(page))
      .toEqual([normalize(EXPECTED.light.color)]);

    await page.getByRole("button", { name: /^Cambiar tema/ }).click();
    await page
      .getByRole("menuitemradio", { name: EXPECTED.dark.label })
      .click();
    await expect
      .poll(() => themeColors(page))
      .toEqual([normalize(EXPECTED.dark.color)]);
  });

  test("el manifest abre con barras blancas, como el splash", async ({
    page,
  }) => {
    const response = await page.request.get("/manifest.webmanifest");
    const manifest = await response.json();
    expect(manifest.theme_color).toBe("#ffffff");
    expect(manifest.background_color).toBe("#ffffff");
  });
});
