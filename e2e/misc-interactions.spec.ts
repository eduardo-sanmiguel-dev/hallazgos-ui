import { mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import { trackPageErrors } from "./support/ui";

// Interacciones sueltas que ninguna otra prueba recorre: rutas especiales,
// errores al abrir una página y acciones de una sola pantalla. Solo lectura.

test("la política de privacidad no depende de la sesión", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/privacidad/i);
  await expect(page).toHaveTitle("Política de privacidad | HADA");
});

test("los términos y condiciones no dependen de la sesión", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Términos y condiciones");
  await expect(page).toHaveTitle("Términos y condiciones | HADA");
});

/**
 * Las recargas completas (Reintentar, salir de la sesión, nueva versión) se
 * abortan: el documento actual sigue vivo y su coverage no se pierde.
 */
const abortNextDocument = (page: import("@playwright/test").Page) => {
  const requested: string[] = [];
  return page
    .route(
      (url) => !url.pathname.includes("/api/") && !url.pathname.includes("."),
      (route) => {
        if (route.request().resourceType() !== "document") return route.fallback();
        requested.push(new URL(route.request().url()).pathname);
        return route.abort();
      },
    )
    .then(() => requested);
};

test("una ruta con diagonal final se redirige a la ruta sin ella", async ({ page }) => {
  await page.goto("/users/?x=1");
  await expect(page).toHaveURL(/\/users\?x=1$/);
});

test("si no se puede cargar una página, ofrece reintentar", async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto("/dashboard");
  await expect(page.locator("main#contenido")).toBeVisible();
  await page.waitForLoadState("networkidle");

  // Sin conexión, el módulo de la siguiente página no llega.
  await page.route("**/assets/*.js", (route) => route.abort("internetdisconnected"));
  await page.evaluate(() => {
    window.history.pushState({}, "", "/users");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByRole("heading", { name: "No se pudo mostrar esta página" })).toBeVisible();

  await page.unroute("**/assets/*.js");
  const reloads = await abortNextDocument(page);
  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect.poll(() => reloads).toEqual(["/users"]);
  // El error del módulo se registra en consola, no como error de la página.
  expect(errors).toEqual([]);
});

test("hallazgos: Actualizar vuelve a consultar la lista", async ({ page }) => {
  await page.goto("/hallazgos");
  await page.waitForLoadState("networkidle");
  const reload = page.waitForRequest((request) =>
    new URL(request.url()).pathname.endsWith("/api/v1/evidences"),
  );
  await page.getByRole("button", { name: "Actualizar", exact: true }).click();
  await reload;
});

test("HDS: 'Ver archivo' abre el PDF en otra pestaña", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { opened: string[] }).opened = [];
    window.open = ((url: string) => {
      (window as unknown as { opened: string[] }).opened.push(url);
      return null;
    }) as typeof window.open;
  });
  await mockGet(
    page,
    "/safety-data-files",
    {
      data: [
        {
          id: 1,
          name: "E2E ACEITE.pdf",
          createdAt: "2026-10-01T15:00:00.000Z",
          updatedAt: "2026-10-01T15:00:00.000Z",
        },
      ],
      count: 1,
    },
    { when: (url) => url.searchParams.has("page") },
  );
  const downloads: string[] = [];
  await page.route("**/api/v1/safety-data-files/download?**", (route) => {
    downloads.push(new URL(route.request().url()).searchParams.get("name") ?? "");
    return route.fulfill({ contentType: "application/pdf", body: "%PDF-1.4 e2e" });
  });
  await page.goto("/hds");

  await page.getByRole("button", { name: "Ver archivo" }).click();

  await expect
    .poll(() => page.evaluate(() => (window as unknown as { opened: string[] }).opened))
    .toEqual([expect.stringMatching(/^blob:/)]);
  expect(downloads).toEqual(["E2E ACEITE.pdf"]);
});

test("inspecciones: una de hoy permite agregar más evaluaciones", async ({ page }) => {
  await mockGet(
    page,
    "/extinguisher-inspections",
    {
      data: [
        {
          id: 9701,
          inspectionDate: new Date().toISOString(),
          manufacturingPlant: { id: 1, name: "E2E Planta" },
          responsible: { name: "E2E" },
          evaluations: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      count: 1,
    },
    { when: (url) => url.searchParams.has("page") },
  );
  await page.goto("/extinguisher-inspection");

  await page.getByRole("button", { name: "Agregar evaluaciones a la inspección 9701" }).click();

  await expect(page).toHaveURL(/\/extinguisher-inspection\/form\?id=9701$/);
});

test("Escape cierra la confirmación y el menú de tema sin hacer nada", async ({ page }) => {
  await page.goto("/main-types");
  await page.getByRole("button", { name: "Eliminar" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByRole("button", { name: /^Cambiar tema/ }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
});

test("sesión terminada: 'Iniciar sesión' cierra la sesión y va al inicio", async ({ page }) => {
  await page.goto("/main-types");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.route("**/api/v1/main-types?**", (route) =>
    route.fulfill({
      status: 401,
      json: { statusCode: 401, code: "SESSION_EXPIRED", message: "Tu sesión terminó." },
    }),
  );
  const logout: string[] = [];
  await page.route("**/api/v1/auth/logout", (route) => {
    logout.push(route.request().method());
    return route.fulfill({ json: { message: "ok" } });
  });
  await page.getByRole("button", { name: "Actualizar", exact: true }).click();
  const dialog = page.getByRole("alertdialog", { name: "Tu sesión terminó" });
  await expect(dialog).toBeVisible();

  const navigations = await abortNextDocument(page);
  await dialog.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect.poll(() => navigations).toEqual(["/"]);
  expect(logout).toHaveLength(1);
});

test("una versión nueva publicada recarga la app cuando ya está disponible", async ({ page }) => {
  let send: (message: string) => void = () => {};
  await page.routeWebSocket(/\/deployments\/ws$/, (socket) => {
    send = (message) => socket.send(message);
  });
  let served = "build-viejo";
  await page.route("**/deployment-version.json", (route) =>
    route.fulfill({ json: { version: served } }),
  );
  await page.goto("/main-types");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const reloads = await abortNextDocument(page);

  // La UI anunciada aún no se sirve: no recarga.
  send(JSON.stringify({ type: "ui-version", version: "build-nuevo" }));
  await page.waitForTimeout(500);
  expect(reloads).toEqual([]);

  // Ya se sirve: recarga una vez.
  served = "build-otro";
  send(JSON.stringify({ type: "ui-version", version: "build-otro" }));
  await expect.poll(() => reloads).toEqual(["/main-types"]);
});
