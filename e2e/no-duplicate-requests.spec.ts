import type { Page, Request } from "@playwright/test";

import { captureWrites } from "./support/api";
import { expect, test } from "./support/fixtures";
import { pickMany, pickOption, sessionPlants, toast } from "./support/ui";

// Llamadas duplicadas a la API: la misma lectura pedida dos veces casi a la
// vez (la segunda sale con la primera en curso o justo después). Cada caso
// de abajo pedía algo dos veces antes de corregirse.

const DUPLICATE_WINDOW_MS = 300;

/** GET a la API de la página (también tras recargarla), con inicio y fin. */
const recordApiGets = (page: Page) => {
  const gets: { path: string; start: number; end?: number }[] = [];
  const index = new Map<Request, number>();
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (request.method() !== "GET" || !url.pathname.includes("/api/v1/")) return;
    index.set(request, gets.length);
    gets.push({ path: url.pathname.replace(/^.*\/api\/v1/, "") + url.search, start: Date.now() });
  });
  const done = (request: Request) => {
    const i = index.get(request);
    if (i !== undefined) gets[i].end = Date.now();
  };
  page.on("requestfinished", done);
  page.on("requestfailed", done);

  return {
    /** Cuántas lecturas cumplen `match` (sobre la ruta con su query). */
    count: (match: RegExp) => gets.filter(({ path }) => match.test(path)).length,
    /** Hubo lecturas que cumplen `match` y ya terminaron todas. */
    settled: (match: RegExp) => {
      const matching = gets.filter(({ path }) => match.test(path));
      return matching.length > 0 && matching.every(({ end }) => end !== undefined);
    },
    /** Lecturas repetidas casi a la vez. */
    duplicates: () =>
      gets
        .filter((get, i) =>
          gets
            .slice(0, i)
            .some(
              (previous) =>
                previous.path === get.path &&
                get.start <= (previous.end ?? Infinity) + DUPLICATE_WINDOW_MS,
            ),
        )
        .map(({ path }) => path),
  };
};

// Todas las pantallas con datos, en una carga completa.
const ROUTES = [
  "/dashboard",
  "/hallazgos",
  "/hallazgos/form",
  "/business-intelligence/epp",
  "/ciael",
  "/ics",
  "/ics/form",
  "/epp",
  "/hds",
  "/extinguisher-inspection",
  "/extinguisher-inspection/form",
  "/emergency-teams",
  "/emergency-teams/form",
  "/employees",
  "/employees/form",
  "/equipments",
  "/equipments/form",
  "/gemba-walk",
  "/gemba-walk/form",
  "/gemba-walk/schedule",
  "/gemba-walk/calendar",
  "/gemba-walk/calendar/form",
  "/gemba-walk/zones",
  "/gemba-walk/zones/form",
  "/gemba-walk/evaluations",
  "/gemba-walk/evaluations/form",
  "/gemba-walk/observers",
  "/gemba-walk/observers/form",
  "/users",
  "/users/form",
  "/manufacturing-plants",
  "/manufacturing-plants/form",
  "/zones",
  "/zones/form",
  "/areas",
  "/areas/form",
  "/processes",
  "/processes/form",
  "/main-types",
  "/main-types/form",
  "/secondary-types",
  "/secondary-types/form",
];

for (const route of ROUTES) {
  test(`${route}: cada lectura una sola vez, sin preguntar aparte el acceso a Gemba Walk`, async ({
    page,
  }) => {
    const api = recordApiGets(page);
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    expect(api.duplicates()).toEqual([]);
    expect(api.count(/^\/users\/get-information-current-user$/)).toBe(1);
    // Viene en el usuario en sesión (isGembaWalkObserver).
    expect(api.count(/^\/gemba-walk\/walks\/access/)).toBe(0);
  });
}

