import type { Page } from "@playwright/test";

import { captureWrites, mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import { pickOption, sessionPlants, toast } from "./support/ui";

// Programación del calendario de Gemba Walk sobre eventos fijos: edición,
// arrastre, eventos pasados y duplicados. Las escrituras se interceptan.

const PLANT = { id: 1, name: "Planta" };
const zone = (id: number, nameZone: string) => ({
  id,
  nameZone,
  nameLocation: "Pasillo",
  isActive: true,
  manufacturingPlant: PLANT,
});
const ZONES = [zone(9101, "E2E Zona"), zone(9102, "E2E Otra")];

const DAY = 24 * 60 * 60_000;
const dayKey = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * DAY).toLocaleDateString("en-CA");
const at = (offsetDays: number, time: string) =>
  new Date(`${dayKey(offsetDays)}T${time}:00`).toISOString();

const savedEvent = (id: number, scheduledAt: string, zoneData = ZONES[0]) => ({
  id,
  scheduledAt,
  isAdditional: false,
  isActive: true,
  gembaWalkZone: zoneData,
});

const SAVED = [
  savedEvent(9311, at(2, "10:00")),
  savedEvent(9312, at(-1, "09:00"), ZONES[1]),
];

const dialogsClosed = (page: Page) =>
  expect(page.locator(".MuiDialog-root")).toHaveCount(0);

/** Abre el calendario dos días adelante con eventos y zonas fijas. */
const openCalendar = async (
  page: Page,
  { zones = ZONES, saved = SAVED } = {},
) => {
  await mockGet(page, "/gemba-walk/zones", zones);
  await mockGet(page, "/gemba-walk/calendar", saved, {
    when: (url) => !url.searchParams.has("page"),
  });
  await page.goto(`/gemba-walk/calendar/form?date=${dayKey(2)}`);
  const [plant] = await sessionPlants(page);
  await pickOption(page, "Planta", plant.name);
};

const event = (page: Page, text: string) =>
  page.locator(".fc-event").filter({ hasText: text });

const dayCell = (page: Page, offsetDays: number) =>
  page.locator(`td.fc-daygrid-day[data-date="${dayKey(offsetDays)}"]`);

const addEvent = async (page: Page, offsetDays: number, zoneName: string) => {
  // En la esquina: al centro puede haber otro evento.
  await dayCell(page, offsetDays).click({ position: { x: 8, y: 8 } });
  const dialog = page.getByRole("dialog", { name: "Agregar eventos" });
  await pickOption(page, "Zonas", zoneName);
  await dialog.getByText("Agregar eventos").click();
  await dialog.getByRole("button", { name: "Agregar" }).click();
  await dialogsClosed(page);
};

