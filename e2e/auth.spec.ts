import { expect, test } from "./support/fixtures";

import { e2eCredentials } from "./support/env";
import { expectLoggedIn, loginWithForm } from "./support/login";
import { toast } from "./support/ui";

// Sin la sesión guardada: cada prueba parte sin cookie.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Sesión", () => {
  test("una ruta protegida sin sesión regresa al inicio (con la ruta pedida)", async ({ page }) => {
    await page.goto("/hallazgos");
    await expect(page).toHaveURL(/\/\?next=%2Fhallazgos$/);
    await expect(page.getByRole("button", { name: "Iniciar" })).toBeVisible();
  });

  test("el logo es el título del inicio de sesión (lector de pantalla)", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "ComportArte · Hada International" }),
    ).toBeVisible();
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

    await expect(toast(page, "El correo electrónico es requerido")).toBeVisible();
    expect(loginCalls).toBe(0);
  });

  test("rechaza una contraseña incorrecta", async ({ page }) => {
    const { email } = e2eCredentials();

    const response = page.waitForResponse((r) => r.url().includes("/auth/login"));
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
    await expect(page).toHaveURL(/\/\?next=%2Fdashboard$/);
  });

  // El API real invalidaría también la sesión guardada que usan las demás
  // pruebas en paralelo: aquí se intercepta y se prueba el UI. La
  // revocación real la cubre hallazgos-api (test/db/auth.db-spec.ts).
  test("cerrar todas las sesiones pide confirmación y sale", async ({ page }) => {
    const { email, password } = e2eCredentials();
    let logoutAllCalls = 0;
    await page.route("**/api/v1/auth/logout-all", async (route) => {
      logoutAllCalls++;
      // Como el API: la respuesta borra la cookie de sesión.
      await page.context().clearCookies({ name: "token" });
      return route.fulfill({
        json: { message: "Sesión cerrada en todos los dispositivos." },
      });
    });

    await loginWithForm(page, email, password);
    await expectLoggedIn(page);

    const openOption = async () => {
      await page.getByRole("button", { name: /^Cuenta de / }).click();
      await page.getByRole("menuitem", { name: /Cerrar todas mis sesiones/ }).click();
    };
    const dialog = page.getByRole("dialog", { name: "¿Cerrar todas tus sesiones?" });

    // Volver no cierra nada.
    await openOption();
    await expect(dialog).toContainText("en todos tus dispositivos");
    await dialog.getByRole("button", { name: "Volver" }).click();
    await expect(dialog).toBeHidden();
    expect(logoutAllCalls).toBe(0);

    await openOption();
    await dialog.getByRole("button", { name: "Cerrar todas" }).click();

    await expect(toast(page, "Sesión cerrada en todos los dispositivos.")).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    expect(logoutAllCalls).toBe(1);
  });
});
