import type { Page, Request, Route } from "@playwright/test";

import { mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import {
  pickMany,
  pickOption,
  sessionPlants,
  toast,
  trackPageErrors,
} from "./support/ui";

// Errores del API en la UI (Fase 3): título del aviso por tipo, errores por
// campo, "Sin conexión" con "Reintentar" sin perder la foto, referencia de los
// 500 y aviso de sesión terminada. Las respuestas del API se simulan; no se
// guarda nada.

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

const CATALOGS = [
  { id: 72, name: "E2E Regla", order: 1, isActive: true, standards: [] },
];
const EMPLOYEES = [{ id: 8101, name: "E2E Colaborador Uno" }];

const saveButton = (page: Page) =>
  page.getByRole("button", { name: "Guardar" });

/** Formulario de ICS lleno, con foto adjunta, listo para guardar. */
const fillIcsForm = async (page: Page) => {
  await mockGet(page, "/ics/catalogs", CATALOGS);
  await mockGet(page, "/employees", EMPLOYEES);
  await page.goto("/ics/form");
  const [plant] = await sessionPlants(page);
  await pickOption(page, "Planta *", plant.name);
  await pickOption(page, "Regla de vida *", "E2E Regla");
  await page.getByLabel(/^Personas totales/).fill("3");
  await pickMany(page, "Personas que no cumplen *");
  await page.getByLabel("Elegir de galería").setInputFiles({
    name: "evidencia.png",
    mimeType: "image/png",
    buffer: PNG_1X1,
  });
  await expect(page.getByAltText("Vista previa de la evidencia")).toBeVisible();
};

/** Responde los POST /ics en orden con `handlers` y guarda cada petición. */
const routeIcsPosts = async (
  page: Page,
  handlers: ((route: Route) => Promise<void>)[],
) => {
  const requests: Request[] = [];
  await page.route("**/api/v1/ics", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    requests.push(route.request());
    const handler = handlers[Math.min(requests.length, handlers.length) - 1];
    await handler(route);
  });
  return requests;
};

const created = (route: Route) =>
  route.fulfill({ status: 201, json: { id: 999999 } });

