import type { Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";
import { trackPageErrors } from "./support/ui";

// Filas por página: 10 de inicio, opciones 10/25/50 ("Todos" solo en
// catálogos chicos), la elección se recuerda por tabla en el navegador y se
// registra en el RUM. Cada prueba arranca con localStorage vacío.

/** `limit` de cada consulta de la lista REST `path` (p. ej. "/users"). */
const trackListLimits = (page: Page, path: string) => {
  const limits: number[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      request.method() === "GET" &&
      url.pathname.replace(/^.*\/api\/v1/, "") === path &&
      url.searchParams.has("page")
    ) {
      limits.push(Number(url.searchParams.get("limit")));
    }
  });
  return limits;
};

const rowsPerPageSelect = (page: Page) =>
  page.getByRole("combobox", { name: /Filas por página/ }).first();

const pickRowsPerPage = async (page: Page, option: string) => {
  await rowsPerPageSelect(page).click();
  await page
    .getByRole("listbox")
    .getByRole("option", { name: option, exact: true })
    .click();
};

const optionLabels = async (page: Page) => {
  await rowsPerPageSelect(page).click();
  const labels = await page
    .getByRole("listbox")
    .getByRole("option")
    .allInnerTexts();
  await page.keyboard.press("Escape");
  return labels.map((label) => label.trim());
};

/** Reemplaza addAction del RUM (window.O2_RUM) por un espía. */
const spyRumActions = async (page: Page) => {
  await page.evaluate(() => {
    const w = window as unknown as {
      O2_RUM: { addAction: (name: string, context?: object) => void };
      __rumActions: { name: string; context?: object }[];
    };
    w.__rumActions = [];
    w.O2_RUM.addAction = (name, context) => {
      w.__rumActions.push({ name, context });
    };
  });
  return () =>
    page.evaluate(
      () => (window as unknown as { __rumActions: unknown[] }).__rumActions,
    );
};

test.describe("Filas por página", () => {
  test("una lista grande empieza en 10 y no ofrece 5 ni Todos", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const limits = trackListLimits(page, "/users");
    await page.goto("/users");
    await expect(rowsPerPageSelect(page)).toHaveText("10");

    expect(await optionLabels(page)).toEqual(["10", "25", "50"]);
    // La primera consulta ya pide 10: no hubo una petición previa con 5.
    expect(limits).toEqual([10]);
    expect(errors).toEqual([]);
  });

  test("un catálogo chico ofrece también Todos", async ({ page }) => {
    await page.goto("/zones");
    await expect(rowsPerPageSelect(page)).toHaveText("10");
    expect(await optionLabels(page)).toEqual(["10", "25", "50", "Todos"]);
  });

  test("recuerda la elección por tabla y la registra en el RUM", async ({
    page,
  }) => {
    const limits = trackListLimits(page, "/users");
    await page.goto("/users");
    await expect(rowsPerPageSelect(page)).toHaveText("10");
    const rumActions = await spyRumActions(page);

    await pickRowsPerPage(page, "25");
    await expect(rowsPerPageSelect(page)).toHaveText("25");
    await expect.poll(() => limits.at(-1)).toBe(25);
    expect(await rumActions()).toEqual([
      {
        name: "filas_por_pagina",
        context: { tabla: "users", filas: "25", anterior: "10" },
      },
    ]);

    // Al volver, la primera consulta ya usa lo guardado (sin pedir 10 antes).
    limits.length = 0;
    await page.reload();
    await expect(rowsPerPageSelect(page)).toHaveText("25");
    await expect.poll(() => limits.length).toBeGreaterThan(0);
    expect(limits.every((limit) => limit === 25)).toBe(true);

    // Otra tabla no hereda la elección.
    await page.goto("/zones");
    await expect(rowsPerPageSelect(page)).toHaveText("10");
  });

  test("ignora valores guardados que ya no se permiten", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("filas-por-pagina:users", "-1");
      localStorage.setItem("filas-por-pagina:zones", "5");
    });
    const limits = trackListLimits(page, "/users");
    await page.goto("/users");
    await expect(rowsPerPageSelect(page)).toHaveText("10");
    expect(limits).toEqual([10]);

    await page.goto("/zones");
    await expect(rowsPerPageSelect(page)).toHaveText("10");
  });

  test("hallazgos empieza en 10, sin Todos, y recuerda la elección", async ({
    page,
  }) => {
    const limits: number[] = [];
    await page.route("**/graphql", async (route) => {
      const body = route.request().postDataJSON();
      if (body?.operationName === "Evidences") {
        limits.push(body.variables.limit);
      }
      await route.fulfill({
        json: {
          data: { evidences: { __typename: "Evidences", count: 0, data: [] } },
        },
      });
    });

    await page.goto("/hallazgos");
    await expect(rowsPerPageSelect(page)).toHaveText("10");
    await expect.poll(() => limits.length).toBeGreaterThan(0);
    expect(limits.every((limit) => limit === 10)).toBe(true);
    expect(await optionLabels(page)).toEqual(["10", "25", "50"]);

    await pickRowsPerPage(page, "50");
    await expect.poll(() => limits.at(-1)).toBe(50);

    limits.length = 0;
    await page.reload();
    await expect(rowsPerPageSelect(page)).toHaveText("50");
    await expect.poll(() => limits.length).toBeGreaterThan(0);
    expect(limits.every((limit) => limit === 50)).toBe(true);
  });
});
