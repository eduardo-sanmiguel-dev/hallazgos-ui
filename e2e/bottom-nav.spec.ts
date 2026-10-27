import type { Page } from "@playwright/test";

import { mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import { openFilters } from "./support/ui";

// Navegación inferior en celular (A8). Los accesos salen de la misma regla
// que el menú (canAccessPath): nunca muestra algo que diga "sin acceso".

const nav = (page: Page) =>
  page.getByRole("navigation", { name: "Accesos rápidos" });

const asUser = async (
  page: Page,
  { email, role = "General", observer = false }: {
    email: string;
    role?: string;
    observer?: boolean;
  },
) => {
  await mockGet(page, "/users/get-information-current-user", {
    id: 7401,
    name: "E2E Barra",
    email,
    role,
    isActive: true,
    manufacturingPlants: [{ id: 1, name: "Planta" }],
    zones: [],
  });
  await mockGet(page, "/gemba-walk/walks/access", { isObserver: observer });
};

// El indicador de Next.js y el botón de React Query Devtools (solo en modo
// dev, abajo a la izquierda) tapan el primer acceso. En producción no existen.
const hideDevOverlays = (page: Page) =>
  page.addStyleTag({
    content: "nextjs-portal, .tsqd-parent-container { display: none !important; }",
  });

/** Etiquetas de los accesos de izquierda a derecha, sin el botón central. */
const destinations = (page: Page) =>
  nav(page)
    .getByRole("link")
    .filter({ hasNotText: /^$/ })
    .evaluateAll((links) =>
      links
        .filter((link) => link.getAttribute("aria-label") !== "Nuevo hallazgo")
        .map((link) => link.textContent?.trim()),
    );

test.describe("Navegación inferior en celular", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });


  const ROLES = [
    {
      name: "administrador",
      // El API siempre responde "observador" para el administrador.
      user: {
        email: "e2e-admin@example.com",
        role: "Administrador",
        observer: true,
      },
      expected: ["Hallazgos", "Gemba Walk", "EPP"],
    },
    {
      name: "usuario general observador de Gemba Walk",
      user: { email: "e2e-general@example.com", observer: true },
      expected: ["Dashboard", "Hallazgos", "Gemba Walk"],
    },
    {
      name: "usuario general o supervisor",
      user: { email: "e2e-general@example.com", role: "Supervisor" },
      expected: ["Dashboard", "Hallazgos"],
    },
    {
      name: "usuario solo-EPP",
      user: { email: "malonso@hadainternational.com", role: "Supervisor" },
      expected: ["Hallazgos", "EPP", "Extintores"],
    },
  ];

  for (const { name, user, expected } of ROLES) {
    test(`${name}: sus accesos abren sin "sin acceso"`, async ({ page }) => {
      // Abre hasta 3 módulos; en modo dev cada uno se compila la primera vez.
      test.setTimeout(120_000);
      await asUser(page, user);
      await page.goto("/hallazgos");
      await hideDevOverlays(page);
      await expect(nav(page)).toBeVisible();
      await expect.poll(() => destinations(page)).toEqual(expected);
      await expect(
        nav(page).getByRole("link", { name: "Nuevo hallazgo" }),
      ).toBeVisible();

      for (const label of expected) {
        await nav(page).getByRole("link", { name: label }).click();
        await expect(
          nav(page).getByRole("link", { name: label }),
        ).toHaveAttribute("aria-current", "page");
        await expect(
          page.getByText("No tienes acceso a esta sección"),
        ).toHaveCount(0);
      }
    });
  }

  test("el usuario solo-HDS no tiene barra", async ({ page }) => {
    await asUser(page, { email: "cosmeticostrujillo0023@gmail.com" });
    await page.goto("/hds");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(nav(page)).toHaveCount(0);
  });

  test("Nuevo hallazgo va al centro, destacado, y lleva al formulario sin barra", async ({
    page,
  }) => {
    await page.goto("/hallazgos");
    const create = nav(page).getByRole("link", { name: "Nuevo hallazgo" });
    await expect(create).toBeVisible();

    const box = (await create.boundingBox())!;
    expect(Math.abs(box.x + box.width / 2 - 390 / 2)).toBeLessThanOrEqual(2);
    // Más grande que un acceso normal y sobresale de la barra.
    const navBox = (await nav(page).boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(56);
    expect(box.y).toBeLessThan(navBox.y);

    await create.click();
    await expect(page).toHaveURL(/\/hallazgos\/form$/);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(nav(page)).toHaveCount(0);
  });

  test("se oculta mientras se escribe en un campo", async ({ page }) => {
    await page.goto("/users");
    await openFilters(page);
    await expect(nav(page)).toBeVisible();

    const field = page.getByRole("textbox").first();
    await field.focus();
    await expect(nav(page)).toBeHidden();

    await field.blur();
    await expect(nav(page)).toBeVisible();
  });

  test("un diálogo abierto queda por encima y la cubre", async ({ page }) => {
    await page.goto("/users");
    await hideDevOverlays(page);
    await expect(nav(page)).toBeVisible();
    const box = (await nav(page).boundingBox())!;
    const isNavOnTop = () =>
      page.evaluate(
        ([x, y]) =>
          !!document
            .elementFromPoint(x, y)
            ?.closest('nav[aria-label="Accesos rápidos"]'),
        [box.x + box.width * 0.85, box.y + box.height / 2],
      );
    expect(await isNavOnTop()).toBe(true);

    await page.getByRole("button", { name: "Eliminar" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await isNavOnTop()).toBe(false);
  });

  test("el contenido no queda debajo de la barra", async ({ page }) => {
    await page.goto("/users");
    await expect(nav(page)).toBeVisible();
    const main = page.locator("main");
    await main.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    const copyright = page.getByText(/Copyright ©/);
    const textBox = (await copyright.boundingBox())!;
    const navBox = (await nav(page).boundingBox())!;
    expect(textBox.y + textBox.height).toBeLessThanOrEqual(navBox.y);
  });
});

test("en escritorio no hay barra inferior", async ({ page }) => {
  await page.goto("/hallazgos");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await expect(nav(page)).toHaveCount(0);
});