test("hallazgos con filtros en la URL pide la lista una sola vez, ya filtrada", async ({
  page,
}) => {
  await page.goto("/hallazgos");
  const [plant] = await sessionPlants(page);
  const api = recordApiGets(page);
  await page.goto(
    `/hallazgos?manufacturingPlantId=${plant.id}&startDate=01/01/2026&endDate=31/12/2026`,
  );
  await page.waitForLoadState("networkidle");
  // Antes también salía la página sin filtros, que se descartaba.
  expect(api.count(/^\/evidences\?/)).toBe(1);
  expect(api.count(new RegExp(`^/evidences\\?.*manufacturingPlantId=${plant.id}`))).toBe(1);
  expect(api.duplicates()).toEqual([]);
});

test("del listado de zonas a editar una no vuelve a pedir las áreas", async ({ page }) => {
  const api = recordApiGets(page);
  await page.goto("/zones");
  await page.getByRole("button", { name: "Editar" }).first().click();
  await expect(page).toHaveURL(/\/zones\/form\?id=\d+/);
  await page.waitForLoadState("networkidle");
  // `{}` y `{ manufacturingPlantId: "" }` eran dos llaves de la misma petición.
  expect(api.count(/^\/areas$/)).toBe(1);
});

test("reactivar una zona recarga su lista sin volver a pedir catálogos ajenos", async ({
  page,
}) => {
  const zone = {
    id: 99331,
    name: "Zona inactiva",
    isActive: false,
    manufacturingPlant: { id: 1, name: "Planta prueba", isActive: true },
    area: null,
    createdAt: "2026-01-01T12:00:00Z",
    updatedAt: "2026-01-01T12:00:00Z",
  };
  await page.route(
    (url) => url.pathname.endsWith("/api/v1/zones") && url.searchParams.has("page"),
    (route) => route.fulfill({ json: { data: [zone], count: 1 } }),
  );
  await captureWrites(page, {
    respond: () => {
      zone.isActive = true;
      return { id: zone.id, isActive: true };
    },
  });
  const api = recordApiGets(page);
  await page.goto("/zones");
  await page.getByText("Reactivar", { exact: true }).click();
  await page
    .getByRole("dialog", { name: "Reactivar registro" })
    .getByRole("button", { name: "Reactivar", exact: true })
    .click();
  await expect(page.getByText("Activo", { exact: true })).toBeVisible();
  await page.waitForLoadState("networkidle");

  expect(api.count(/^\/zones\?.*page=/)).toBe(2);
  // Antes se invalidaban todos los catálogos y se volvían a pedir estos.
  expect(api.count(/^\/manufacturing-plants$/)).toBe(1);
  expect(api.count(/^\/areas$/)).toBe(1);
});

