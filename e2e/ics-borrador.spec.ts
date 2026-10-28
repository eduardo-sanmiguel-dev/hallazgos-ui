import type { Page, Request, Route } from "@playwright/test";

import { mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import { pickMany, pickOption, sessionPlants, toast } from "./support/ui";

// Borrador local del registro de ICS (C3), igual que en "Nuevo hallazgo":
// IndexedDB real del navegador. Catálogos y colaboradores fijos; los envíos
// al API se simulan y no se guarda nada.

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

const DESCRIPTION = "Borrador ICS e2e (no se guarda)";

const CATALOGS = [
  {
    id: 71,
    name: "E2E Regla con estándares",
    order: 1,
    isActive: true,
    standards: [
      {
        id: 711,
        name: "E2E Estándar con áreas",
        isActive: true,
        areas: [{ id: 7111, name: "E2E Área", isActive: true }],
      },
    ],
  },
];

const EMPLOYEES = [
  { id: 8101, name: "E2E Colaborador Uno" },
  { id: 8102, name: "E2E Colaborador Dos" },
];

interface StoredDraft {
  id: string;
  sendState: string;
  idempotencyKey: string | null;
  hasPhoto: boolean;
}

/** Borradores guardados en IndexedDB (mismo esquema que draftStore). */
const storedDrafts = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<StoredDraft[]>((resolve) => {
        const open = indexedDB.open("hallazgos-borradores", 1);
        open.onupgradeneeded = () =>
          open.result
            .createObjectStore("drafts", { keyPath: "id" })
            .createIndex("userId", "userId");
        open.onsuccess = () => {
          const query = open.result
            .transaction("drafts", "readonly")
            .objectStore("drafts")
            .getAll();
          query.onsuccess = () => {
            resolve(
              query.result.map((draft) => ({
                id: draft.id,
                sendState: draft.sendState,
                idempotencyKey: draft.idempotencyKey,
                hasPhoto: !!draft.photo,
              })),
            );
            open.result.close();
          };
        };
      }),
  );

const sessionUserId = (page: Page) =>
  page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("user-session") || "{}").state
        ?.id as number,
  );

const totalPeople = (page: Page) => page.getByLabel(/^Personas totales/);
const description = (page: Page) =>
  page.getByRole("textbox", { name: "Descripción (opcional)" });
const saveButton = (page: Page) =>
  page.getByRole("button", { name: "Guardar" });
const notice = (page: Page) =>
  page.getByRole("status").filter({
    has: page.getByRole("button", { name: /Recuperar|Reintentar envío/ }),
  });

const openForm = async (page: Page) => {
  await mockGet(page, "/ics/catalogs", CATALOGS);
  await mockGet(page, "/employees", EMPLOYEES);
  await page.goto("/ics/form");
  return sessionPlants(page);
};

/** Formulario completo, con estándar, área y foto. */
const fillForm = async (page: Page) => {
  const [plant] = await openForm(page);
  await pickOption(page, "Planta *", plant.name);
  await pickOption(page, "Regla de vida *", "E2E Regla con estándares");
  await pickOption(
    page,
    "Estándar de comportamiento",
    "E2E Estándar con áreas",
  );
  await pickOption(page, "Área", "E2E Área");
  await totalPeople(page).fill("6");
  await pickMany(page, "Personas que no cumplen *", 2);
  await description(page).fill(DESCRIPTION);
  await page.getByLabel("Elegir de galería").setInputFiles({
    name: "evidencia.png",
    mimeType: "image/png",
    buffer: PNG_1X1,
  });
  await expect(page.getByAltText("Vista previa de la evidencia")).toBeVisible();
};

/** Responde los POST /ics en orden y guarda cada petición. */
const routeCreate = async (
  page: Page,
  handlers: ((route: Route) => Promise<void>)[],
) => {
  const requests: Request[] = [];
  await page.route("**/api/v1/ics", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    requests.push(route.request());
    await handlers[Math.min(requests.length, handlers.length) - 1](route);
  });
  return requests;
};

