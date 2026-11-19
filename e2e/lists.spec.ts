import type { Page } from "@playwright/test";

import { captureWrites } from "./support/api";
import { expect, test } from "./support/fixtures";
import { openFilters, trackPageErrors } from "./support/ui";

// Listados: botones del encabezado (Actualizar y altas), cada filtro de la
// barra "Filtros" (quitar chip por chip, "Limpiar todo" y limpiar), paginar y
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

/** Llena cada texto, fecha y select de la barra de filtros. */
const fillFilters = async (page: Page) => {
  const bar = page.getByRole("region", { name: "Filtros" });
  await openFilters(page);

  // Fechas (DatePicker de MUI X): se escribe el día de hoy.
  const today = new Date();
  const typed = [today.getDate(), today.getMonth() + 1]
    .map((n) => String(n).padStart(2, "0"))
    .join("")
    .concat(String(today.getFullYear()));
  const dates = bar.getByRole("group").filter({ has: page.getByRole("spinbutton") });
  for (let i = 0; i < (await dates.count()); i++) {
    await dates.nth(i).getByRole("spinbutton").first().click();
    await page.keyboard.type(typed);
    await page.waitForTimeout(300);
  }

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
    if (
      !(await combobox.click({ timeout: 3000 }).then(
        () => true,
        () => false,
      ))
    )
      continue;
    const options = page
      .getByRole("listbox")
      .getByRole("option")
      .filter({ hasNotText: /^(Ninguna|Ninguno|Todos|Todas|Seleccione)$/ });
    if (
      await options
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await options.first().click();
    }
    // Los filtros (SelectDefault) se limpian con Escape: solo se cierra la
    // lista si sigue abierta (p. ej. selección múltiple).
    if (
      await page
        .getByRole("listbox")
        .isVisible()
        .catch(() => false)
    ) {
      await page.keyboard.press("Escape");
    }
    await page.waitForTimeout(300);
  }
};

/** Cierra el panel: los filtros aplicados se ven como chips. */
const collapseFilters = async (page: Page) => {
  const toggle = page
    .getByRole("region", { name: "Filtros" })
    .getByRole("button", { name: /^Filtros/ });
  if ((await toggle.getAttribute("aria-expanded")) === "true") await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
};

/**
 * Aplica los filtros y los quita de las tres formas: chip por chip, "Limpiar
 * todo" (con el panel cerrado) y "Limpiar filtros" (con el panel abierto).
 */
const exerciseFilters = async (page: Page) => {
  const bar = page.getByRole("region", { name: "Filtros" });
  if (!(await bar.count())) return;

  const applied = page.getByRole("group", { name: "Filtros aplicados" });
  const removeIcons = applied.locator(".MuiChip-deleteIcon");

  await fillFilters(page);
  await collapseFilters(page);
  // Cada chip una vez, del último al primero (las posiciones no se mueven).
  // Algunos vuelven a su valor predeterminado (p. ej. las fechas del mes en
  // Gemba Walk), así que no siempre desaparecen todos.
  const appliedCount = await removeIcons.count();
  for (let i = appliedCount - 1; i >= 0; i--) {
    if (i >= (await removeIcons.count())) continue;
    await removeIcons.nth(i).click();
    await page.waitForTimeout(300);
  }
  expect(await removeIcons.count()).toBeLessThanOrEqual(appliedCount);

  await fillFilters(page);
  await collapseFilters(page);
  const clearAll = applied.getByRole("button", { name: "Limpiar todo" });
  if (await clearAll.isVisible().catch(() => false)) await clearAll.click();

  await fillFilters(page);
  const clear = page.getByRole("button", { name: "Limpiar filtros" });
  if (await clear.isVisible()) {
    await clear.click();
    await expect(clear).toBeHidden();
  }
  await page.waitForLoadState("networkidle");
};

/**
 * Botones del encabezado: "Actualizar" vuelve a consultar el API y cada
 * acción (Crear…, Registrar…, Ver calendario) abre su pantalla o diálogo.
 */
const exerciseHeader = async (page: Page, route: string) => {
  const header = page.locator("header").filter({ has: page.getByRole("heading", { level: 1 }) });
  // Con un diálogo abierto MUI oculta la página: no se saltan los botones.
  await expect(header).toHaveCount(1);

  const refresh = header.getByRole("button", { name: "Actualizar", exact: true });
  if (await refresh.count()) {
    // Sin planta elegida (p. ej. EPP) no hay nada que volver a consultar.
    const reload = page
      .waitForRequest(
        (request) => request.url().includes("/api/v1/") && request.method() === "GET",
        { timeout: 5_000 },
      )
      .catch(() => undefined);
    await refresh.click();
    await reload;
    await page.waitForLoadState("networkidle");
  }

  const actions = header.getByRole("button").filter({ hasNotText: /^$/ });
  for (let i = 0; i < (await actions.count()); i++) {
    const action = actions.nth(i);
    if (!(await action.isEnabled())) continue;
    // Descargas (Excel) y subidas (selector de archivo) no navegan ni abren diálogo.
    let handled = false;
    const onDownload = () => (handled = true);
    const onFileChooser = () => (handled = true);
    page.once("download", onDownload);
    page.once("filechooser", onFileChooser);
    await action.click();
    const dialog = page.getByRole("dialog");
    await expect
      .poll(
        async () => handled || new URL(page.url()).pathname !== route || (await dialog.count()) > 0,
      )
      .toBe(true);
    page.off("download", onDownload);
    page.off("filechooser", onFileChooser);
    if (handled) {
      await page.waitForLoadState("networkidle");
    } else if (new URL(page.url()).pathname !== route) {
      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`${route}$`));
    } else {
      await page.keyboard.press("Escape");
      // Con algo precargado (p. ej. la planta del filtro) pide confirmar.
      const discard = page.getByRole("button", { name: "Descartar" });
      if (await discard.isVisible({ timeout: 1000 }).catch(() => false)) await discard.click();
      await expect(dialog).toHaveCount(0);
    }
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await page.waitForLoadState("networkidle");
  }
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
  for (const name of ["Página siguiente", "Última página", "Página anterior", "Primera página"]) {
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
  // Colaboradores se desactivan en lugar de eliminarse.
  const remove = page.getByRole("button", { name: /^(Eliminar|Desactivar)$/ }).first();
  // Tras cambiar "filas por página" la tabla recarga: sin esperar, no había
  // botones en ese instante y la prueba se saltaba el borrado sin avisar.
  await remove.waitFor({ timeout: 10_000 }).catch(() => undefined);
  if (!(await remove.count()) || !(await remove.isEnabled())) return false;
  await remove.click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /Cancelar|Volver/ }).click();
  await expect(dialog).toBeHidden();
  await remove.click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /^(Eliminar|Desactivar|Confirmar)/ })
    .click();
  return true;
};

for (const route of LISTS) {
  test(`listado ${route}: filtros, paginación y eliminar (sin guardar)`, async ({ page }) => {
    test.setTimeout(120_000);
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);

    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await page.waitForLoadState("networkidle");

    await exerciseFilters(page);
    await paginate(page);
    if (await removeFirst(page)) {
      await expect.poll(() => writes.filter((w) => w.method === "DELETE").length).toBe(1);
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    // Al final: volver de otra pantalla monta la lista de nuevo.
    await exerciseHeader(page, route);
    expect(writes.filter((w) => w.method !== "DELETE")).toEqual([]);
    expect(errors).toEqual([]);
  });
}
