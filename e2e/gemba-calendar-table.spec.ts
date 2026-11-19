import type { Page } from "@playwright/test";

import { captureWrites, mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import { toast, trackPageErrors } from "./support/ui";

// Lista de eventos programados de Gemba Walk: editar lleva al calendario de
// la planta y eliminar solo aplica a eventos futuros. Lecturas simuladas y
// escrituras interceptadas.

const NOW = new Date("2026-11-18T15:00:00.000Z");

const event = (scheduledAt: string) => ({
  id: 9901,
  scheduledAt,
  isAdditional: false,
  gembaWalkZone: {
    id: 1,
    nameZone: "E2E Zona",
    nameLocation: "E2E Ubicación",
    manufacturingPlant: { id: 1, name: "E2E Planta" },
  },
  createdBy: { name: "E2E" },
  updatedBy: null,
  createdAt: NOW.toISOString(),
  updatedAt: NOW.toISOString(),
});

const serveEvents = (page: Page, rows: unknown[]) =>
  mockGet(
    page,
    "/gemba-walk/calendar",
    { data: rows, count: rows.length },
    { when: (url) => url.searchParams.has("page") },
  );

test.describe("Gemba Walk: eventos programados", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: NOW });
  });

  test("un evento futuro se elimina tras confirmar y se edita en su calendario", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);
    await serveEvents(page, [event("2026-11-20T15:00:00.000Z")]);
    await page.goto("/gemba-walk/calendar");

    await page.getByRole("button", { name: "Eliminar" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Eliminar" }).click();
    await expect(toast(page, "Evento eliminado correctamente")).toBeVisible();
    expect(writes).toEqual([
      expect.objectContaining({ method: "DELETE", path: "/gemba-walk/calendar/9901" }),
    ]);

    await page.getByRole("table").getByRole("button", { name: "Editar" }).click();
    await expect(page).toHaveURL(
      /\/gemba-walk\/calendar\/form\?manufacturingPlantId=1&date=2026-11-20$/,
    );
    expect(errors).toEqual([]);
  });

  test("si el evento ya pasó al confirmar, no se elimina", async ({ page }) => {
    const writes = await captureWrites(page);
    await serveEvents(page, [event("2026-11-18T15:05:00.000Z")]);
    await page.goto("/gemba-walk/calendar");

    await page.getByRole("button", { name: "Eliminar" }).click();
    await page.clock.fastForward("10:00");
    await page.getByRole("dialog").getByRole("button", { name: "Eliminar" }).click();

    await expect(toast(page, "No se pueden eliminar eventos pasados")).toBeVisible();
    expect(writes).toEqual([]);
  });
});