test.describe("Borrador de ICS", () => {
  test("se guarda mientras se captura y al recuperarlo vuelven todos los campos y la foto", async ({
    page,
  }) => {
    await fillForm(page);
    await expect
      .poll(() => storedDrafts(page))
      .toEqual([
        expect.objectContaining({
          id: `${await sessionUserId(page)}:ics`,
          sendState: "none",
          hasPhoto: true,
        }),
      ]);

    await openForm(page);
    // Nada se aplica hasta que el usuario elige.
    await expect(description(page)).toHaveValue("");
    await expect(notice(page)).toContainText("Tienes un borrador");
    await expect(notice(page)).toContainText("con foto");
    await notice(page).getByRole("button", { name: "Recuperar" }).click();

    // Estándar y área se conservan (antes, al poner la regla se limpiaban).
    // El select muestra la opción elegida fuera del <input> (renderValue).
    for (const option of ["E2E Estándar con áreas", "E2E Área"]) {
      await expect(page.getByText(option).first()).toBeVisible();
    }
    await expect(totalPeople(page)).toHaveValue("6");
    await expect(
      page.getByText("E2E Colaborador Dos", { exact: true }),
    ).toBeVisible();
    await expect(description(page)).toHaveValue(DESCRIPTION);
    await expect(
      page.getByAltText("Vista previa de la evidencia"),
    ).toBeVisible();
    await expect(notice(page)).toHaveCount(0);
  });

  test("un envío sin respuesta queda en solo lectura y el reintento usa la misma clave", async ({
    page,
  }) => {
    const requests = await routeCreate(page, [
      (route) => route.abort("internetdisconnected"),
      (route) =>
        route.fulfill({
          status: 201,
          // Como el API real (main.ts): expuesto por CORS para que se lea.
          headers: {
            "Idempotent-Replayed": "true",
            "Access-Control-Expose-Headers": "Idempotent-Replayed",
          },
          json: { id: 4321 },
        }),
    ]);
    await fillForm(page);
    await saveButton(page).click();
    await expect(toast(page, "Sin conexión")).toBeVisible();
    await page
      .locator("[data-sonner-toast]")
      .getByRole("button", { name: /close/i })
      .click();

    // En la misma pantalla ya queda en solo lectura.
    await expect(notice(page)).toContainText("Envío sin confirmar");
    await expect(saveButton(page)).toBeDisabled();
    await expect
      .poll(async () => (await storedDrafts(page))[0]?.sendState)
      .toBe("pending");

    await openForm(page);
    await expect(notice(page)).toContainText("Tienes un envío sin confirmar");
    await notice(page).getByRole("button", { name: "Recuperar" }).click();

    await expect(totalPeople(page)).toHaveAttribute("readonly", "");
    await expect(description(page)).toHaveAttribute("readonly", "");
    await expect(
      page.getByRole("combobox", { name: "Regla de vida *", exact: true }),
    ).toBeDisabled();
    await expect(page.getByRole("button", { name: "Quitar foto" })).toHaveCount(
      0,
    );

    await notice(page)
      .getByRole("button", { name: "Reintentar envío" })
      .click();
    await expect(toast(page, "Ya se había guardado (ICS #4321)")).toBeVisible();
    await expect(page).toHaveURL(/\/ics$/);
    expect(requests).toHaveLength(2);
    expect(requests[1].headers()["idempotency-key"]).toBe(
      requests[0].headers()["idempotency-key"],
    );
    // La foto viaja en el reintento (recuperada del borrador).
    expect(String(requests[1].postData())).toMatch(/name="file"; filename=/);
    await expect.poll(async () => (await storedDrafts(page)).length).toBe(0);
  });

  test("salir con algo capturado pide confirmación; vacío sale directo", async ({
    page,
  }) => {
    const [plant] = await openForm(page);
    // Solo la planta no cuenta como captura.
    await pickOption(page, "Planta *", plant.name);
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page).toHaveURL(/\/ics$/);

    await openForm(page);
    await totalPeople(page).fill("4");
    await page.getByRole("button", { name: "Cancelar" }).click();
    const dialog = page.getByRole("dialog", { name: "¿Salir del registro?" });
    await expect(dialog).toContainText(
      "Lo que capturaste queda guardado como borrador en este dispositivo",
    );
    await dialog.getByRole("button", { name: "Seguir editando" }).click();
    await expect(page).toHaveURL(/\/ics\/form$/);
    await expect(totalPeople(page)).toHaveValue("4");

    await page.getByRole("button", { name: "Cancelar" }).click();
    await dialog.getByRole("button", { name: "Salir" }).click();
    await expect(page).toHaveURL(/\/ics$/);
    // Lo capturado sigue en el borrador.
    await expect.poll(async () => (await storedDrafts(page)).length).toBe(1);
  });

  test("sin almacén de borradores (modo privado), salir avisa que se perderá", async ({
    page,
  }) => {
    await page.addInitScript(() =>
      Object.defineProperty(window, "indexedDB", {
        value: undefined,
        configurable: true,
      }),
    );
    await openForm(page);
    await totalPeople(page).fill("4");

    await page.getByRole("button", { name: "Cancelar" }).click();
    const dialog = page.getByRole("dialog", { name: "¿Salir del registro?" });
    await expect(dialog).toContainText(
      "Este navegador no permite guardar borradores (por ejemplo, en modo privado): si sales, lo que capturaste se perderá.",
    );
    await expect(dialog).not.toContainText("queda guardado");
  });
});
