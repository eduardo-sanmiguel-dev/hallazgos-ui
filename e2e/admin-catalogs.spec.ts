import type { Page } from "@playwright/test";

import { captureWrites, mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import { sessionPlants, toast } from "./support/ui";

// Panel administrativo, grupo 3: Criterios, Tipos de criterios, Equipos de
// protección, Equipos de emergencia y HDS. Lo común (marcar lo que falta,
// confirmar al salir, carga en edición) está probado con Procesos
// (admin-processes.spec.ts); aquí, lo propio de cada pantalla. Escrituras
// interceptadas; lecturas simuladas donde hace falta un registro fijo.

const trail = (page: Page) => page.getByRole("navigation", { name: "Ruta de navegación" });

const EQUIPMENT = {
  id: 9701,
  name: "E2E Lentes",
  deliveryFrequency: 30,
  manufacturingPlant: { id: 1, name: "E2E Planta" },
  costHistory: [{ price: 120 }],
  createdAt: "2026-10-01T15:00:00.000Z",
  updatedAt: "2026-10-01T15:00:00.000Z",
  createdBy: { id: 1, name: "E2E Creó" },
  updatedBy: null,
};

const EMERGENCY_TEAM = {
  id: 9801,
  location: "E2E Pasillo",
  extinguisherNumber: "E2E-01",
  typeOfExtinguisher: "PQS",
  capacity: 6,
  manufacturingPlant: { id: 1, name: "E2E Planta" },
  createdAt: "2026-10-01T15:00:00.000Z",
  updatedAt: "2026-10-01T15:00:00.000Z",
  createdBy: { name: "E2E Creó" },
  updatedBy: null,
};

/** Lista paginada con filas fijas. */
const servePage = (page: Page, path: string, rows: unknown[]) =>
  mockGet(
    page,
    path,
    { data: rows, count: rows.length },
    { when: (url) => url.searchParams.has("page") },
  );

test.describe("Criterios y tipos de criterios", () => {
  for (const [route, expected] of [
    ["/main-types/form", "Configuración›Criterios›Nuevo criterio"],
    ["/secondary-types/form", "Configuración›Criterios›Tipos de criterios›Nuevo tipo de criterio"],
    [
      "/emergency-teams/form",
      "Configuración›Equipos›Equipos de emergencia›Nuevo equipo de emergencia",
    ],
  ] as const) {
    test(`breadcrumbs en ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(trail(page)).toHaveText(expected);
    });
  }

  test("un criterio que no existe lo dice", async ({ page }) => {
    await page.route(
      (url) => url.pathname.endsWith("/api/v1/main-types/9601"),
      (route) =>
        route.fulfill({
          status: 404,
          json: {
            statusCode: 404,
            code: "NOT_FOUND",
            message: "Criterio #9601 no encontrado",
            error: "Not Found",
          },
        }),
    );
    await page.goto("/main-types/form?id=9601");
    await expect(page.getByText("Criterio no encontrado")).toBeVisible();
  });

  test("tipos de criterio: Guardar marca nombre, criterio y responsable", async ({ page }) => {
    const writes = await captureWrites(page);
    await page.goto("/secondary-types/form");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(toast(page, "Completa los 3 campos marcados.")).toBeVisible();
    for (const message of [
      "Escribe el nombre.",
      "Selecciona el criterio.",
      "Selecciona el responsable.",
    ]) {
      await expect(page.getByText(message)).toBeVisible();
    }
    expect(writes).toEqual([]);
  });
});

test.describe("Equipos de protección", () => {
  test("Crear abre su propia ruta, con breadcrumbs", async ({ page }) => {
    await page.goto("/equipments");
    await page.getByRole("button", { name: "Crear equipo", exact: true }).click();
    await expect(page).toHaveURL(/\/equipments\/form$/);
    await expect(page.getByRole("heading", { level: 1, name: "Nuevo equipo" })).toBeVisible();
    await expect(trail(page)).toHaveText("Configuración›Equipos›Equipo de protección›Nuevo equipo");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("salir con algo capturado pide confirmación; sin cambios sale directo", async ({ page }) => {
    await page.goto("/equipments/form");
    const cancel = page.getByRole("button", { name: "Cancelar" });
    // Sin cambios (la planta elegida sola no cuenta): regresa a la lista.
    await cancel.click();
    await expect(page).toHaveURL(/\/equipments$/);

    await page.goto("/equipments/form");
    await page.getByLabel("Nombre").fill("E2E a medias");
    await cancel.click();
    const confirmation = page.getByRole("dialog", {
      name: "¿Descartar el registro?",
    });
    await confirmation.getByRole("button", { name: "Seguir editando" }).click();
    await expect(page.getByLabel("Nombre")).toHaveValue("E2E a medias");

    await cancel.click();
    await confirmation.getByRole("button", { name: "Descartar" }).click();
    await expect(page).toHaveURL(/\/equipments$/);
  });

  test("el precio acepta coma decimal y la frecuencia solo enteros", async ({ page }) => {
    const writes = await captureWrites(page);
    await page.goto("/equipments/form");
    const plants = await sessionPlants(page);
    if (plants.length > 1) {
      await page.getByRole("combobox", { name: "Planta" }).click();
      await page.getByRole("option", { name: plants[0].name }).click();
    }
    await page.getByLabel("Nombre").fill("E2E Guantes");
    const frequency = page.getByLabel("Frecuencia de entrega (días)");
    await frequency.fill("15.5");
    await expect(frequency).toHaveValue("155");
    await frequency.fill("15");
    await page.getByLabel("Precio").fill("99,9");
    await expect(page.getByLabel("Precio")).toHaveValue("99.9");

    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(toast(page, "Equipo creado correctamente")).toBeVisible();
    await expect(page).toHaveURL(/\/equipments$/);
    expect(writes[0].body).toMatchObject({
      deliveryFrequency: 15,
      price: 99.9,
    });
  });

  test("Editar abre el formulario con el equipo cargado", async ({ page }) => {
    await servePage(page, "/equipments", [EQUIPMENT]);
    await mockGet(page, `/equipments/${EQUIPMENT.id}`, EQUIPMENT);
    await page.goto("/equipments");
    await page.getByRole("button", { name: "Editar" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/equipments/form\\?id=${EQUIPMENT.id}$`));
    await expect(page.getByLabel("Nombre")).toHaveValue("E2E Lentes");
    await expect(page.getByLabel("Frecuencia de entrega (días)")).toHaveValue("30");
    await expect(page.getByLabel("Precio")).toHaveValue("120");
  });

  test("si falla la carga del equipo: error con Reintentar", async ({ page }) => {
    let fail = true;
    await page.route(
      (url) => url.pathname.endsWith(`/api/v1/equipments/${EQUIPMENT.id}`),
      (route) =>
        fail
          ? route.fulfill({ status: 500, json: { statusCode: 500 } })
          : route.fulfill({ json: EQUIPMENT }),
    );
    await page.goto(`/equipments/form?id=${EQUIPMENT.id}`);

    const error = page.getByRole("alert").filter({ hasText: "No se pudo cargar" });
    await expect(error).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar" })).toHaveCount(0);
    fail = false;
    await error.getByRole("button", { name: "Reintentar" }).click();
    await expect(page.getByLabel("Nombre")).toHaveValue("E2E Lentes");
  });

  test("un equipo que no existe lo dice", async ({ page }) => {
    await page.route(
      (url) => url.pathname.endsWith("/api/v1/equipments/9799"),
      (route) =>
        route.fulfill({
          status: 404,
          json: {
            statusCode: 404,
            code: "NOT_FOUND",
            message: "Equipo #9799 no encontrado",
            error: "Not Found",
          },
        }),
    );
    await page.goto("/equipments/form?id=9799");
    await expect(page.getByText("Equipo no encontrado")).toBeVisible();
  });
});

