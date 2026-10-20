import { expect, type Page } from "@playwright/test";

/** Inicia sesión desde el formulario real de la página de inicio. */
export const loginWithForm = async (
  page: Page,
  email: string,
  password: string,
) => {
  await page.goto("/");
  await page.getByLabel("Correo Electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar" }).click();
};

export const expectLoggedIn = async (page: Page) => {
  await expect(page).toHaveURL(/\/dashboard/);
};
