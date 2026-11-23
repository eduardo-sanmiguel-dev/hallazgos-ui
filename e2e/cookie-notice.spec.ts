import { expect, test } from "./support/fixtures";

// El aviso se ve sin sesión, desde el login. El resto de la suite lo da por
// visto (fixture cookieNotice); aquí se revisa de verdad.
test.use({ cookieNotice: true, storageState: { cookies: [], origins: [] } });

const notice = (page: import("@playwright/test").Page) =>
  page.getByRole("region", { name: "Aviso de cookies" });

test("aviso de cookies: 'Entendido' lo cierra y no vuelve a aparecer", async ({ page }) => {
  await page.goto("/");
  await expect(notice(page)).toContainText("No usamos cookies de publicidad");

  await notice(page).getByRole("button", { name: "Entendido" }).click();
  await expect(notice(page)).toBeHidden();

  await page.reload();
  await expect(page.getByRole("button", { name: "Iniciar", exact: true })).toBeVisible();
  await expect(notice(page)).toBeHidden();
});

test("aviso de cookies: el enlace abre la política y cuenta como visto", async ({ page }) => {
  await page.goto("/");
  await notice(page).getByRole("link", { name: "política de privacidad" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { name: "Cookies y almacenamiento" })).toBeVisible();
  await expect(notice(page)).toBeHidden();
});

test("aviso de cookies: en celular queda por encima del contenido, dentro de la pantalla", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const box = await notice(page).boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(16);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390 - 16);
  expect(box!.y + box!.height).toBeLessThanOrEqual(844);
});
