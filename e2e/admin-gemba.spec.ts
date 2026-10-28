import type { Page } from "@playwright/test";

import { captureWrites, mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import { choosePlant, toast } from "./support/ui";

// Panel administrativo, grupo 4: configuración de Gemba Walk (zonas,
// observadores, conceptos de evaluación y calendario; G8). Lo común está
// probado con Procesos (admin-processes.spec.ts); aquí, lo propio de cada
// pantalla. Escrituras interceptadas; lecturas simuladas donde hace falta un
// registro fijo.

const saveButton = (page: Page) =>
  page.getByRole("button", { name: "Guardar" });
const trail = (page: Page) =>
  page.getByRole("navigation", { name: "Ruta de navegación" });

const DATES = {
  createdAt: "2026-10-01T15:00:00.000Z",
  updatedAt: "2026-10-01T15:00:00.000Z",
  createdBy: { name: "E2E Creó" },
  updatedBy: null,
};
const PLANT = { id: 1, name: "E2E Planta" };
const ZONE = {
  id: 9901,
  nameZone: "E2E Zona",
  nameLocation: "E2E Pasillo",
  manufacturingPlant: PLANT,
  ...DATES,
};

/** Lista paginada con filas fijas. */
const servePage = (page: Page, path: string, rows: unknown[]) =>
  mockGet(
    page,
    path,
    { data: rows, count: rows.length },
    { when: (url) => url.searchParams.has("page") },
  );

test.describe("Gemba Walk: formularios de configuración", () => {
  for (const [route, expected] of [
    [
      "/gemba-walk/zones/form",
      "Configuración›Gemba Walk›Zonas›Nueva zona de Gemba Walk",
    ],
    [
      "/gemba-walk/observers/form",
      "Configuración›Gemba Walk›Observadores›Nuevo observador",
    ],
    [
      "/gemba-walk/evaluations/form",
      "Configuración›Gemba Walk›Evaluaciones›Nuevo concepto de evaluación",
    ],
    [
      "/gemba-walk/calendar/form",
      "Configuración›Gemba Walk›Calendario›Programar recorridos",
    ],
  ] as const) {
    test(`breadcrumbs en ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(trail(page)).toHaveText(expected);
    });
  }

  test("zonas: Guardar marca zona y ubicación", async ({ page }) => {
    const writes = await captureWrites(page);
    await page.goto("/gemba-walk/zones/form");
    await choosePlant(page);
    await saveButton(page).click();
    await expect(toast(page, "Completa los 2 campos marcados.")).toBeVisible();
    await expect(page.getByText("Escribe la zona.")).toBeVisible();
    await expect(page.getByText("Escribe la ubicación.")).toBeVisible();
    expect(writes).toEqual([]);
  });

  test("observadores: las listas no aparecen en rojo al abrir; Guardar marca lo que falta", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    await page.goto("/gemba-walk/observers/form");
    await choosePlant(page);
    const zone = page.getByRole("combobox", { name: "Zona", exact: true });
    await expect(zone).toBeEnabled();
    // Antes, validationEmpty las pintaba en rojo desde que se abría.
    await expect(zone).not.toHaveAttribute("aria-invalid", "true");

    await saveButton(page).click();
    await expect(toast(page, "Completa los 2 campos marcados.")).toBeVisible();
    await expect(page.getByText("Selecciona la zona.")).toBeVisible();
    await expect(
      page.getByText("Selecciona al menos un usuario."),
    ).toBeVisible();
    expect(writes).toEqual([]);
  });

  test("conceptos: la categoría no aparece en rojo al abrir; Guardar marca lo que falta", async ({
    page,
  }) => {
    await page.goto("/gemba-walk/evaluations/form");
    await choosePlant(page);
    await expect(
      page.getByRole("combobox", { name: "Categoría", exact: true }),
    ).not.toHaveAttribute("aria-invalid", "true");
    await saveButton(page).click();
    await expect(toast(page, "Completa los 3 campos marcados.")).toBeVisible();
    for (const message of [
      "Selecciona la categoría.",
      "Escribe el área.",
      "Escribe la descripción.",
    ]) {
      await expect(page.getByText(message)).toBeVisible();
    }
  });

  test("un concepto que no existe lo dice", async ({ page }) => {
    await page.route(
      (url) => url.pathname.endsWith("/api/v1/gemba-walk/evaluations/9902"),
      (route) =>
        route.fulfill({
          status: 404,
          json: {
            statusCode: 404,
            code: "NOT_FOUND",
            message: "Concepto #9902 no encontrado",
            error: "Not Found",
          },
        }),
    );
    await page.goto("/gemba-walk/evaluations/form?id=9902");
    await expect(page.getByText("Concepto no encontrado")).toBeVisible();
  });

  test("zonas: al editar, salir con un cambio pide confirmación", async ({
    page,
  }) => {
    await mockGet(page, `/gemba-walk/zones/${ZONE.id}`, ZONE);
    await page.goto(`/gemba-walk/zones/form?id=${ZONE.id}`);
    await expect(page.getByLabel("Zona")).toHaveValue("E2E Zona");
    await page.getByLabel("Ubicación").fill("E2E Otro pasillo");
    await trail(page).getByRole("link", { name: "Zonas" }).click();
    await expect(
      page.getByRole("dialog", { name: "¿Descartar los cambios?" }),
    ).toBeVisible();
  });

  test("calendario: el enlace de los breadcrumbs sin cambios regresa directo", async ({
    page,
  }) => {
    await page.goto("/gemba-walk/calendar/form");
    await trail(page).getByRole("link", { name: "Calendario" }).click();
    await expect(page).toHaveURL(/\/gemba-walk\/calendar$/);
  });
});

test.describe("Gemba Walk: listas de configuración en celular", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  const future = new Date(Date.now() + 3 * 24 * 60 * 60_000).toISOString();
  const past = new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString();

  for (const { route, ariaLabel, rows, texts } of [
    {
      route: "/gemba-walk/zones",
      ariaLabel: "Zonas de Gemba Walk",
      rows: [ZONE],
      texts: ["E2E Zona - E2E Pasillo", "E2E Planta"],
    },
    {
      route: "/gemba-walk/observers",
      ariaLabel: "Observadores de Gemba Walk",
      rows: [
        {
          id: 9903,
          manufacturingPlant: PLANT,
          gembaWalkZone: ZONE,
          user: { id: 1, name: "E2E Observador", email: "e2e@example.com" },
          ...DATES,
        },
      ],
      texts: ["E2E Observador", "e2e@example.com", "E2E Zona", "E2E Pasillo"],
    },
    {
      route: "/gemba-walk/evaluations",
      ariaLabel: "Conceptos de evaluación",
      rows: [
        {
          id: 9904,
          manufacturingPlant: PLANT,
          category: "SHE",
          area: "E2E EPP",
          description: "E2E verificar lentes",
          ...DATES,
        },
      ],
      texts: ["E2E EPP", "SHE", "E2E verificar lentes"],
    },
    {
      route: "/gemba-walk/calendar",
      ariaLabel: "Calendario de Gemba Walk",
      rows: [
        {
          id: 9905,
          gembaWalkZone: ZONE,
          scheduledAt: future,
          isAdditional: true,
          ...DATES,
        },
      ],
      texts: ["E2E Zona - E2E Pasillo", "E2E Planta", "Sí"],
    },
  ]) {
    test(`${ariaLabel}: tarjetas sin desplazarse de lado`, async ({ page }) => {
      await servePage(page, route, rows);
      await page.goto(route);

      await expect(page.getByRole("table")).toHaveCount(0);
      const card = page
        .getByRole("list", { name: ariaLabel })
        .getByRole("listitem");
      for (const text of texts) await expect(card).toContainText(text);
      await expect(card.getByRole("button", { name: "Editar" })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("calendario: un evento pasado no tiene acciones en su tarjeta", async ({
    page,
  }) => {
    await servePage(page, "/gemba-walk/calendar", [
      {
        id: 9906,
        gembaWalkZone: ZONE,
        scheduledAt: past,
        isAdditional: false,
        ...DATES,
      },
    ]);
    await page.goto("/gemba-walk/calendar");
    const card = page
      .getByRole("list", { name: "Calendario de Gemba Walk" })
      .getByRole("listitem");
    await expect(card).toContainText("E2E Zona - E2E Pasillo");
    await expect(card.getByRole("button", { name: "Editar" })).toHaveCount(0);
    await expect(card).toContainText("Evento pasado");
  });
});