test("cerrar sesión no vuelve a pedir los datos de la pantalla", async ({ page }) => {
  // El API real cerraría la sesión que comparten las demás pruebas: se
  // responde como él (borra la cookie) sin tocar el token.
  await page.route("**/api/v1/auth/logout", async (route) => {
    await page.context().clearCookies({ name: "token" });
    return route.fulfill({ json: { message: "Sesión cerrada correctamente." } });
  });
  await page.goto("/hallazgos/form");
  await page.waitForLoadState("networkidle");

  const api = recordApiGets(page);
  await page.getByRole("button", { name: /Cuenta de/ }).click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(toast(page, "Sesión cerrada correctamente.")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await page.waitForLoadState("networkidle");

  // Solo "/" pregunta una vez si hay sesión (antes: dos veces, más el
  // acceso y los catálogos de la pantalla, ya sin sesión).
  expect(api.count(/./)).toBe(1);
  expect(api.count(/^\/users\/get-information-current-user$/)).toBe(1);
});

test("hallazgos: varias opciones elegidas seguidas son una sola consulta", async ({ page }) => {
  await page.goto("/hallazgos");
  await sessionPlants(page);
  await page.waitForLoadState("networkidle");

  const api = recordApiGets(page);
  await pickMany(page, "Estatus", 3);
  // La consulta sale tras la pausa; luego se da margen por si llegara otra.
  await expect.poll(() => api.count(/^\/evidences\?/)).toBeGreaterThan(0);
  await page.waitForTimeout(1000);

  // Antes, una consulta por opción (1, 2 y 3 estatus).
  expect(api.count(/^\/evidences\?/)).toBe(1);
  // Con los tres estatus (separados por coma).
  expect(api.count(/[?&]statuses=[^&]*,[^&]*,/)).toBe(1);
});

test("dashboard: varias opciones elegidas seguidas recargan las gráficas una sola vez", async ({
  page,
}) => {
  const plantLoad = recordApiGets(page);
  await page.goto("/dashboard");
  const [plant] = await sessionPlants(page);
  await pickOption(page, "Planta", plant.name);
  // Las gráficas de la planta salen tras el debounce de filtros (400 ms):
  // se espera a que terminen antes de contar. networkidle no basta: si la
  // página ya estaba inactiva (íconos y logos en caché), responde de
  // inmediato y su lectura se sumaba a la de los estatus.
  await page.waitForTimeout(500);
  await expect.poll(() => plantLoad.settled(/^\/dashboard\/status-by-filters\?/)).toBe(true);

  const api = recordApiGets(page);
  await pickMany(page, "Estatus", 3);
  await expect.poll(() => api.count(/^\/dashboard\/status-by-filters\?/)).toBeGreaterThan(0);
  await page.waitForTimeout(1000);

  // Cada cambio pedía todas las gráficas; ahora una vez al terminar.
  expect(api.count(/^\/dashboard\/status-by-filters\?/)).toBe(1);
  expect(api.duplicates()).toEqual([]);
});

// Listados con filtro de planta: con una planta recordada (o una sola
// asignada) se pedía la primera página sin planta y luego con ella.
const LISTS_WITH_PLANT = [
  "/hallazgos",
  "/zones",
  "/areas",
  "/processes",
  "/users",
  "/employees",
  "/emergency-teams",
  "/extinguisher-inspection",
  "/ics",
  "/ciael",
  "/gemba-walk",
  "/gemba-walk/zones",
  "/gemba-walk/observers",
  "/gemba-walk/evaluations",
  "/gemba-walk/calendar",
];

for (const route of LISTS_WITH_PLANT) {
  test(`${route}: con la planta recordada pide la primera página una vez, ya filtrada`, async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const [plant] = await sessionPlants(page);
    await page.evaluate((plantId) => {
      const userId = JSON.parse(sessionStorage.getItem("user-session") ?? "{}").state?.id;
      localStorage.setItem(`hallazgos:ultima-planta:${userId}`, String(plantId));
    }, plant.id);

    const api = recordApiGets(page);
    await page.goto(route);
    const firstPage = /[?&]page=1(&|$)/;
    await expect.poll(() => api.count(firstPage)).toBeGreaterThan(0);
    // Margen para la pausa de los filtros (500 ms) por si saliera otra.
    await page.waitForTimeout(1200);

    expect(api.count(firstPage)).toBe(1);
    expect(
      api.count(
        new RegExp(
          `[?&]page=1.*manufacturingPlantId=${plant.id}|manufacturingPlantId=${plant.id}.*[?&]page=1`,
        ),
      ),
    ).toBe(1);
  });
}

test("dashboard: las gráficas piden sus datos sin esperar al resumen, una vez cada una", async ({
  page,
}) => {
  const charts =
    /^\/dashboard\/(areas|main-types|solid-gauge-kpi|priority-intervention|risk-level|area-range-line|packed-bubble|sankey|assigned-responsibles)-by-filters\?/;
  await page.goto("/dashboard");
  const [plant] = await sessionPlants(page);

  // El resumen se retiene: antes, las gráficas esperaban a que llegara.
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route(
    (url) => url.pathname.endsWith("/api/v1/dashboard/status-by-filters"),
    async (route) => {
      await held;
      await route.fallback();
    },
  );
  const api = recordApiGets(page);
  await pickOption(page, "Planta", plant.name);

  await expect.poll(() => api.count(charts)).toBe(9);
  expect(api.count(/^\/dashboard\/status-by-filters\?/)).toBe(1);

  release();
  await page.waitForTimeout(1500);
  // Al montarse, las gráficas reutilizan lo que ya se pidió.
  expect(api.count(charts)).toBe(9);
  expect(api.duplicates()).toEqual([]);
});
