import type { Page, Request } from "@playwright/test";

import { expect, test } from "./support/fixtures";
import { pickOption, sessionPlants, toast } from "./support/ui";

// Borrador local de "Nuevo hallazgo" (C3): IndexedDB real del navegador. Los
// envíos al API se simulan; no se guarda nada.

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

const DESCRIPTION = "Borrador e2e (no se guarda)";

interface StoredDraft {
  id: string;
  userId: number;
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
                userId: draft.userId,
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

/** Escribe un borrador tal cual (otro usuario, vencido…). */
const putRawDraft = (page: Page, draft: Record<string, unknown>) =>
  page.evaluate(
    (record) =>
      new Promise<void>((resolve) => {
        const open = indexedDB.open("hallazgos-borradores", 1);
        open.onupgradeneeded = () =>
          open.result
            .createObjectStore("drafts", { keyPath: "id" })
            .createIndex("userId", "userId");
        open.onsuccess = () => {
          const tx = open.result.transaction("drafts", "readwrite");
          tx.objectStore("drafts").put(record);
          tx.oncomplete = () => {
            open.result.close();
            resolve();
          };
        };
      }),
    draft,
  );

const sessionUserId = (page: Page) =>
  page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("user-session") || "{}").state
        ?.id as number,
  );

const description = (page: Page) =>
  page.getByRole("textbox", { name: "Describe lo que observaste" });
const createButton = (page: Page) =>
  page.getByRole("button", { name: "Crear hallazgo" });
const notice = (page: Page) =>
  page.getByRole("status").filter({
    has: page.getByRole("button", { name: /Recuperar|Reintentar envío/ }),
  });

const openForm = async (page: Page) => {
  await page.goto("/hallazgos/form");
  await sessionPlants(page);
};

/** Formulario completo (comportamiento inseguro, con foto). */
const fillForm = async (page: Page) => {
  await openForm(page);
  await pickOption(page, "Planta");
  await pickOption(page, "Hallazgo", /[Cc]omportamiento inseguro/);
  await pickOption(page, "Tipo");
  await pickOption(page, "Lugar");
  await pickOption(page, "Proceso");
  await pickOption(page, "Supervisor");
  await description(page).fill(DESCRIPTION);
  await page.getByLabel("Elegir de galería").setInputFiles({
    name: "evidencia.png",
    mimeType: "image/png",
    buffer: PNG_1X1,
  });
  await expect(page.getByAltText("Vista previa de la evidencia")).toBeVisible();
};

/** Responde los POST /evidences en orden y guarda cada petición. */
const routeCreate = async (
  page: Page,
  handlers: ((route: import("@playwright/test").Route) => Promise<void>)[],
) => {
  const requests: Request[] = [];
  await page.route("**/api/v1/evidences", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    requests.push(route.request());
    await handlers[Math.min(requests.length, handlers.length) - 1](route);
  });
  return requests;
};

/**
 * Envía sin respuesta (corte de red), cierra el aviso de "Sin conexión" y
 * recarga: el borrador queda como envío sin confirmar. Devuelve las
 * peticiones (la primera es el envío que no llegó).
 */
const pendingDraft = async (
  page: Page,
  retry: (route: import("@playwright/test").Route) => Promise<void>,
) => {
  const requests = await routeCreate(page, [
    (route) => route.abort("internetdisconnected"),
    retry,
  ]);
  await fillForm(page);
  await createButton(page).click();
  await expect(toast(page, "Sin conexión")).toBeVisible();
  await page
    .locator("[data-sonner-toast]")
    .getByRole("button", { name: /close/i })
    .click();

  // En la misma pantalla ya queda en solo lectura.
  await expect(notice(page)).toContainText("Envío sin confirmar");
  await expect(createButton(page)).toHaveCount(0);

  await expect
    .poll(async () => (await storedDrafts(page))[0]?.sendState)
    .toBe("pending");
  await openForm(page);
  await expect(notice(page)).toContainText("Tienes un envío sin confirmar");
  await notice(page).getByRole("button", { name: "Recuperar" }).click();
  return requests;
};

