import { expect, test } from "@playwright/test";

import { e2eCredentials } from "./support/env";
import { expectLoggedIn, loginWithForm } from "./support/login";
import { toast } from "./support/ui";

// Sin la sesión guardada: cada prueba parte sin cookie.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Sesión", () => {
  test("una ruta protegida sin sesión regresa al inicio", async ({ page }) => {
    await page.goto("/hallazgos");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: "Iniciar" })).toBeVisible();
  });

  test("valida campos vacíos sin llamar al API", async ({ page }) => {
    let loginCalls = 0;
    page.on("request", (request) => {
      if (request.url().includes("/auth/login")) loginCalls++;
    });

    await page.goto("/");
    // En desarrollo el formulario viene prellenado: se vacía.
    await page.getByLabel("Correo Electrónico").fill("");
    await page.getByLabel("Contraseña", { exact: true }).fill("");
    await page.getByRole("button", { name: "Iniciar" }).click();

    await expect(
      toast(page, "El correo electrónico es requerido"),
    ).toBeVisible();
    expect(loginCalls).toBe(0);
  });

  test("rechaza una contraseña incorrecta", async ({ page }) => {
    const { email } = e2eCredentials();

    const response = page.waitForResponse((r) =>
      r.url().includes("/auth/login"),
    );
    await loginWithForm(page, email, "contraseña-incorrecta-e2e");

    expect((await response).ok()).toBe(false);
    await expect(page).toHaveURL(/\/$/);
  });

  test("inicia y cierra sesión", async ({ page }) => {
    const { email, password } = e2eCredentials();

    await loginWithForm(page, email, password);
    await expectLoggedIn(page);

    await page.getByRole("button", { name: /^Cuenta de / }).click();
    await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();

    await expect(page).toHaveURL(/\/$/);
    // La cookie ya no da acceso.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/$/);
  });
});
