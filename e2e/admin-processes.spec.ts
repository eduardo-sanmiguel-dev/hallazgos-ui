import type { Page } from "@playwright/test";

import { captureWrites, mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import {
  pickOption,
  sessionPlants,
  toast,
  trackPageErrors,
} from "./support/ui";

// Panel administrativo, grupo 1 (piloto: Procesos). Las piezas comunes que
// usarán los demás formularios: "Guardar" marca todo lo que falta, confirmar
// al salir con algo capturado, estados de carga del registro en edición,
// breadcrumbs (B2) y lista en tarjetas. Lecturas simuladas donde hace falta un
// registro fijo; las escrituras se interceptan.

const ID = 9701;

const saveButton = (page: Page) =>
  page.getByRole("button", { name: "Guardar" });
const cancelButton = (page: Page) =>
  page.getByRole("button", { name: "Cancelar" });
const nameInput = (page: Page) => page.getByLabel("Nombre");

/** Registro fijo para editar, de la primera planta del usuario. */
const mockProcess = async (page: Page) => {
  await page.goto("/processes");
  const [plant] = await sessionPlants(page);
  await mockGet(page, `/processes/${ID}`, {
    id: ID,
    name: "E2E Proceso",
    manufacturingPlant: { id: plant.id, name: plant.name },
  });
  return plant;
};

test.describe("Procesos: formulario", () => {
  test("Guardar marca a la vez todo lo que falta y cada marca se quita al llenar su campo", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);
    await page.goto("/processes/form");

    await expect(saveButton(page)).toBeEnabled();
    await saveButton(page).click();
    await expect(toast(page, "Completa los 2 campos marcados.")).toBeVisible();
    await expect(page.getByText("Escribe el nombre.")).toBeVisible();
    await expect(page.getByText("Selecciona la planta.")).toBeVisible();
    await expect(nameInput(page)).toBeFocused();

    await nameInput(page).fill("E2E Proceso (no se guarda)");
    await expect(page.getByText("Escribe el nombre.")).toHaveCount(0);
    await expect(page.getByText("Selecciona la planta.")).toBeVisible();
    expect(writes).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("al crear, salir con algo capturado pide confirmación; vacío sale directo", async ({
    page,
  }) => {
    await page.goto("/processes/form");
    await cancelButton(page).click();
    await expect(page).toHaveURL(/\/processes$/);

    await page.goto("/processes/form");
    await nameInput(page).fill("E2E a medias");
    await cancelButton(page).click();
    const dialog = page.getByRole("dialog", {
      name: "¿Descartar el registro?",
    });
    // El foco inicia en la opción segura: Enter no descarta por accidente.
    await expect(
      dialog.getByRole("button", { name: "Seguir editando" }),
    ).toBeFocused();
    await dialog.getByRole("button", { name: "Seguir editando" }).click();
    await expect(page).toHaveURL(/\/processes\/form$/);
    await expect(nameInput(page)).toHaveValue("E2E a medias");

    await cancelButton(page).click();
    await dialog.getByRole("button", { name: "Descartar" }).click();
    await expect(page).toHaveURL(/\/processes$/);
  });

  test("al editar, confirma solo si algo cambió respecto a lo cargado", async ({
    page,
  }) => {
    await mockProcess(page);
    await page.goto(`/processes/form?id=${ID}`);
    await expect(nameInput(page)).toHaveValue("E2E Proceso");

    // Sin cambios: sale directo.
    await cancelButton(page).click();
    await expect(page).toHaveURL(/\/processes$/);

    await page.goto(`/processes/form?id=${ID}`);
    await nameInput(page).fill("E2E Proceso editado");
    await cancelButton(page).click();
    await expect(
      page.getByRole("dialog", { name: "¿Descartar los cambios?" }),
    ).toBeVisible();

    // Volver al valor original ya no cuenta como cambio.
    await page.getByRole("button", { name: "Seguir editando" }).click();
    await nameInput(page).fill("E2E Proceso");
    await cancelButton(page).click();
    await expect(page).toHaveURL(/\/processes$/);
  });

  test("recargar con algo capturado muestra el aviso del navegador; sin cambios, no", async ({
    page,
  }) => {
    const prompts: string[] = [];
    page.on("dialog", (dialog) => {
      prompts.push(dialog.type());
      void dialog.accept();
    });

    await page.goto("/processes/form");
    await nameInput(page).click();
    await page.reload();
    expect(prompts).toEqual([]);

    await nameInput(page).fill("E2E a medias");
    await page.reload();
    expect(prompts).toEqual(["beforeunload"]);
    await expect(nameInput(page)).toHaveValue("");
  });

  test("al editar, la planta no avisa 'out-of-range' aunque el catálogo llegue después", async ({
    page,
  }) => {
    const warnings: string[] = [];
    page.on("console", (message) => {
      if (/out-of-range/i.test(message.text())) warnings.push(message.text());
    });
    const plant = await mockProcess(page);
    // El catálogo de plantas llega después que el registro.
    await page.route(
      (url) => url.pathname.endsWith("/api/v1/manufacturing-plants"),
      async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await route.fallback();
      },
    );
    await page.goto(`/processes/form?id=${ID}`);
    await expect(nameInput(page)).toHaveValue("E2E Proceso");
    await expect(page.getByRole("combobox", { name: "Planta" })).toHaveText(
      plant.name,
    );
    expect(warnings).toEqual([]);
  });

  test("mientras carga el registro no se muestra el formulario vacío", async ({
    page,
  }) => {
    const plant = await mockProcess(page);
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route(
      (url) => url.pathname.endsWith(`/api/v1/processes/${ID}`),
      async (route) => {
        await held;
        await route.fulfill({
          json: {
            id: ID,
            name: "E2E Proceso",
            manufacturingPlant: { id: plant.id, name: plant.name },
          },
        });
      },
    );
    await page.goto(`/processes/form?id=${ID}`);
    await expect(page.getByRole("status", { name: /Cargando/ })).toBeVisible();
    await expect(nameInput(page)).toHaveCount(0);

    release();
    await expect(nameInput(page)).toHaveValue("E2E Proceso");
  });

  test("un registro que no existe lo dice y deja volver a la lista", async ({
    page,
  }) => {
    await page.route(
      (url) => url.pathname.endsWith(`/api/v1/processes/${ID}`),
      (route) =>
        route.fulfill({
          status: 404,
          json: {
            statusCode: 404,
            code: "NOT_FOUND",
            message: `Proceso #${ID} no encontrado`,
            error: "Not Found",
          },
        }),
    );
    await page.goto(`/processes/form?id=${ID}`);

    await expect(page.getByText("Proceso no encontrado")).toBeVisible();
    await expect(nameInput(page)).toHaveCount(0);
    await page.getByRole("button", { name: "Volver a la lista" }).click();
    await expect(page).toHaveURL(/\/processes$/);
  });

  test("si falla la carga del registro: error con Reintentar", async ({
    page,
  }) => {
    const plant = await mockProcess(page);
    let fail = true;
    await page.route(
      (url) => url.pathname.endsWith(`/api/v1/processes/${ID}`),
      (route) =>
        fail
          ? route.fulfill({ status: 500, json: { statusCode: 500 } })
          : route.fulfill({
              json: {
                id: ID,
                name: "E2E Proceso",
                manufacturingPlant: { id: plant.id, name: plant.name },
              },
            }),
    );
    await page.goto(`/processes/form?id=${ID}`);

    const error = page
      .getByRole("alert")
      .filter({ hasText: "No se pudo cargar" });
    await expect(error).toBeVisible();
    fail = false;
    await error.getByRole("button", { name: "Reintentar" }).click();
    await expect(nameInput(page)).toHaveValue("E2E Proceso");
  });

  test("el error del API se marca en su campo", async ({ page }) => {
    await page.route("**/api/v1/processes", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({
            status: 400,
            json: {
              statusCode: 400,
              code: "VALIDATION_FAILED",
              message: "Revisa 1 campo: Nombre.",
              error: "Bad Request",
              errors: { name: "Debe tener máximo 5 caracteres." },
            },
          })
        : route.fallback(),
    );
    await page.goto("/processes/form");
    await nameInput(page).fill("E2E nombre largo");
    await pickOption(page, "Planta");
    await saveButton(page).click();

    await expect(
      page.getByText("Debe tener máximo 5 caracteres."),
    ).toBeVisible();
    await expect(nameInput(page)).toBeFocused();
  });
});

