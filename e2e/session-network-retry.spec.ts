import type { Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";

// Verificación de sesión (sessionLoader) ante cortes de red: la petición no
// recibe respuesta HTTP ("Failed to fetch"). Caso real en RUM: un corte de
// medio segundo mostraba "No se pudo mostrar esta página" y la usuaria tuvo
// que pulsar Reintentar; la siguiente petición respondió normal.

const SESSION = "**/api/v1/users/get-information-current-user";
const errorPage = (page: Page) => page.getByText("No se pudo mostrar esta página");

/** Corta la red en las primeras `failures` verificaciones; luego deja pasar. */
const cutSession = async (page: Page, failures: number) => {
  const calls = { count: 0 };
  await page.route(SESSION, (route) => {
    calls.count++;
    return calls.count <= failures ? route.abort("failed") : route.fallback();
  });
  return calls;
};

test.describe("Verificación de sesión con cortes de red", () => {
  test("un corte de red se reintenta solo y la página abre normal", async ({ page }) => {
    const calls = await cutSession(page, 1);

    await page.goto("/hallazgos");

    await expect(page.getByRole("heading", { name: "Hallazgos" })).toBeVisible();
    await expect(errorPage(page)).toHaveCount(0);
    expect(calls.count).toBe(2);
  });

  test("si la red sigue caída, tras 3 intentos muestra el error con Reintentar", async ({
    page,
  }) => {
    const calls = await cutSession(page, Infinity);

    await page.goto("/hallazgos");

    await expect(errorPage(page)).toBeVisible();
    await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
    expect(calls.count).toBe(3);
  });

  test("una respuesta del servidor (500) no se reintenta", async ({ page }) => {
    let calls = 0;
    await page.route(SESSION, (route) => {
      calls++;
      return route.fulfill({ status: 500, json: { message: "error" } });
    });

    await page.goto("/hallazgos");

    await expect(errorPage(page)).toBeVisible();
    expect(calls).toBe(1);
  });
});
