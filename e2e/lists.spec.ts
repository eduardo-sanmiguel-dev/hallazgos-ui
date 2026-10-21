import type { Page } from "@playwright/test";

import { captureWrites } from "./support/api";
import { expect, test } from "./support/fixtures";
import { openFilters, trackPageErrors } from "./support/ui";

// Listados: cada filtro de la barra "Filtros", limpiar filtros, paginar y
// eliminar el primer registro tras confirmar. Las eliminaciones se
// interceptan (captureWrites): no se toca la base.

const LISTS = [
  "/areas",
  "/zones",
  "/processes",
  "/main-types",
  "/secondary-types",
  "/manufacturing-plants",
  "/users",
  "/employees",
  "/emergency-teams",
  "/equipments",
  "/epp",
  "/ics",
  "/ciael",
  "/hds",
  "/extinguisher-inspection",
  "/gemba-walk",
  "/gemba-walk/zones",
  "/gemba-walk/observers",
  "/gemba-walk/evaluations",
  "/gemba-walk/calendar",
];

/** Llena cada texto y elige una opción en cada select de la barra de filtros. */
const exerciseFilters = async (page: Page) => {
  const bar = page.getByRole("region", { name: "Filtros" });
  if (!(await bar.count())) return;
  await openFilters(page);

  const textboxes = bar.getByRole("textbox");
  for (let i = 0; i < (await textboxes.count()); i++) {
    const textbox = textboxes.nth(i);
    if (!(await textbox.isEditable())) continue;
    await textbox.fill("1");
    await page.waitForTimeout(600);
  }

  // Los selects pueden aparecer al elegir otros (p. ej. tras la planta).
  for (let i = 0; i < (await bar.getByRole("combobox").count()); i++) {
    const combobox = bar.getByRole("combobox").nth(i);
    if (!(await combobox.isEnabled())) continue;
    // Puede deshabilitarse al cambiar otro filtro.
    if (!(await combobox.click({ timeout: 3000 }).then(() => true, () => false)))
      continue;
    const options = page
      .getByRole("listbox")
      .getByRole("option")
      .filter({ hasNotText: /^(Ninguna|Ninguno|Todos|Todas|Seleccione)$/ });
    if (await options.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await options.first().click();
    }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }

  const clear = page.getByRole("button", { name: "Limpiar filtros" });
  if (await clear.isVisible()) {
    await clear.click();
    await expect(clear).toBeHidden();
  }
  await page.waitForLoadState("networkidle");
};

/** Clic solo si el control existe y está habilitado (p. ej. en la última página). */
const clickIfEnabled = async (page: Page, name: string) => {
  const button = page.getByRole("button", { name }).first();
  if ((await button.count()) && (await button.isEnabled())) {
    // Puede deshabilitarse mientras recarga la página anterior.
    await button.click({ timeout: 3000 }).catch(() => {});
    await page.waitForLoadState("networkidle");
  }
};

const paginate = async (page: Page) => {
  for (const name of [
    "Página siguiente",
    "Última página",
    "Página anterior",
    "Primera página",
  ]) {
    await clickIfEnabled(page, name);
  }
  const rowsPerPage = page.getByRole("combobox", { name: /Filas por página/ });
  if (await rowsPerPage.count()) {
    await rowsPerPage.first().click();
    const last = page.getByRole("listbox").getByRole("option").last();
    if (await last.isVisible({ timeout: 3000 }).catch(() => false)) {
      await last.click();
    } else {
      await page.keyboard.press("Escape");
    }
  }
};

const removeFirst = async (page: Page) => {
  const remove = page.getByRole("button", { name: "Eliminar" }).first();
  if (!(await remove.count()) || !(await remove.isEnabled())) return false;
  await remove.click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /Cancelar|Volver/ }).click();
  await expect(dialog).toBeHidden();
  await remove.click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /^(Eliminar|Confirmar)/ })
    .click();
  return true;
};

for (const route of LISTS) {
  test(`listado ${route}: filtros, paginación y eliminar (sin guardar)`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);

    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await page.waitForLoadState("networkidle");

    await exerciseFilters(page);
    await paginate(page);
    if (await removeFirst(page)) {
      await expect
        .poll(() => writes.filter((w) => w.method === "DELETE").length)
        .toBe(1);
    }
    expect(writes.filter((w) => w.method !== "DELETE")).toEqual([]);
    expect(errors).toEqual([]);
  });
}
