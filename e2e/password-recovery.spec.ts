import type { Page } from "@playwright/test";

import { captureWrites } from "./support/api";
import { expect, test } from "./support/fixtures";
import { toast } from "./support/ui";

// Recuperación y restablecimiento de contraseña, sin sesión. Las peticiones
// al API se interceptan: no se envían correos ni se cambian contraseñas.

test.use({ storageState: { cookies: [], origins: [] } });

const respondMessage = { respond: () => ({ message: "E2E listo" }) };

/** Envía el formulario con `email` y espera el aviso de validación. */
const submitExpecting = async (page: Page, button: string, message: string) => {
  await page.getByRole("button", { name: button }).click();
  await expect(toast(page, message).first()).toBeVisible();
};

test.describe("Contraseña", () => {
  test("muestra y oculta la contraseña del login", async ({ page }) => {
    await page.goto("/");
    const password = page.getByLabel("Contraseña", { exact: true });
    await password.fill("secreto");
    await page.getByRole("button", { name: "display the password" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "hide the password" }).click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("pide el correo de recuperación (sin enviarlo)", async ({ page }) => {
    const writes = await captureWrites(page, respondMessage);
    await page.goto("/");
    await page.getByText("¿Has olvidado tu contraseña?").click();

    const email = page.getByLabel("Correo Electrónico");
    const send = "Enviar correo de recuperación";
    await email.fill("");
    await submitExpecting(page, send, "El correo electrónico es requerido");
    await email.fill("no-es-correo");
    await submitExpecting(page, send, "El correo electrónico no es válido");
    expect(writes).toEqual([]);

    await email.fill("e2e@example.com");
    await submitExpecting(page, send, "E2E listo");
    expect(writes).toEqual([
      {
        method: "POST",
        path: "/auth/forgot-password",
        body: { email: "e2e@example.com" },
      },
    ]);
    // Regresa al login.
    await expect(page.getByRole("button", { name: "Iniciar" })).toBeVisible();
  });

  test("restablece la contraseña con el token del correo (sin guardar)", async ({
    page,
  }) => {
    const writes = await captureWrites(page, respondMessage);
    // El servidor valida el token contra el API (un token de prueba se
    // rechaza); con pushState, Next actualiza la URL sin pedirla al servidor.
    await page.goto("/");
    // Tras hidratar: el login ya responde.
    await expect(page.getByRole("button", { name: "Iniciar" })).toBeVisible();
    await page.waitForLoadState("networkidle");
    // "Iniciar" ya viene del servidor: si el pushState llega antes de que
    // Next termine de hidratar, no lo ve. Se repite hasta que aparece el
    // formulario de restablecer.
    await expect(async () => {
      await page.evaluate(() =>
        window.history.pushState(null, "", "/?token=token-e2e"),
      );
      await expect(page.getByLabel("Nueva contraseña")).toBeVisible({
        timeout: 1_000,
      });
    }).toPass();

    const email = page.getByLabel("Correo Electrónico");
    const password = page.getByLabel("Nueva contraseña");
    const confirm = page.getByLabel("Repetir contraseña");
    const send = "Restablecer contraseña y entrar";

    await email.fill("");
    await submitExpecting(page, send, "El correo electrónico es requerido");
    await email.fill("e2e@example.com");
    await password.fill("");
    await submitExpecting(page, send, "La contraseña es requerida");
    await password.fill("nueva-e2e-123");
    await confirm.fill("otra");
    await submitExpecting(page, send, "Las contraseñas no coinciden");
    await confirm.fill("nueva-e2e-123");
    await email.fill("no-es-correo");
    await submitExpecting(page, send, "El correo electrónico no es válido");
    expect(writes).toEqual([]);

    await email.fill("e2e@example.com");
    await submitExpecting(page, send, "E2E listo");
    expect(writes).toEqual([
      {
        method: "POST",
        path: "/auth/login-restore-password",
        body: expect.objectContaining({
          email: "e2e@example.com",
          password: "nueva-e2e-123",
          token: "token-e2e",
        }),
      },
    ]);
  });
});