test.describe("Errores del API", () => {
  test("validación: marca los campos rechazados y titula el aviso 'Revisa los datos'", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    await routeIcsPosts(page, [
      (route) =>
        route.fulfill({
          status: 400,
          json: {
            statusCode: 400,
            code: "VALIDATION_FAILED",
            message: "Revisa 2 campos: Personas totales y Regla de vida.",
            error: "Bad Request",
            errors: {
              totalPeople: "Debe ser 1 o mayor.",
              ruleOfLifeId: "Elige una opción válida.",
            },
          },
        }),
    ]);
    await fillIcsForm(page);

    await saveButton(page).click();

    await expect(toast(page, "Revisa los datos")).toBeVisible();
    await expect(
      toast(page, "Revisa 2 campos: Personas totales y Regla de vida."),
    ).toBeVisible();
    // Junto a cada campo, su mensaje (ruleOfLifeId → ruleOfLife).
    await expect(page.getByText("Debe ser 1 o mayor.")).toBeVisible();
    await expect(page.getByText("Elige una opción válida.")).toBeVisible();
    await expect(page.getByLabel(/^Personas totales/)).toBeFocused();
    await expect(page).toHaveURL(/\/ics\/form$/);
    expect(errors).toEqual([]);
  });

  test("sin conexión al guardar con foto: 'Reintentar' reenvía la misma foto con la misma clave", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const requests = await routeIcsPosts(page, [
      (route) => route.abort("internetdisconnected"),
      created,
    ]);
    await fillIcsForm(page);

    await saveButton(page).click();

    await expect(toast(page, "Sin conexión")).toBeVisible();
    // La pantalla sigue esperando: no se perdió nada de lo capturado.
    await expect(page).toHaveURL(/\/ics\/form$/);
    await expect(
      page.getByAltText("Vista previa de la evidencia"),
    ).toBeVisible();
    await expect(saveButton(page)).toBeDisabled();

    await page
      .locator("[data-sonner-toast]")
      .getByRole("button", { name: "Reintentar" })
      .click();

    await expect(toast(page, "ICS creado correctamente")).toBeVisible();
    // Título de `notify` sin espacios dentro de los signos (M8).
    await expect(toast(page, "¡Correcto!")).toBeVisible();
    expect(requests).toHaveLength(2);
    const [first, retry] = requests;
    const key = first.headers()["idempotency-key"];
    expect(key).toMatch(/^[0-9a-f-]{36}$/);
    expect(retry.headers()["idempotency-key"]).toBe(key);
    // Misma foto en el reintento.
    expect(retry.postDataBuffer()?.length).toBe(first.postDataBuffer()?.length);
    expect(String(retry.postData())).toMatch(/name="file"; filename=/);
    expect(errors).toEqual([]);
  });

  test("envío anterior en proceso: espera y reintenta solo con la misma clave", async ({
    page,
  }) => {
    const requests = await routeIcsPosts(page, [
      (route) =>
        route.fulfill({
          status: 409,
          json: {
            statusCode: 409,
            code: "IDEMPOTENCY_IN_PROGRESS",
            message:
              "Tu envío anterior todavía se está procesando. Espera unos segundos.",
            error: "Conflict",
          },
        }),
      created,
    ]);
    await fillIcsForm(page);

    await saveButton(page).click();

    await expect(toast(page, "Confirmando envío")).toBeVisible();
    await expect(toast(page, "ICS creado correctamente")).toBeVisible();
    expect(requests).toHaveLength(2);
    expect(requests[1].headers()["idempotency-key"]).toBe(
      requests[0].headers()["idempotency-key"],
    );
  });

  test("error del servidor: aviso con la referencia y se conserva lo capturado", async ({
    page,
  }) => {
    await routeIcsPosts(page, [
      (route) =>
        route.fulfill({
          status: 500,
          json: {
            statusCode: 500,
            code: "INTERNAL_ERROR",
            message:
              "Ocurrió un error inesperado. Intenta de nuevo; si continúa, avisa al administrador con la referencia E-7K3Q9P.",
            error: "Internal Server Error",
            ref: "E-7K3Q9P",
          },
        }),
    ]);
    await fillIcsForm(page);

    await saveButton(page).click();

    await expect(toast(page, "Error del servidor")).toBeVisible();
    await expect(toast(page, /referencia E-7K3Q9P/)).toBeVisible();
    await expect(
      page
        .locator("[data-sonner-toast]")
        .getByRole("button", { name: "Copiar referencia" }),
    ).toBeVisible();
    // Pudo haberse guardado: el borrador queda en solo lectura con
    // "Reintentar envío" (misma clave), sin perder la foto.
    await expect(
      page.getByRole("status").filter({ hasText: "Envío sin confirmar" }),
    ).toContainText("el servidor falló");
    await expect(saveButton(page)).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Reintentar envío" }),
    ).toBeVisible();
    await expect(
      page.getByAltText("Vista previa de la evidencia"),
    ).toBeVisible();
  });

  test("sesión terminada: avisa antes de mandar al login (un solo diálogo)", async ({
    page,
  }) => {
    const sessionEnded = {
      statusCode: 401,
      code: "SESSION_EXPIRED",
      message: "Tu sesión terminó. Inicia sesión de nuevo.",
      error: "Unauthorized",
    };
    await routeIcsPosts(page, [
      (route) => route.fulfill({ status: 401, json: sessionEnded }),
    ]);
    await fillIcsForm(page);

    // Varias peticiones fallan a la vez (guardar y una consulta).
    await mockGet(page, "/employees", sessionEnded, { status: 401 });
    await saveButton(page).click();

    const dialog = page.getByRole("alertdialog", { name: "Tu sesión terminó" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(
      "Tu sesión terminó. Inicia sesión de nuevo.",
    );
    // ICS tiene borrador local: lo capturado se conserva.
    await expect(dialog).toContainText(
      "Lo que capturaste quedó guardado como borrador en este dispositivo",
    );
    await expect(page.getByRole("alertdialog")).toHaveCount(1);
    // No redirige solo.
    await expect(page).toHaveURL(/\/ics\/form$/);

    await Promise.all([
      page.waitForURL((url) => url.pathname === "/", { waitUntil: "commit" }),
      dialog.getByRole("button", { name: "Iniciar sesión" }).click(),
    ]);
  });
});