test.describe("Procesos: breadcrumbs (B2)", () => {
  test("en escritorio: Configuración › Procesos › página, y la lista confirma si hay cambios", async ({
    page,
  }) => {
    await page.goto("/processes/form");
    const trail = page.getByRole("navigation", { name: "Ruta de navegación" });
    await expect(trail).toHaveText(/Configuración›Procesos›Nuevo proceso/);
    await expect(trail.getByText("Nuevo proceso")).toHaveAttribute(
      "aria-current",
      "page",
    );

    await nameInput(page).fill("E2E a medias");
    await trail.getByRole("link", { name: "Procesos" }).click();
    await expect(
      page.getByRole("dialog", { name: "¿Descartar el registro?" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Descartar" }).click();
    await expect(page).toHaveURL(/\/processes$/);

    // En la lista no hay breadcrumbs.
    await expect(
      page.getByRole("navigation", { name: "Ruta de navegación" }),
    ).toHaveCount(0);
  });

  test.describe("en celular", () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

    test("no se muestran", async ({ page }) => {
      await page.goto("/processes/form");
      await expect(nameInput(page)).toBeVisible();
      await expect(
        page.getByRole("navigation", { name: "Ruta de navegación" }),
      ).toBeHidden();
    });
  });
});

test.describe("Procesos: lista", () => {
  test("la primera carga muestra el esqueleto de la tabla, no la barra", async ({
    page,
  }) => {
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route(
      (url) =>
        url.pathname.endsWith("/api/v1/processes") &&
        url.searchParams.has("page"),
      async (route) => {
        await held;
        await route.fallback();
      },
    );
    await page.goto("/processes");
    await expect(
      page.getByRole("heading", { level: 1, name: "Procesos" }),
    ).toBeVisible();
    await expect(page.getByRole("status", { name: "Cargando…" })).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveCount(0);

    release();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("status", { name: "Cargando…" })).toHaveCount(
      0,
    );
  });
});

test.describe("Procesos: lista en celular", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  test("tarjetas con nombre, planta y acciones, sin desplazarse de lado", async ({
    page,
  }) => {
    await mockGet(
      page,
      "/processes",
      {
        data: [
          {
            id: ID,
            name: "E2E Proceso",
            manufacturingPlant: { id: 1, name: "E2E Planta" },
            createdAt: "2026-10-01T15:00:00.000Z",
            updatedAt: "2026-10-01T15:00:00.000Z",
          },
        ],
        count: 1,
      },
      { when: (url) => url.searchParams.has("page") },
    );
    await page.goto("/processes");

    await expect(page.getByRole("table")).toHaveCount(0);
    const card = page
      .getByRole("list", { name: "Procesos" })
      .getByRole("listitem");
    await expect(card).toContainText("E2E Proceso");
    await expect(card).toContainText("E2E Planta");
    await expect(card.getByRole("button", { name: "Editar" })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