test.describe("Gemba Walk: edición del calendario", () => {
  test("edita un evento guardado y guarda el cambio (sin guardar)", async ({
    page,
  }) => {
    const writes = await captureWrites(page, { respond: () => [] });
    await openCalendar(page);

    await event(page, "E2E Zona - Pasillo").click();
    const dialog = page.getByRole("dialog", { name: "Editar evento" });
    await pickOption(page, "Zona", "E2E Otra - Pasillo");
    await dialog.getByLabel("¿Es adicional?").check();
    await dialog.getByRole("button", { name: "Aplicar" }).click();
    await dialogsClosed(page);
    await expect(event(page, "E2E Otra - Pasillo").first()).toBeVisible();

    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(toast(page, "Calendario guardado correctamente")).toBeVisible();
    expect(writes).toEqual([
      {
        method: "PATCH",
        path: "/gemba-walk/calendar",
        body: {
          events: [
            {
              id: 9311,
              gembaWalkZoneId: 9102,
              scheduledAt: at(2, "10:00"),
              isAdditional: true,
            },
          ],
        },
      },
    ]);
  });

  test("volver al estado original deja de contar como cambio", async ({
    page,
  }) => {
    await openCalendar(page);
    const save = page.getByRole("button", { name: "Guardar" });

    await event(page, "E2E Zona - Pasillo").click();
    let dialog = page.getByRole("dialog", { name: "Editar evento" });
    await dialog.getByLabel("¿Es adicional?").check();
    await dialog.getByRole("button", { name: "Aplicar" }).click();
    await dialogsClosed(page);
    await expect(save).toBeEnabled();

    await event(page, "E2E Zona - Pasillo").click();
    dialog = page.getByRole("dialog", { name: "Editar evento" });
    await dialog.getByLabel("¿Es adicional?").uncheck();
    await dialog.getByRole("button", { name: "Aplicar" }).click();
    await dialogsClosed(page);
    await expect(save).toBeDisabled();
  });

  test("al cancelar con cambios pendientes confirma antes de salir", async ({
    page,
  }) => {
    await openCalendar(page);
    await addEvent(page, 3, "E2E Otra - Pasillo");

    await page.getByRole("button", { name: "Cancelar" }).click();
    const confirm = page.getByRole("dialog", { name: "Eventos sin guardar" });
    await expect(confirm).toContainText("1 evento(s) nuevo(s) sin guardar");
    await confirm.getByRole("button", { name: "Regresar" }).click();
    await dialogsClosed(page);
    await expect(page).toHaveURL(/\/gemba-walk\/calendar\/form/);

    await page.getByRole("button", { name: "Cancelar" }).click();
    await page
      .getByRole("dialog", { name: "Eventos sin guardar" })
      .getByRole("button", { name: "Salir sin guardar" })
      .click();
    await expect(page).toHaveURL(/\/gemba-walk\/calendar$/);
  });

  test("los eventos pasados no se editan", async ({ page }) => {
    await openCalendar(page);
    await event(page, "E2E Otra - Pasillo").click();
    await expect(
      toast(page, "Los eventos pasados no se pueden editar"),
    ).toBeVisible();
  });

  test("un evento nuevo se puede quitar antes de guardar", async ({ page }) => {
    await openCalendar(page);
    await addEvent(page, 3, "E2E Otra - Pasillo");
    await dayCell(page, 3).locator(".fc-event").click();
    const dialog = page.getByRole("dialog", { name: "Editar evento" });
    await dialog.getByRole("button", { name: "Quitar" }).click();
    await dialogsClosed(page);
    await expect(page.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  test("omite eventos que ya existen y avisa", async ({ page }) => {
    // Ya hay uno a las 08:00 (la hora por defecto) para esa zona y día.
    await openCalendar(page, {
      saved: [savedEvent(9313, at(2, "08:00"))],
    });
    await addEvent(page, 2, "E2E Zona - Pasillo");
    await expect(
      toast(page, "1 evento(s) omitido(s) porque ya existían"),
    ).toBeVisible();
  });

  test("no deja cambiar de planta con cambios pendientes", async ({ page }) => {
    await openCalendar(page);
    const plants = await sessionPlants(page);
    test.skip(plants.length < 2, "El usuario solo tiene una planta");
    await addEvent(page, 3, "E2E Zona - Pasillo");
    await pickOption(page, "Planta", plants[1].name);
    await expect(
      toast(page, "Guarda los cambios antes de cambiar de planta"),
    ).toBeVisible();
  });

  test("avisa si la planta no tiene zonas", async ({ page }) => {
    await openCalendar(page, { zones: [] });
    await page.locator(`td.fc-daygrid-day[data-date="${dayKey(3)}"]`).click();
    await expect(
      toast(page, "La planta seleccionada no tiene zonas registradas"),
    ).toBeVisible();
  });

  test("arrastra un evento a otro día y cambia a la vista semanal", async ({
    page,
  }) => {
    // El mes completo a la vista: si el día destino cae en la última fila
    // (según la fecha de hoy), Playwright desplaza la página a mitad del
    // arrastre y FullCalendar lo pierde.
    await page.setViewportSize({ width: 1440, height: 1300 });
    const writes = await captureWrites(page, { respond: () => [] });
    await openCalendar(page);

    const target = page.locator(
      `td.fc-daygrid-day[data-date="${dayKey(4)}"] .fc-daygrid-day-frame`,
    );
    await event(page, "E2E Zona - Pasillo").dragTo(target);
    await expect(page.getByRole("button", { name: "Guardar" })).toBeEnabled();

    // A un día pasado se revierte.
    const past = page.locator(
      `td.fc-daygrid-day[data-date="${dayKey(-2)}"] .fc-daygrid-day-frame`,
    );
    if (await past.count()) {
      await event(page, "E2E Zona - Pasillo").dragTo(past);
    }

    await page.getByRole("button", { name: "Semana" }).click();
    await expect(page.locator(".fc-timeGridWeek-view")).toBeVisible();
    await page.getByRole("button", { name: "Mes" }).click();

    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(toast(page, "Calendario guardado correctamente")).toBeVisible();
    expect(writes[0]).toMatchObject({
      method: "PATCH",
      body: {
        events: [
          expect.objectContaining({ id: 9311, scheduledAt: at(4, "10:00") }),
        ],
      },
    });
  });
});
