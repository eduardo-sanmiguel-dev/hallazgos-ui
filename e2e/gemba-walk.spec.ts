import type { Page, Request } from "@playwright/test";

import { captureWrites, editingId, mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import {
  choosePlant,
  pickMany,
  pickOption,
  sessionPlants,
  toast,
  trackPageErrors,
} from "./support/ui";

// Gemba Walk. Las escrituras se interceptan (captureWrites). Las pantallas
// que dependen de lo programado para hoy usan datos fijos (mockGet).

const PLANT = { id: 1, name: "Planta E2E" };
const ZONE = {
  id: 9101,
  nameZone: "E2E Zona",
  nameLocation: "Pasillo",
  isActive: true,
  manufacturingPlant: PLANT,
};
const EVALUATIONS = [
  {
    id: 9201,
    category: "SHE",
    area: "EPP",
    description: "El personal usa lentes de seguridad",
    manufacturingPlant: PLANT,
  },
  {
    id: 9202,
    category: "CALIDAD",
    area: "1'S - Clasificación",
    description: "Solo lo necesario en el área",
    manufacturingPlant: PLANT,
  },
];

const minutesFromNow = (minutes: number) =>
  new Date(Date.now() + minutes * 60_000).toISOString();

const calendarEvent = (id: number, scheduledAt: string) => ({
  id,
  scheduledAt,
  isAdditional: false,
  isActive: true,
  gembaWalkZone: ZONE,
});

const saveButton = (page: Page) =>
  page.getByRole("button", { name: "Guardar" });

/** Abre en edición el primer registro de la tabla y espera sus datos. */
const editFirstRow = async (page: Page, route: string) => {
  await page.goto(route);
  await page.getByRole("button", { name: "Editar" }).first().click();
  await expect(page).toHaveURL(new RegExp(`${route}/form\\?id=`));
  return editingId(page);
};

test.describe("Gemba Walk: registrar recorrido", () => {
  test("inicia, marca un NC y registra el recorrido (sin guardar)", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const startedAt = new Date().toISOString();
    const writes = await captureWrites(page, {
      respond: ({ path, body }) =>
        path.endsWith("/start")
          ? { startToken: "token-e2e", startedAt }
          : { id: 999999, ...(body as object) },
    });
    await mockGet(page, "/gemba-walk/walks/available-events", [
      calendarEvent(9301, minutesFromNow(10)),
    ]);
    await mockGet(page, "/gemba-walk/evaluations", EVALUATIONS);

    await page.goto("/gemba-walk/form");
    await choosePlant(page);
    await pickOption(page, "Recorrido programado (hoy)", /E2E Zona - Pasillo/);

    const finish = page.getByRole("button", { name: "Terminar recorrido" });
    await expect(finish).toBeDisabled();
    await page.getByRole("button", { name: "Iniciar recorrido" }).click();
    await expect(page.getByText("Recorrido iniciado a las")).toBeVisible();

    // Por defecto todo cumple; se marca un NC con comentario.
    await expect(page.getByText("C: 2")).toBeVisible();
    const epp = page.getByRole("group", { name: "EPP" });
    await expect(
      epp.getByRole("button", { name: "Cumple", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await epp.getByRole("button", { name: "No cumple" }).click();
    await expect(
      epp.getByRole("button", { name: "No cumple" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("NC: 1")).toBeVisible();
    await page
      .getByLabel("Comentarios")
      .first()
      .fill("  Dos personas sin lentes  ");

    await finish.click();
    const dialog = page.getByRole("dialog", { name: "Confirmar registro" });
    await expect(dialog).toContainText("1 C y 1 NC");
    await dialog.getByRole("button", { name: "Registrar" }).click();

    await expect(
      toast(page, "Recorrido registrado correctamente"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/gemba-walk$/);

    expect(writes).toEqual([
      {
        method: "POST",
        path: "/gemba-walk/walks/start",
        body: { gembaWalkCalendarId: 9301 },
      },
      {
        method: "POST",
        path: "/gemba-walk/walks",
        body: {
          gembaWalkCalendarId: 9301,
          startToken: "token-e2e",
          results: [
            {
              gembaWalkEvaluationId: 9201,
              isCompliant: false,
              comments: "Dos personas sin lentes",
            },
            { gembaWalkEvaluationId: 9202, isCompliant: true },
          ],
        },
      },
    ]);
    expect(errors).toEqual([]);
  });

  test("un recorrido fuera de tolerancia no se puede iniciar", async ({
    page,
  }) => {
    await mockGet(page, "/gemba-walk/walks/available-events", [
      calendarEvent(9302, minutesFromNow(-60)),
    ]);
    await mockGet(page, "/gemba-walk/evaluations", EVALUATIONS);

    await page.goto("/gemba-walk/form");
    await choosePlant(page);
    await pickOption(page, "Recorrido programado (hoy)", /Fuera de tiempo/);

    await expect(page.getByText("Fuera de tiempo.")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Iniciar recorrido" }),
    ).toHaveCount(0);
  });

  test("avisa cuando no hay recorridos ni conceptos", async ({ page }) => {
    await mockGet(page, "/gemba-walk/walks/available-events", []);
    await mockGet(page, "/gemba-walk/evaluations", []);

    await page.goto("/gemba-walk/form");
    await choosePlant(page);
    await expect(
      page.getByText("No hay recorridos programados para hoy"),
    ).toBeVisible();
    await expect(
      page.getByText("La planta no tiene conceptos de evaluación registrados."),
    ).toBeVisible();
  });

  test("quien no es observador no ve el módulo", async ({ page }) => {
    await mockGet(page, "/gemba-walk/walks/access", { isObserver: false });

    await page.goto("/gemba-walk/form");
    await expect(
      page.getByText("Solo los usuarios registrados como observadores"),
    ).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Planta" })).toHaveCount(0);
  });
});

/** Borradores guardados en IndexedDB (mismo esquema que draftStore). */
const storedDrafts = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<{ id: string; sendState: string }[]>((resolve) => {
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
              query.result.map(({ id, sendState }) => ({ id, sendState })),
            );
            open.result.close();
          };
        };
      }),
  );

/** Escribe un borrador tal cual (p. ej. de un recorrido de ayer). */
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

const draftNotice = (page: Page) =>
  page.getByRole("status").filter({
    has: page.getByRole("button", { name: /Recuperar|Reintentar envío/ }),
  });

const hhmmss = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour12: false });