test.describe("Equipos de emergencia", () => {
  test("Guardar marca todo lo que falta y la capacidad abre el teclado decimal", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    await page.goto("/emergency-teams/form");
    await expect(page.getByLabel("Capacidad")).toHaveAttribute("inputmode", "decimal");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(toast(page, /Completa los [45] campos marcados\./)).toBeVisible();
    await expect(page.getByText("Escribe la ubicación.")).toBeVisible();
    await expect(page.getByText("Escribe la capacidad.")).toBeVisible();
    expect(writes).toEqual([]);
  });

  test.describe("en celular", () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

    test("tarjetas con casilla para imprimir y seleccionar toda la página", async ({ page }) => {
      await servePage(page, "/emergency-teams", [
        EMERGENCY_TEAM,
        { ...EMERGENCY_TEAM, id: 9802, location: "E2E Almacén" },
      ]);
      await page.goto("/emergency-teams");

      await expect(page.getByRole("table")).toHaveCount(0);
      const cards = page.getByRole("list", { name: "Equipos de emergencia" }).getByRole("listitem");
      await expect(cards).toHaveCount(2);
      await expect(cards.first()).toContainText("#9801 · E2E Pasillo");
      await expect(cards.first()).toContainText("PQS");

      await cards.first().getByRole("checkbox").check();
      await expect(page.getByRole("button", { name: "Imprimir (1)" })).toBeEnabled();
      await page.getByRole("checkbox", { name: "Seleccionar todos los de esta página" }).check();
      await expect(page.getByRole("button", { name: "Imprimir (2)" })).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });

  // XSS almacenado: la hoja se escribe con document.write en una ventana del
  // mismo origen; antes una ubicación con HTML se ejecutaba con la sesión de
  // quien imprimía.
  test("imprimir QR: el texto capturado no se ejecuta como HTML", async ({ page }) => {
    const attack = `<img src=x onerror="window.__xss=1">E2E Ataque`;
    await page.addInitScript(() => {
      const open = window.open.bind(window);
      window.open = (...args) => {
        const opened = open(...args);
        if (opened) {
          opened.print = () => undefined;
          opened.close = () => undefined;
        }
        return opened;
      };
    });
    await servePage(page, "/emergency-teams", [
      { ...EMERGENCY_TEAM, location: attack, extinguisherNumber: `"><b>E2E</b>` },
    ]);
    await page.goto("/emergency-teams");
    await page.getByRole("checkbox", { name: "Seleccionar el equipo 9801" }).check();

    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("button", { name: /^Imprimir/ }).click();
    const popup = await popupPromise;

    await expect(popup.getByText(attack)).toBeVisible();
    await expect(popup.getByText(`"><b>E2E</b>`)).toBeVisible();
    expect(await popup.locator("img").count()).toBe(1);
    expect(await popup.evaluate(() => (window as { __xss?: number }).__xss)).toBeUndefined();
    expect(await page.evaluate(() => (window as { __xss?: number }).__xss)).toBeUndefined();
    await popup.close();
  });

  test("en escritorio: selecciona e imprime los QR en una ventana nueva", async ({ page }) => {
    // La ventana imprime y se cierra sola: aquí se queda abierta para revisarla.
    await page.addInitScript(() => {
      const open = window.open.bind(window);
      window.open = (...args) => {
        const opened = open(...args);
        if (opened) {
          opened.print = () => undefined;
          opened.close = () => undefined;
        }
        return opened;
      };
    });
    await servePage(page, "/emergency-teams", [
      EMERGENCY_TEAM,
      { ...EMERGENCY_TEAM, id: 9802, location: "E2E Almacén", extinguisherNumber: null },
    ]);
    await page.goto("/emergency-teams");
    const print = page.getByRole("button", { name: /^Imprimir/ });
    const selectAll = page.getByRole("checkbox", { name: "Seleccionar todos los de esta página" });
    const first = page.getByRole("checkbox", { name: "Seleccionar el equipo 9801" });

    await first.check();
    await expect(print).toHaveText("Imprimir (1)");
    await first.uncheck();
    await expect(print).toBeDisabled();
    await selectAll.check();
    await expect(print).toHaveText("Imprimir (2)");
    await selectAll.uncheck();
    await expect(print).toBeDisabled();
    await selectAll.check();

    const popupPromise = page.waitForEvent("popup");
    await print.click();
    const popup = await popupPromise;
    await expect(
      popup.getByRole("img", {
        name: "Código QR del extintor E2E-01, en E2E Pasillo",
      }),
    ).toBeVisible();
    await expect(popup.getByText("E2E Almacén")).toBeVisible();
    await popup.close();

    // Las filas por página reinician la página actual.
    const rowsPerPage = page.getByRole("combobox", { name: "Filas por página" });
    await rowsPerPage.selectOption("25");
    await expect(rowsPerPage).toHaveValue("25");
  });

  test("si el navegador bloquea la ventana de impresión, lo avisa", async ({ page }) => {
    await page.addInitScript(() => {
      window.open = () => null;
    });
    await servePage(page, "/emergency-teams", [EMERGENCY_TEAM]);
    await page.goto("/emergency-teams");
    await page.getByRole("checkbox", { name: "Seleccionar el equipo 9801" }).check();
    await page.getByRole("button", { name: "Imprimir (1)" }).click();
    await expect(toast(page, "No se pudo abrir la ventana de impresión")).toBeVisible();
  });

  test("en escritorio, si falla la lista: error con Reintentar", async ({ page }) => {
    await page.route(
      (url) => url.pathname.endsWith("/api/v1/emergency-teams") && url.searchParams.has("page"),
      (route) => route.fulfill({ status: 500, json: { statusCode: 500 } }),
    );
    await page.goto("/emergency-teams");
    await expect(page.getByRole("alert").filter({ hasText: "No se pudo cargar" })).toBeVisible();
  });
});

