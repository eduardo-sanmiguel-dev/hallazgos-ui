import { expect, type Page } from "@playwright/test";

/** Inicia sesión desde el formulario real de la página de inicio. */
export const loginWithForm = async (page: Page, email: string, password: string) => {
  await page.goto("/");
  await page.getByLabel("Correo Electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  // El tiempo de la petición no incluye el arranque de la UI ni llenar campos.
  const [response] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname.endsWith("/auth/login"),
    ),
    page.getByRole("button", { name: "Iniciar" }).click(),
  ]);
  return response;
};

export const expectLoggedIn = async (page: Page) => {
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
};