/**
 * Inicia el recorrido de un evento de hoy (dentro de la tolerancia), marca
 * EPP como NC con comentario y espera a que quede en el borrador.
 */
const startWalkWithDraft = async (
  page: Page,
  startedAt: string,
  // false: sin almacén de borradores (modo privado) nunca se guarda.
  { waitForDraft = true } = {},
) => {
  await mockGet(page, "/gemba-walk/walks/available-events", [
    calendarEvent(9301, minutesFromNow(10)),
  ]);
  await mockGet(page, "/gemba-walk/evaluations", EVALUATIONS);
  await page.goto("/gemba-walk/form");
  await choosePlant(page);
  await pickOption(page, "Recorrido programado (hoy)", /E2E Zona - Pasillo/);
  await page.getByRole("button", { name: "Iniciar recorrido" }).click();
  await expect(page.getByText(hhmmss(startedAt))).toBeVisible();
  await page
    .getByRole("group", { name: "EPP" })
    .getByRole("button", { name: "No cumple" })
    .click();
  await page.getByLabel("Comentarios").first().fill("Sin lentes");
  if (waitForDraft) {
    await expect.poll(async () => (await storedDrafts(page)).length).toBe(1);
  }
};

/** Navegador sin IndexedDB (como el modo privado de algunos navegadores). */
const withoutIndexedDb = (page: Page) =>
  page.addInitScript(() =>
    Object.defineProperty(window, "indexedDB", {
      value: undefined,
      configurable: true,
    }),
  );

