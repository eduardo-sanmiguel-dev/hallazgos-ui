import type { Page } from "@playwright/test";

import { captureWrites, editingId, mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import {
  choosePlant,
  pickMany,
  pickOption,
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
    await page.getByRole("switch", { name: "EPP: cumple" }).click();
    await expect(page.getByText("NC: 1")).toBeVisible();
    await page
      .getByLabel("Comentarios")
      .first()
      .fill("  Dos personas sin lentes  ");

    await finish.click();
    const dialog = page.getByRole("dialog", { name: "Confirmar registro" });
    await expect(dialog).toContainText("1 C y 1 NC");
    await dialog.getByRole("button", { name: "Registrar" }).click();

    await expect(toast(page, "Recorrido registrado correctamente")).toBeVisible();
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
  test("agrega un evento al calendario y lo guarda (sin guardar)", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page, { respond: () => [] });
    const day = await addEventTomorrow(page);

    await saveButton(page).click();
    await expect(toast(page, "Calendario guardado correctamente")).toBeVisible();
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
    await expect(toast(page, "Concepto actualizado correctamente")).toBeVisible();

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
