import type { Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";
import { trackPageErrors } from "./support/ui";

// Enlace de baja al pie de los avisos de planta: se abre sin sesión. El token
// real lo firma el API con su secreto, así que aquí se simulan sus respuestas
// (y nada se escribe en la base).
test.use({ storageState: { cookies: [], origins: [] } });

const TOKEN = "7.firma-de-prueba";

/** Simula /mail-preferences y devuelve lo que el UI envió, en orden. */
const mockPreferences = async (
  page: Page,
  { subscribed = true, status = 200 }: { subscribed?: boolean; status?: number } = {},
) => {
  const sent: { path: string; body: unknown }[] = [];
  let current = subscribed;
  await page.route(
    (url) => url.pathname.includes("/api/v1/mail-preferences"),
    async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/^.*\/api\/v1/, "");
      const body = route.request().postDataJSON() as { plantNotifications?: boolean };
      sent.push({ path, body });
      if (status !== 200)
        return route.fulfill({
          status,
          json: {
            statusCode: status,
            code: "NOT_FOUND",
            message: "El enlace no es válido o la cuenta ya no está activa.",
            error: "Not Found",
          },
        });
      if (path === "/mail-preferences") current = !!body.plantNotifications;
      return route.fulfill({
        status: 200,
        json: { email: "p••••••@planta.com", plantNotifications: current },
      });
    },
  );
  return sent;
};

test("baja: pide confirmar, da de baja y permite volver", async ({ page }) => {
  const errors = trackPageErrors(page);
  const sent = await mockPreferences(page);

  await page.goto(`/unsubscribe?token=${TOKEN}`);
  await expect(page).toHaveTitle("Avisos por correo | HADA");
  await expect(
    page.getByRole("heading", { name: "¿Dejar de recibir los avisos de la planta?" }),
  ).toBeVisible();
  await expect(page.getByText("p••••••@planta.com", { exact: false })).toBeVisible();
  // Abrir el enlace no da de baja: solo consulta (los antivirus lo abren solos).
  expect(sent).toEqual([{ path: "/mail-preferences/lookup", body: { unsubscribeToken: TOKEN } }]);

  await page.getByRole("button", { name: "Dejar de recibir avisos" }).click();
  await expect(
    page.getByRole("heading", { name: "Ya no recibes los avisos de la planta" }),
  ).toBeVisible();
  await expect(page.getByText(/asignen o que reportes/)).toBeVisible();

  await page.getByRole("button", { name: "Volver a recibir avisos" }).click();
  await expect(
    page.getByRole("heading", { name: "¿Dejar de recibir los avisos de la planta?" }),
  ).toBeVisible();

  expect(sent.slice(1)).toEqual([
    { path: "/mail-preferences", body: { unsubscribeToken: TOKEN, plantNotifications: false } },
    { path: "/mail-preferences", body: { unsubscribeToken: TOKEN, plantNotifications: true } },
  ]);
  expect(errors).toEqual([]);
});

test("baja: un enlace ya dado de baja ofrece volver a recibir", async ({ page }) => {
  await mockPreferences(page, { subscribed: false });

  await page.goto(`/unsubscribe?token=${TOKEN}`);

  await expect(
    page.getByRole("heading", { name: "Ya no recibes los avisos de la planta" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Volver a recibir avisos" })).toBeVisible();
});

test("baja: un enlace inválido lo dice y no cambia nada", async ({ page }) => {
  const sent = await mockPreferences(page, { status: 404 });

  await page.goto(`/unsubscribe?token=${TOKEN}`);

  await expect(page.getByRole("heading", { name: "El enlace no es válido" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Dejar de recibir/ })).toHaveCount(0);
  expect(sent.map(({ path }) => path)).toEqual(["/mail-preferences/lookup"]);
});

test("baja: sin token no consulta al API", async ({ page }) => {
  const sent = await mockPreferences(page);

  await page.goto("/unsubscribe");

  await expect(page.getByRole("heading", { name: "El enlace no es válido" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reintentar" })).toHaveCount(0);
  expect(sent).toEqual([]);
});