test.describe("Gemba Walk: borrador del recorrido", () => {
  const startedAt = minutesFromNow(-20);
  const respond = ({ path, body }: { path: string; body: unknown }) =>
    path.endsWith("/start")
      ? { startToken: "token-e2e", startedAt }
      : { id: 999999, ...(body as object) };

  test("al volver se recupera con su hora de inicio, aunque ya pasó la tolerancia, y se registra con su comprobante", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page, { respond });
    await startWalkWithDraft(page, startedAt);

    // Al volver, el evento ya está fuera de tolerancia (era a las -60 min).
    await mockGet(page, "/gemba-walk/walks/available-events", [
      calendarEvent(9301, minutesFromNow(-60)),
    ]);
    await page.goto("/gemba-walk/form");
    await expect(draftNotice(page)).toContainText("Tienes un borrador");
    await draftNotice(page).getByRole("button", { name: "Recuperar" }).click();

    await expect(page.getByText(hhmmss(startedAt))).toBeVisible();
    await expect(page.getByText("Fuera de tiempo.")).toHaveCount(0);
    await expect(
      page
        .getByRole("group", { name: "EPP" })
        .getByRole("button", { name: "No cumple" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Comentarios").first()).toHaveValue(
      "Sin lentes",
    );

    await page.getByRole("button", { name: "Terminar recorrido" }).click();
    await page
      .getByRole("dialog", { name: "Confirmar registro" })
      .getByRole("button", { name: "Registrar" })
      .click();
    await expect(
      toast(page, "Recorrido registrado correctamente"),
    ).toBeVisible();

    // Un solo inicio; el registro lleva el comprobante original.
    expect(writes.map(({ path }) => path)).toEqual([
      "/gemba-walk/walks/start",
      "/gemba-walk/walks",
    ]);
    expect(writes[1].body).toMatchObject({
      gembaWalkCalendarId: 9301,
      startToken: "token-e2e",
    });
    await expect.poll(async () => (await storedDrafts(page)).length).toBe(0);
    expect(errors).toEqual([]);
  });

  test("si ya lo registró otro observador, queda en solo lectura con el motivo y se puede descartar", async ({
    page,
  }) => {
    await captureWrites(page, { respond });
    await startWalkWithDraft(page, startedAt);

    await mockGet(page, "/gemba-walk/walks/available-events", []);
    await page.goto("/gemba-walk/form");
    await draftNotice(page).getByRole("button", { name: "Recuperar" }).click();

    const blocked = page.getByRole("status").filter({
      hasText: "Este recorrido ya no se puede registrar",
    });
    await expect(blocked).toContainText(
      "Este recorrido ya se registró (desde otro dispositivo o por otro observador).",
    );
    await expect(blocked).toContainText("E2E Zona - Pasillo");
    await expect(
      page.getByRole("button", { name: "Terminar recorrido" }),
    ).toBeDisabled();
    await expect(
      page
        .getByRole("group", { name: "EPP" })
        .getByRole("button", { name: "Cumple", exact: true }),
    ).toBeDisabled();

    await blocked.getByRole("button", { name: "Descartar recorrido" }).click();
    await expect(blocked).toHaveCount(0);
    await expect(
      page.getByText("No hay recorridos programados para hoy"),
    ).toBeVisible();
    await expect.poll(async () => (await storedDrafts(page)).length).toBe(0);
  });

  test("un recorrido de otro día queda en solo lectura con el motivo", async ({
    page,
  }) => {
    await mockGet(page, "/gemba-walk/walks/available-events", []);
    await mockGet(page, "/gemba-walk/evaluations", EVALUATIONS);
    await page.goto("/gemba-walk/form");
    await sessionPlants(page);
    const userId = await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("user-session") || "{}").state?.id,
    );
    const yesterday = new Date(Date.now() - 24 * 60 * 60_000);
    const now = new Date().toISOString();
    await putRawDraft(page, {
      id: `${userId}:gemba-walk`,
      userId,
      form: "gemba-walk",
      fields: {
        manufacturingPlantId: String(PLANT.id),
        gembaWalkCalendarId: "9301",
        started: { startToken: "t", startedAt: yesterday.toISOString() },
        answers: {},
        event: {
          scheduledAt: yesterday.toISOString(),
          label: "E2E Zona - Pasillo",
        },
      },
      photo: null,
      photoName: null,
      photoType: null,
      idempotencyKey: null,
      sendState: "none",
      lastSendAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await page.goto("/gemba-walk/form");
    await draftNotice(page).getByRole("button", { name: "Recuperar" }).click();
    const day = yesterday.toLocaleDateString("en-GB");
    await expect(
      page.getByText(
        `Era un recorrido del ${day}: solo se pueden registrar los recorridos del día.`,
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Terminar recorrido" }),
    ).toBeDisabled();
  });

  test("reintentar un registro que ya había llegado no lo duplica", async ({
    page,
  }) => {
    await captureWrites(page, { respond });
    const requests: Request[] = [];
    await page.route("**/api/v1/gemba-walk/walks", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      requests.push(route.request());
      if (requests.length === 1) return route.abort("internetdisconnected");
      await route.fulfill({
        status: 201,
        headers: {
          "Idempotent-Replayed": "true",
          "Access-Control-Expose-Headers": "Idempotent-Replayed",
        },
        json: { id: 777 },
      });
    });
    await startWalkWithDraft(page, startedAt);

    await page.getByRole("button", { name: "Terminar recorrido" }).click();
    await page
      .getByRole("dialog", { name: "Confirmar registro" })
      .getByRole("button", { name: "Registrar" })
      .click();
    // Mientras el aviso "Sin conexión" (con su "Reintentar") está abierto, la
    // petición sigue esperando; al cerrarlo queda como envío sin confirmar.
    await expect(toast(page, "Sin conexión")).toBeVisible();
    await page
      .locator("[data-sonner-toast]")
      .getByRole("button", { name: /close/i })
      .click();
    await expect(draftNotice(page)).toContainText("Envío sin confirmar");
    await expect
      .poll(async () => (await storedDrafts(page))[0]?.sendState)
      .toBe("pending");

    await draftNotice(page)
      .getByRole("button", { name: "Reintentar envío" })
      .click();
    await expect(
      toast(page, "Ya se había registrado (recorrido #777)"),
    ).toBeVisible();
    expect(requests).toHaveLength(2);
    expect(requests[0].headers()["idempotency-key"]).toBeTruthy();
    expect(requests[1].headers()["idempotency-key"]).toBe(
      requests[0].headers()["idempotency-key"],
    );
  });

  test("salir con un recorrido iniciado pide confirmación", async ({
    page,
  }) => {
    await captureWrites(page, { respond });
    await startWalkWithDraft(page, startedAt);

    await page.getByRole("button", { name: "Cancelar" }).click();
    const dialog = page.getByRole("dialog", { name: "¿Salir del recorrido?" });
    await dialog
      .getByRole("button", { name: "Seguir en el recorrido" })
      .click();
    await expect(page).toHaveURL(/\/gemba-walk\/form$/);

    await page.getByRole("button", { name: "Cancelar" }).click();
    await dialog.getByRole("button", { name: "Salir" }).click();
    await expect(page).toHaveURL(/\/gemba-walk$/);
    // Lo capturado sigue en el borrador.
    expect(await storedDrafts(page)).toHaveLength(1);
  });

  // Sin esperar al guardado automático (~0.8 s): "Salir" guarda en ese
  // momento lo último capturado, como promete el aviso.
  test("salir justo después de un cambio lo guarda en el borrador", async ({
    page,
  }) => {
    await captureWrites(page, { respond });
    await startWalkWithDraft(page, startedAt);

    await page.getByLabel("Comentarios").first().fill("Último cambio e2e");
    await page.getByRole("button", { name: "Cancelar" }).click();
    await page
      .getByRole("dialog", { name: "¿Salir del recorrido?" })
      .getByRole("button", { name: "Salir" })
      .click();
    await expect(page).toHaveURL(/\/gemba-walk$/);

    const saved = await page.evaluate(
      () =>
        new Promise<string>((resolve) => {
          const open = indexedDB.open("hallazgos-borradores", 1);
          open.onsuccess = () => {
            const query = open.result
              .transaction("drafts", "readonly")
              .objectStore("drafts")
              .getAll();
            query.onsuccess = () => {
              resolve(JSON.stringify(query.result.map(({ fields }) => fields)));
              open.result.close();
            };
          };
        }),
    );
    expect(saved).toContain("Último cambio e2e");
  });

  test("sin almacén de borradores (modo privado), salir avisa que se perderá", async ({
    page,
  }) => {
    await withoutIndexedDb(page);
    await captureWrites(page, { respond });
    await startWalkWithDraft(page, startedAt, { waitForDraft: false });

    await page.getByRole("button", { name: "Cancelar" }).click();
    const dialog = page.getByRole("dialog", { name: "¿Salir del recorrido?" });
    await expect(dialog).toContainText(
      "Este navegador no permite guardar borradores (por ejemplo, en modo privado): si sales, lo que capturaste se perderá.",
    );
    await expect(dialog).not.toContainText("queda guardado");
  });

  test.describe("barra al pie en celular de 360 px", () => {
    test.use({
      hasTouch: true,
      isMobile: true,
      viewport: { width: 360, height: 740 },
    });

    test("Terminar recorrido y Cancelar van lado a lado, de 48 px y sin cortar el texto", async ({
      page,
    }) => {
      await captureWrites(page, { respond });
      await startWalkWithDraft(page, startedAt);

      const finish = page.getByRole("button", { name: "Terminar recorrido" });
      const cancel = page.getByRole("button", { name: "Cancelar" });
      const finishBox = (await finish.boundingBox())!;
      const cancelBox = (await cancel.boundingBox())!;

      // Misma fila, Cancelar a la izquierda.
      expect(Math.abs(finishBox.y - cancelBox.y)).toBeLessThan(1);
      expect(cancelBox.x + cancelBox.width).toBeLessThanOrEqual(finishBox.x);
      // Área táctil del tema (48 px en pantalla táctil).
      expect(finishBox.height).toBeGreaterThanOrEqual(48);
      expect(cancelBox.height).toBeGreaterThanOrEqual(48);
      // El texto cabe completo y nada se sale de la pantalla.
      for (const button of [finish, cancel]) {
        expect(
          await button.evaluate((el) => el.scrollWidth <= el.clientWidth),
        ).toBe(true);
      }
      expect(finishBox.x + finishBox.width).toBeLessThanOrEqual(360);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
});

/** Recorrido realizado, con un NC comentado. */
const walkDetail = () => ({
  id: 9401,
  startedAt: minutesFromNow(-30),
  performedAt: minutesFromNow(-5),
  durationSeconds: 25 * 60,
  isActive: true,
  gembaWalkCalendar: calendarEvent(9301, minutesFromNow(-35)),
  results: [
    { ...EVALUATIONS[0], isCompliant: false, comments: "Sin lentes" },
    { ...EVALUATIONS[1], isCompliant: true, comments: null },
  ],
  createdBy: { id: 1, name: "Observador E2E", email: "e2e@example.com" },
});

test.describe("Gemba Walk: consulta", () => {
  test("muestra el detalle de un recorrido", async ({ page }) => {
    const errors = trackPageErrors(page);
    await mockGet(page, "/gemba-walk/walks/9401", walkDetail());

    await page.goto("/gemba-walk/view?id=9401");
    await expect(page.getByText("E2E Zona - Pasillo")).toBeVisible();
    await expect(page.getByText("Observador E2E")).toBeVisible();
    await expect(page.getByText("C: 1", { exact: true })).toBeVisible();
    await expect(page.getByText("NC: 1")).toBeVisible();
    await expect(page.getByText("NC - No cumple")).toBeVisible();
    await expect(page.getByText("Sin lentes")).toBeVisible();
    // Agrupado por categoría en el orden definido.
    await expect(page.getByText(/^(SHE|CALIDAD)$/)).toHaveText([
      "SHE",
      "CALIDAD",
    ]);

    await page.getByRole("button", { name: "Regresar" }).click();
    await expect(page).toHaveURL(/\/gemba-walk$/);
    expect(errors).toEqual([]);
  });

  test("un detalle inexistente lo dice; si falla, deja reintentar", async ({
    page,
  }) => {
    await mockGet(
      page,
      "/gemba-walk/walks/9499",
      { message: "x" },
      {
        status: 404,
      },
    );
    await page.goto("/gemba-walk/view?id=9499");
    await expect(page.getByText("Recorrido no encontrado")).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveCount(0);

    let fail = true;
    await page.route(
      (url) => url.pathname.endsWith("/api/v1/gemba-walk/walks/9401"),
      (route) =>
        fail
          ? route.fulfill({ status: 500, json: { message: "E2E caído" } })
          : route.fulfill({ json: walkDetail() }),
    );
    await page.goto("/gemba-walk/view?id=9401");
    await expect(page.getByText("No se pudo cargar")).toBeVisible();
    fail = false;
    await page.getByRole("button", { name: "Reintentar" }).first().click();
    await expect(page.getByText("Observador E2E")).toBeVisible();
  });

  test.describe("en celular", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("la lista de recorridos se ve en tarjetas con su resultado y acción", async ({
      page,
    }) => {
      await mockGet(
        page,
        "/gemba-walk/walks",
        { data: [walkDetail()], count: 1 },
        { when: (url) => url.searchParams.has("page") },
      );
      await page.goto("/gemba-walk");

      await expect(page.getByRole("table")).toHaveCount(0);
      const card = page
        .getByRole("list", { name: "Recorridos" })
        .getByRole("listitem");
      await expect(card).toContainText("E2E Zona - Pasillo");
      await expect(card).toContainText("NC: 1");
      await expect(card).toContainText("50%");
      await card.getByRole("button", { name: /Ver/ }).click();
      await expect(page).toHaveURL(/\/gemba-walk\/view\?id=9401$/);
    });

    test("un recorrido después de las 23:00 aparece una sola vez en la agenda", async ({
      page,
    }) => {
      // Mismo día de la semana (no domingo), a las 23:30: con la duración de
      // 1 h de FullCalendar, antes aparecía también al día siguiente.
      const late = new Date();
      if (late.getDay() === 0) late.setDate(late.getDate() - 1);
      late.setHours(23, 30, 0, 0);
      await mockGet(page, "/gemba-walk/walks/calendar", [
        calendarEvent(9302, late.toISOString()),
      ]);
      await page.goto("/gemba-walk/schedule");
      await choosePlant(page);

      await expect(page.locator(".fc-list")).toBeVisible();
      await expect(page.getByText("E2E Zona - Pasillo")).toHaveCount(1);
    });

    test("la agenda se ve como lista de la semana", async ({ page }) => {
      await mockGet(page, "/gemba-walk/walks/9401", walkDetail());
      await mockGet(page, "/gemba-walk/walks/calendar", [
        {
          ...calendarEvent(9301, new Date().toISOString()),
          status: "DONE",
          gembaWalkId: 9401,
        },
      ]);
      await page.goto("/gemba-walk/schedule");
      await choosePlant(page);

      await expect(page.locator(".fc-list")).toBeVisible();
      await page.getByText("✓ E2E Zona - Pasillo").click();
      await expect(page).toHaveURL(/\/gemba-walk\/view\?id=9401$/);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });

  test("la agenda marca los realizados y abre su detalle", async ({ page }) => {
    const errors = trackPageErrors(page);
    await mockGet(page, "/gemba-walk/walks/9401", walkDetail());
    await mockGet(page, "/gemba-walk/walks/calendar", [
      {
        ...calendarEvent(9301, minutesFromNow(-120)),
        status: "DONE",
        gembaWalkId: 9401,
      },
      {
        ...calendarEvent(9302, minutesFromNow(-60)),
        gembaWalkZone: { ...ZONE, nameZone: "E2E Otra" },
        status: "MISSED",
        gembaWalkId: null,
      },
    ]);

    await page.goto("/gemba-walk/schedule");
    await expect(
      page.getByText("Selecciona una planta para ver el calendario"),
    ).toBeVisible();
    await choosePlant(page);

    await expect(page.getByText("✗ E2E Otra - Pasillo")).toBeVisible();
    await page.getByText("✓ E2E Zona - Pasillo").click();
    await expect(page).toHaveURL(/\/gemba-walk\/view\?id=9401$/);
    expect(errors).toEqual([]);
  });
});

/** Abre el calendario de mañana y agrega un evento de la zona fija. */
const addEventTomorrow = async (page: Page) => {
  await mockGet(page, "/gemba-walk/zones", [ZONE]);
  // Solo los eventos del calendario; la lista (paginada, a donde se regresa
  // al guardar) consulta la misma ruta y sigue yendo al API.
  await mockGet(page, "/gemba-walk/calendar", [], {
    when: (url) => !url.searchParams.has("page"),
  });

  // Mañana, para que no cuente como pasado.
  const tomorrow = new Date(Date.now() + 24 * 60 * 60_000);
  const day = tomorrow.toLocaleDateString("en-CA");
  await page.goto(`/gemba-walk/calendar/form?date=${day}`);
  await choosePlant(page);

  await page.locator(`td.fc-daygrid-day[data-date="${day}"]`).click();
  const dialog = page.getByRole("dialog", { name: "Agregar eventos" });
  await expect(dialog).toBeVisible();
  await pickOption(page, "Zonas", "E2E Zona - Pasillo");
  // Cierra la lista sin Escape (cerraría el diálogo).
  await dialog.getByText("Agregar eventos").click();
  await dialog.getByRole("button", { name: "Agregar" }).click();
  await dialogsClosed(page);
  await expect(page.getByText("E2E Zona - Pasillo")).toBeVisible();
  return day;
};

/** Mientras un diálogo termina de cerrarse, el siguiente clic se pierde. */
const dialogsClosed = (page: Page) =>
  expect(page.locator(".MuiDialog-root")).toHaveCount(0);

test.describe("Gemba Walk: programación", () => {
  test.describe("en pantalla táctil", () => {
    test.use({
      hasTouch: true,
      isMobile: true,
      viewport: { width: 390, height: 844 },
    });

    test("explica que hay que mantener presionado para elegir días", async ({
      page,
    }) => {
      await mockGet(page, "/gemba-walk/zones", [ZONE]);
      await mockGet(page, "/gemba-walk/calendar", [], {
        when: (url) => !url.searchParams.has("page"),
      });
      await page.goto("/gemba-walk/calendar/form");
      await choosePlant(page);

      await expect(page.getByText(/Mantén presionado un día/)).toBeVisible();
    });
  });

  test("agrega un evento al calendario y lo guarda (sin guardar)", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page, { respond: () => [] });
    const day = await addEventTomorrow(page);

    await saveButton(page).click();
    await expect(
      toast(page, "Calendario guardado correctamente"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/gemba-walk\/calendar$/);

    expect(writes).toEqual([
      {
        method: "POST",
        path: "/gemba-walk/calendar",
        body: {
          events: [
            {
              gembaWalkZoneId: ZONE.id,
              scheduledAt: new Date(`${day}T08:00:00`).toISOString(),
              isAdditional: false,
            },
          ],
        },
      },
    ]);
    expect(errors).toEqual([]);
  });

  test("cancelar con eventos sin guardar pide confirmación", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    await addEventTomorrow(page);

    const cancel = page.getByRole("button", { name: "Cancelar" });
    const confirm = page.getByRole("dialog", { name: "Eventos sin guardar" });
    await cancel.click();
    await expect(confirm).toContainText("1 evento(s) nuevo(s)");
    await confirm.getByRole("button", { name: "Regresar" }).click();
    await dialogsClosed(page);
    await expect(page).toHaveURL(/\/gemba-walk\/calendar\/form/);

    await cancel.click();
    await confirm.getByRole("button", { name: "Salir sin guardar" }).click();
    await expect(page).toHaveURL(/\/gemba-walk\/calendar$/);
    expect(writes).toEqual([]);
  });
});

test.describe("Gemba Walk: catálogos", () => {
  test("crea una zona (sin guardar)", async ({ page }) => {
    const writes = await captureWrites(page);

    await page.goto("/gemba-walk/zones/form");
    await choosePlant(page);
    await page.getByLabel("Zona").fill("E2E Zona (no se guarda)");
    await page.getByLabel("Ubicación").fill("E2E Pasillo");
    await saveButton(page).click();
    await expect(toast(page, "Zona creada correctamente")).toBeVisible();

    expect(writes).toEqual([
      {
        method: "POST",
        path: "/gemba-walk/zones",
        body: {
          manufacturingPlantId: expect.any(Number),
          nameZone: "E2E Zona (no se guarda)",
          nameLocation: "E2E Pasillo",
        },
      },
    ]);
  });

  test("edita una zona desde la tabla (sin guardar)", async ({ page }) => {
    const writes = await captureWrites(page);

    const id = await editFirstRow(page, "/gemba-walk/zones");
    await expect(page.getByLabel("Zona")).toHaveValue(/\S/);
    const nameZone = await page.getByLabel("Zona").inputValue();
    await saveButton(page).click();
    await expect(toast(page, "Zona actualizada correctamente")).toBeVisible();

    expect(writes).toEqual([
      {
        method: "PATCH",
        path: `/gemba-walk/zones/${id}`,
        body: expect.objectContaining({ nameZone: nameZone.trim() }),
      },
    ]);
  });

  test("crea un concepto de evaluación (sin guardar)", async ({ page }) => {
    const writes = await captureWrites(page);

    await page.goto("/gemba-walk/evaluations/form");
    await choosePlant(page);
    await pickOption(page, "Categoría", "SHE");
    await page.getByLabel("Área").fill("E2E EPP");
    await page.getByLabel("Descripción").fill("E2E verificar lentes");
    await saveButton(page).click();
    await expect(toast(page, "Concepto creado correctamente")).toBeVisible();

    expect(writes).toEqual([
      {
        method: "POST",
        path: "/gemba-walk/evaluations",
        body: {
          manufacturingPlantId: expect.any(Number),
          category: "SHE",
          area: "E2E EPP",
          description: "E2E verificar lentes",
        },
      },
    ]);
  });

  test("edita un concepto desde la tabla (sin guardar)", async ({ page }) => {
    const writes = await captureWrites(page);

    const id = await editFirstRow(page, "/gemba-walk/evaluations");
    await expect(page.getByLabel("Descripción")).toHaveValue(/\S/);
    await saveButton(page).click();
    await expect(
      toast(page, "Concepto actualizado correctamente"),
    ).toBeVisible();

    expect(writes).toEqual([
      expect.objectContaining({
        method: "PATCH",
        path: `/gemba-walk/evaluations/${id}`,
      }),
    ]);
  });

  test("crea varios observadores en una zona (sin guardar)", async ({
    page,
  }) => {
    const writes = await captureWrites(page, {
      // El API regresa un observador por usuario.
      respond: ({ body }) =>
        (body as { userIds: number[] }).userIds.map((userId) => ({
          id: userId,
        })),
    });

    await page.goto("/gemba-walk/observers/form");
    await choosePlant(page);
    await pickOption(page, "Zona");
    const users = await pickMany(page, "Usuarios", 2);
    await saveButton(page).click();
    await expect(
      toast(page, `${users.length} observadores creados correctamente`),
    ).toBeVisible();

    expect(writes).toEqual([
      {
        method: "POST",
        path: "/gemba-walk/observers",
        body: {
          manufacturingPlantId: expect.any(Number),
          gembaWalkZoneId: expect.any(Number),
          userIds: [expect.any(Number), expect.any(Number)],
        },
      },
    ]);
  });

  test("edita un observador desde la tabla (sin guardar)", async ({ page }) => {
    const writes = await captureWrites(page);

    const id = await editFirstRow(page, "/gemba-walk/observers");
    // Guardar se habilita cuando cargan planta, zona y usuario.
    await expect(saveButton(page)).toBeEnabled();
    await saveButton(page).click();
    await expect(
      toast(page, "Observador actualizado correctamente"),
    ).toBeVisible();

    expect(writes).toEqual([
      {
        method: "PATCH",
        path: `/gemba-walk/observers/${id}`,
        body: {
          manufacturingPlantId: expect.any(Number),
          gembaWalkZoneId: expect.any(Number),
          userId: expect.any(Number),
        },
      },
    ]);
  });
});
