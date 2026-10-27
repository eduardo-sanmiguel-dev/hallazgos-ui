import { expect, type Page } from "@playwright/test";

/**
 * Despliega la barra "Filtros" (inicia cerrada). Sin barra visible (p. ej. en
 * un formulario o detrás de un diálogo) no hace nada.
 */
export const openFilters = async (page: Page) => {
  // La página se pinta cuando ya se conoce la sesión (RouteAccessGuard).
  await expect(page.locator("[data-route-access=pending]")).toHaveCount(0);
  const toggle = page
    .getByRole("region", { name: "Filtros" })
    .getByRole("button", { name: /^Filtros/ });
  if (!(await toggle.count())) return;
  if ((await toggle.getAttribute("aria-expanded")) === "false") {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  }
};

/** Elige una opción de un SelectDefault (Autocomplete de MUI) por su etiqueta. */
export const pickOption = async (
  page: Page,
  label: string,
  option?: string | RegExp,
) => {
  await openFilters(page);
  const input = page.getByRole("combobox", { name: label, exact: true });
  await expect(input).toBeEnabled();
  await input.click();

  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  const options = listbox.getByRole("option");
  await expect(options.first()).toBeVisible();

  const target = option
    ? options.filter({ hasText: option }).first()
    : options.first();
  const text = (await target.innerText()).trim();
  await target.click();
  return text;
};

/** Número del chip "N registros" de la barra de filtros. */
export const recordCount = async (page: Page) => {
  const chip = page.getByText(/^\d+ registros?$/).first();
  await expect(chip).toBeVisible();
  return Number((await chip.innerText()).split(" ")[0]);
};

/**
 * Aviso (toast) con el texto dado; no confunde textos de ayuda iguales. Se
 * busca por atributo y no por rol: con un diálogo abierto, MUI marca el resto
 * de la página con aria-hidden.
 */
export const toast = (page: Page, text: string | RegExp) =>
  page.locator("[data-sonner-toast]").getByText(text);

/** Falla la prueba si la página lanza un error de JavaScript. */
export const trackPageErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
};

/** Elige las primeras `count` opciones de un multiselect de MUI y lo cierra. */
export const pickMany = async (page: Page, label: string, count = 1) => {
  await openFilters(page);
  await page.getByRole("combobox", { name: label, exact: true }).click();

  // "Todos" / "Ninguno" seleccionan o limpian todo: no cuentan.
  const options = page
    .getByRole("listbox")
    .getByRole("option")
    .filter({ hasNotText: /^(Todos|Ninguno)$/ });
  await expect(options.first()).toBeVisible();

  const picked: string[] = [];
  for (let i = 0; i < count; i++) {
    const option = options.nth(i);
    picked.push((await option.innerText()).trim());
    await option.click();
  }
  await page.keyboard.press("Escape");
  return picked;
};

/** Escribe una fecha DD/MM/AAAA en un DatePicker de MUI X. */
export const fillDate = async (page: Page, label: string, date: string) => {
  await openFilters(page);
  await page
    .getByRole("group", { name: label })
    .getByRole("spinbutton")
    .first()
    .click();
  await page.keyboard.type(date.replace(/\D/g, ""));
};

/** Elige planta en SelectManufacturingPlantsOwn (con una sola, se elige sola). */
export const choosePlant = async (page: Page) => {
  await openFilters(page);
  const input = page.getByRole("combobox", { name: "Planta", exact: true });
  // SelectDefault pinta la opción elegida junto al input (renderValue), no
  // dentro de él: se revisa el texto del Autocomplete.
  const selected = page
    .locator(".MuiAutocomplete-root", { has: input })
    .locator(".MuiAutocomplete-renderedValue, .MuiInputBase-root");
  await expect(input).toBeVisible();
  if (!(await selected.first().innerText()).replace(/Planta/g, "").trim()) {
    await pickOption(page, "Planta");
  }
};

/** Plantas del usuario según la sesión que el layout carga al entrar. */
export const sessionPlants = async (page: Page) => {
  const handle = await page.waitForFunction(
    () =>
      JSON.parse(sessionStorage.getItem("user-session") || "{}").state
        ?.manufacturingPlants?.length &&
      JSON.parse(sessionStorage.getItem("user-session")!).state
        .manufacturingPlants,
  );
  return (await handle.jsonValue()) as { id: number; name: string }[];
};
