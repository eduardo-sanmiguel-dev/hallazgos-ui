import type { Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";

// Color de las barras del sistema (<meta name="theme-color">): sigue al tema
// elegido y coincide con la barra superior de la app. Si no, en la app
// instalada los botones de navegación de Android se pierden sobre el fondo.

const EXPECTED = {
  light: { color: "#ffffff", label: "Claro" },
  dark: { color: "#121212", label: "Oscuro" },
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
    await page.emulateMedia({ colorScheme: "light" });
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


test.describe("Preferencia de tema del sistema sin sesión", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`sin preferencia guardada sigue el sistema ${colorScheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto("/");
      await expect.poll(() => themeColors(page)).toEqual([EXPECTED[colorScheme].color]);
      expect(await page.evaluate(() => localStorage.getItem("colorMode"))).toBeNull();

      const next = colorScheme === "light" ? "dark" : "light";
      await page.emulateMedia({ colorScheme: next });
      await expect.poll(() => themeColors(page)).toEqual([EXPECTED[next].color]);
    });
  }

  for (const preference of ["light", "dark", "system"] as const) {
    test(`restaura la preferencia guardada ${preference}`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("colorMode", value), preference);
      const opposite = preference === "dark" ? "light" : "dark";
      await page.emulateMedia({ colorScheme: opposite });
      await page.goto("/");
      const resolved = preference === "system" ? opposite : preference;
      await expect.poll(() => themeColors(page)).toEqual([EXPECTED[resolved].color]);
      await page.reload();
      await expect.poll(() => themeColors(page)).toEqual([EXPECTED[resolved].color]);
    });
  }
});

test("permite volver al sistema y conserva la selección manual", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/dashboard");
  const choose = async (label: string) => {
    await page.getByRole("button", { name: /^Cambiar tema/ }).click();
    await page.getByRole("menuitemradio", { name: label, exact: true }).click();
    await expect(page.getByRole("button", { name: `Cambiar tema (actual: ${label})` })).toBeVisible();
  };

  await choose("Claro");
  await expect.poll(() => themeColors(page)).toEqual([EXPECTED.light.color]);
  await page.reload();
  await expect(page.getByRole("button", { name: "Cambiar tema (actual: Claro)" })).toBeVisible();
  await expect.poll(() => themeColors(page)).toEqual([EXPECTED.light.color]);
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect.poll(() => themeColors(page)).toEqual([EXPECTED.light.color]);

  await choose("Sistema");
  await expect.poll(() => themeColors(page)).toEqual([EXPECTED.dark.color]);
  await page.reload();
  await expect(page.getByRole("button", { name: "Cambiar tema (actual: Sistema)" })).toBeVisible();
  await page.emulateMedia({ colorScheme: "light" });
  await expect.poll(() => themeColors(page)).toEqual([EXPECTED.light.color]);
  expect(await page.evaluate(() => localStorage.getItem("colorMode"))).toBe("system");
});