test.describe("Listas en celular", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  const dates = {
    createdAt: "2026-10-01T15:00:00.000Z",
    updatedAt: "2026-10-01T15:00:00.000Z",
  };

  for (const { route, ariaLabel, row, texts, action, api } of [
    {
      route: "/main-types",
      ariaLabel: "Criterios",
      row: { id: 9601, name: "E2E Criterio", ...dates },
      texts: ["E2E Criterio"],
      action: "Editar",
    },
    {
      route: "/secondary-types",
      ariaLabel: "Tipos de criterios",
      row: {
        id: 9602,
        name: "E2E Tipo",
        mainType: { id: 1, name: "E2E Criterio" },
        typeResponsible: "Seguridad",
        ...dates,
      },
      texts: ["E2E Tipo", "E2E Criterio", "Seguridad"],
      action: "Editar",
    },
    {
      route: "/equipments",
      ariaLabel: "Equipos de protección personal",
      row: EQUIPMENT,
      texts: ["E2E Lentes", "E2E Planta", "30", "$ 120"],
      action: "Editar",
    },
    {
      route: "/hds",
      // La API de HDS es /safety-data-files.
      api: "/safety-data-files",
      ariaLabel: "Hojas de datos de seguridad",
      row: { name: "E2E Hoja de datos.pdf" },
      texts: ["E2E Hoja de datos.pdf"],
      action: "Ver archivo",
    },
  ]) {
    test(`${ariaLabel}: tarjetas sin desplazarse de lado`, async ({ page }) => {
      await servePage(page, api ?? route, [row]);
      await page.goto(route);

      await expect(page.getByRole("table")).toHaveCount(0);
      const card = page.getByRole("list", { name: ariaLabel }).getByRole("listitem");
      for (const text of texts) await expect(card).toContainText(text);
      await expect(card.getByRole("button", { name: action })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
