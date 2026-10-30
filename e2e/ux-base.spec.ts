import { expect, test } from "./support/fixtures";
import { FORCED_THEME } from "../app/seasonalTheme";

// Base común de UX (Fase 2 de docs/ux-auditoria.md) en un celular táctil:
// tarjetas en vez de tabla, áreas táctiles y contraste del verde de marca.

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

test.describe("Celular", () => {
  test("usuarios se ven como tarjetas con sus acciones", async ({ page }) => {
    await page.goto("/users");

    const cards = page
      .getByRole("list", { name: "Usuarios" })
      .getByRole("listitem");
    await expect(cards.first()).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);

    const first = cards.first();
    await expect(first.getByText("Plantas")).toBeVisible();
    await expect(first.getByRole("button", { name: "Editar" })).toBeVisible();
    // Sin desplazamiento horizontal.
    const overflow = await page
      .locator("main")
      .evaluate((main) => main.scrollWidth - main.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("botones y acciones miden al menos 44-48 px", async ({ page }) => {
    await page.goto("/users");
    const create = page.getByRole("button", { name: "Crear" });
    await expect(create).toBeVisible();
    expect((await create.boundingBox())!.height).toBeGreaterThanOrEqual(48);

    const edit = page.getByRole("button", { name: "Editar" }).first();
    expect((await edit.boundingBox())!.height).toBeGreaterThanOrEqual(44);

    const menu = page.getByRole("button", { name: "Abrir menú" });
    const box = (await menu.boundingBox())!;
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(48);
    // Botón de la cuenta: el avatar de 34 px dejaba 42.
    const account = page.getByRole("button", { name: /^Cuenta de / });
    const accountBox = (await account.boundingBox())!;
    expect(
      Math.min(accountBox.width, accountBox.height),
    ).toBeGreaterThanOrEqual(44);

    // Barra de FullCalendar del editor del calendario (medía 39–40 px).
    await page.goto("/gemba-walk/calendar/form");
    const toolbar = page.locator(".fc-toolbar .fc-button");
    await expect(toolbar.first()).toBeVisible();
    for (const box of await toolbar.evaluateAll((buttons) =>
      buttons.map((b) => b.getBoundingClientRect().height),
    )) {
      expect(box).toBeGreaterThanOrEqual(44);
    }

    // Nuevo hallazgo: su propio minHeight de 44 le ganaba al tema.
    await page.goto("/hallazgos/form");
    for (const name of ["Crear hallazgo", "Cancelar"]) {
      const button = page.getByRole("button", { name, exact: true });
      await button.scrollIntoViewIfNeeded();
      expect((await button.boundingBox())!.height, name).toBeGreaterThanOrEqual(
        48,
      );
    }
  });

  test("el texto verde sobre blanco usa el tono oscuro; el relleno no cambia", async ({
    page,
  }) => {
    test.skip(
      !!FORCED_THEME,
      "Tema forzado temporal (app/seasonalTheme.ts): la prueba es del tema claro u oscuro.",
    );
    await page.goto("/ics/form");
    const outlined = page.getByText("Elegir de galería");
    const filled = page.getByText("Tomar foto");
    await expect(outlined).toBeVisible();

    const color = (
      locator: typeof outlined,
      prop: "color" | "backgroundColor",
    ) =>
      locator
        .locator("xpath=ancestor-or-self::label[1]")
        .evaluate((el, p) => getComputedStyle(el)[p], prop);

    // Verde oscuro (6.4:1 sobre blanco) en texto; verde de marca de fondo.
    expect(await color(outlined, "color")).toBe("rgb(62, 105, 37)");
    expect(await color(filled, "backgroundColor")).toBe("rgb(113, 191, 68)");
  });
});