test.describe("Borrador de nuevo hallazgo", () => {
  test("se guarda mientras se captura y al volver se ofrece recuperarlo, con la foto", async ({
    page,
  }) => {
    await openForm(page);
    await pickOption(page, "Hallazgo", /[Cc]omportamiento inseguro/);
    await description(page).fill(DESCRIPTION);
    await page.getByLabel("Elegir de galería").setInputFiles({
      name: "evidencia.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    });
    await expect
      .poll(() => storedDrafts(page))
      .toEqual([
        expect.objectContaining({
          id: `${await sessionUserId(page)}:nuevo-hallazgo`,
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

    await expect(description(page)).toHaveValue(DESCRIPTION);
    await expect(
      page.getByAltText("Vista previa de la evidencia"),
    ).toBeVisible();
    await expect(notice(page)).toHaveCount(0);
  });

  test("Descartar borra el borrador", async ({ page }) => {
    await openForm(page);
    await description(page).fill(DESCRIPTION);
    await expect.poll(async () => (await storedDrafts(page)).length).toBe(1);

    await openForm(page);
    await notice(page).getByRole("button", { name: "Descartar" }).click();
    await expect(notice(page)).toHaveCount(0);
    await expect.poll(async () => (await storedDrafts(page)).length).toBe(0);

    await openForm(page);
    await expect(createButton(page)).toBeVisible();
    await expect(notice(page)).toHaveCount(0);
  });

  test("con un envío sin confirmar, lo recuperado queda en solo lectura", async ({
    page,
  }) => {
    await pendingDraft(page, (route) =>
      route.fulfill({ status: 201, json: { id: 555 } }),
    );

    await expect(notice(page)).toContainText("Envío sin confirmar");
    await expect(
      notice(page).getByRole("button", { name: "Reintentar envío" }),
    ).toBeVisible();
    await expect(
      notice(page).getByRole("button", { name: "Descartar" }),
    ).toBeVisible();
    await expect(createButton(page)).toHaveCount(0);
    await expect(description(page)).toHaveValue(DESCRIPTION);
    await expect(description(page)).toHaveAttribute("readonly", "");
    await expect(
      page.getByRole("combobox", { name: "Hallazgo", exact: true }),
    ).toBeDisabled();
    // La foto se ve, pero no se puede quitar ni cambiar.
    await expect(
      page.getByAltText("Vista previa de la evidencia"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Quitar foto" })).toHaveCount(
      0,
    );
  });

  test("reintentar un envío que ya había llegado: 'Ya se había guardado (hallazgo #N)' y se borra el borrador", async ({
    page,
  }) => {
    const requests = await pendingDraft(page, (route) =>
      route.fulfill({
        status: 201,
        // Como el API real (main.ts): expuesto por CORS para que se lea.
        headers: {
          "Idempotent-Replayed": "true",
          "Access-Control-Expose-Headers": "Idempotent-Replayed",
        },
        json: { id: 555 },
      }),
    );

    await notice(page)
      .getByRole("button", { name: "Reintentar envío" })
      .click();

    await expect(
      toast(page, "Ya se había guardado (hallazgo #555)"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/hallazgos$/);
    expect(requests).toHaveLength(2);
    // Misma clave: el API reconoce el envío y no duplica.
    expect(requests[1].headers()["idempotency-key"]).toBe(
      requests[0].headers()["idempotency-key"],
    );
    await expect.poll(async () => (await storedDrafts(page)).length).toBe(0);
  });

  test("reintentar un envío que no había llegado: se guarda ahora", async ({
    page,
  }) => {
    const requests = await pendingDraft(page, (route) =>
      route.fulfill({ status: 201, json: { id: 556 } }),
    );

    await notice(page)
      .getByRole("button", { name: "Reintentar envío" })
      .click();

    await expect(toast(page, "Hallazgo creado correctamente")).toBeVisible();
    expect(requests[1].headers()["idempotency-key"]).toBe(
      requests[0].headers()["idempotency-key"],
    );
    // La foto viaja en el reintento (recuperada del borrador).
    expect(String(requests[1].postData())).toMatch(/name="file"; filename=/);
    await expect.poll(async () => (await storedDrafts(page)).length).toBe(0);
  });

  test("si el reintento tiene un error de datos, se puede editar y el siguiente envío lleva clave nueva", async ({
    page,
  }) => {
    const requests = await pendingDraft(page, (route) =>
      route.fulfill({
        status: 400,
        json: {
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "Descripción: debe tener máximo 5 caracteres.",
          error: "Bad Request",
          errors: { description: "Debe tener máximo 5 caracteres." },
        },
      }),
    );

    await notice(page)
      .getByRole("button", { name: "Reintentar envío" })
      .click();

    await expect(
      page.getByText("Debe tener máximo 5 caracteres."),
    ).toBeVisible();
    await expect(notice(page)).toHaveCount(0);
    await expect(createButton(page)).toBeVisible();
    await expect(description(page)).not.toHaveAttribute("readonly", "");

    await page.unroute("**/api/v1/evidences");
    const next = await routeCreate(page, [
      (route) => route.fulfill({ status: 201, json: { id: 557 } }),
    ]);
    await description(page).fill("Corto");
    await createButton(page).click();
    await expect(toast(page, "Hallazgo creado correctamente")).toBeVisible();
    expect(next[0].headers()["idempotency-key"]).not.toBe(
      requests[0].headers()["idempotency-key"],
    );
  });

  test("solo se ofrecen los borradores vigentes del usuario con sesión", async ({
    page,
  }) => {
    await openForm(page);
    const userId = await sessionUserId(page);
    const base = {
      form: "nuevo-hallazgo",
      fields: {
        manufacturingPlantId: "",
        typeHallazgo: "",
        secondaryType: "",
        zone: "",
        process: "",
        supervisor: "",
        description: "De otro usuario o vencido",
        priorityDays: "",
      },
      photo: null,
      photoName: null,
      photoType: null,
      idempotencyKey: null,
      sendState: "none",
      lastSendAt: null,
      updatedAt: new Date().toISOString(),
    };
    // Otro usuario del mismo celular.
    await putRawDraft(page, {
      ...base,
      id: `${userId + 1000}:nuevo-hallazgo`,
      userId: userId + 1000,
      createdAt: new Date().toISOString(),
    });
    await openForm(page);
    await expect(notice(page)).toHaveCount(0);

    // El propio, creado hace 8 días: vencido, no se ofrece y se borra.
    await putRawDraft(page, {
      ...base,
      id: `${userId}:nuevo-hallazgo`,
      userId,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60_000).toISOString(),
    });
    await openForm(page);
    await expect(notice(page)).toHaveCount(0);
    await expect
      .poll(async () => (await storedDrafts(page)).map(({ userId }) => userId))
      .toEqual([userId + 1000]);
  });

  test("cerrar sesión avisa y borra los borradores del usuario", async ({
    page,
  }) => {
    await page.route("**/api/v1/auth/logout", (route) =>
      route.fulfill({ json: { message: "Sesión cerrada correctamente." } }),
    );
    await openForm(page);
    await description(page).fill(DESCRIPTION);
    await expect.poll(async () => (await storedDrafts(page)).length).toBe(1);

    const logout = async () => {
      await page.getByRole("button", { name: /Cuenta de/ }).click();
      await page.getByRole("menuitem", { name: /Salir|Cerrar sesión/ }).click();
    };

    await logout();
    const dialog = page.getByRole("dialog", { name: "¿Cerrar sesión?" });
    await expect(dialog).toContainText(
      "Tienes un borrador sin enviar en este dispositivo. Si cierras sesión, se borrará.",
    );
    await dialog.getByRole("button", { name: "Volver" }).click();
    expect(await storedDrafts(page)).toHaveLength(1);

    await logout();
    await dialog.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(toast(page, "Sesión cerrada correctamente.")).toBeVisible();
    expect(await storedDrafts(page)).toHaveLength(0);
  });

  test("si la sesión vence, el borrador se conserva y se avisa", async ({
    page,
  }) => {
    await routeCreate(page, [
      (route) =>
        route.fulfill({
          status: 401,
          json: {
            statusCode: 401,
            code: "SESSION_EXPIRED",
            message: "Tu sesión terminó. Inicia sesión de nuevo.",
            error: "Unauthorized",
          },
        }),
    ]);
    await fillForm(page);
    await createButton(page).click();

    const dialog = page.getByRole("alertdialog", { name: "Tu sesión terminó" });
    await expect(dialog).toContainText(
      "Lo que capturaste quedó guardado como borrador en este dispositivo",
    );
    // El 401 no se procesó: el borrador queda editable.
    await expect
      .poll(async () => (await storedDrafts(page))[0]?.sendState)
      .toBe("none");
  });

  test("sin almacén de borradores (modo privado), si la sesión vence avisa que lo capturado se perderá", async ({
    page,
  }) => {
    await page.addInitScript(() =>
      Object.defineProperty(window, "indexedDB", {
        value: undefined,
        configurable: true,
      }),
    );
    await routeCreate(page, [
      (route) =>
        route.fulfill({
          status: 401,
          json: {
            statusCode: 401,
            code: "SESSION_EXPIRED",
            message: "Tu sesión terminó. Inicia sesión de nuevo.",
            error: "Unauthorized",
          },
        }),
    ]);
    await fillForm(page);
    await createButton(page).click();

    const dialog = page.getByRole("alertdialog", { name: "Tu sesión terminó" });
    await expect(dialog).toContainText(
      "Este navegador no permite guardar borradores (por ejemplo, en modo privado): lo que capturaste en esta pantalla se perderá.",
    );
    await expect(dialog).not.toContainText("quedó guardado");
  });
});
