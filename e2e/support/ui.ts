import { expect, type Page } from "@playwright/test";

/** Elige una opción de un SelectDefault (Autocomplete de MUI) por su etiqueta. */
export const pickOption = async (
  page: Page,
  label: string,
  option?: string | RegExp,
) => {
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

/** Aviso (toast) con el texto dado; no confunde textos de ayuda iguales. */
export const toast = (page: Page, text: string | RegExp) =>
  page.getByRole("region", { name: /Notifications/ }).getByText(text);

/** Falla la prueba si la página lanza un error de JavaScript. */
export const trackPageErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
};
