import type { Page } from "@playwright/test";

import { captureWrites, mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import {
  pickOption,
  sessionPlants,
  toast,
  trackPageErrors,
} from "./support/ui";

// Panel administrativo, grupo 2 (General): Usuarios, Colaboradores, Plantas,
// Lugares y Zonas. Lo común (marcar lo que falta, confirmar al salir, carga
// en edición) está probado con Procesos (admin-processes.spec.ts); aquí, lo
// propio de cada pantalla. Escrituras interceptadas; lecturas simuladas donde
// hace falta un registro fijo.

const saveButton = (page: Page) =>
  page.getByRole("button", { name: "Guardar" });
const cancelButton = (page: Page) =>
  page.getByRole("button", { name: "Cancelar" });
const trail = (page: Page) =>
  page.getByRole("navigation", { name: "Ruta de navegación" });

test.describe("Usuarios", () => {
  test("Guardar marca nombre, correo, contraseña y rol (antes el rol no se marcaba)", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    await page.goto("/users/form");
    await saveButton(page).click();

    await expect(toast(page, "Completa los 4 campos marcados.")).toBeVisible();
    for (const message of [
      "Escribe el nombre.",
      "Escribe el correo electrónico.",
      "Escribe la contraseña.",
      "Selecciona el rol.",
    ]) {
      await expect(page.getByText(message)).toBeVisible();
    }
    expect(writes).toEqual([]);
  });

  test("el correo abre el teclado de correo", async ({ page }) => {
    await page.goto("/users/form");
    const email = page.getByLabel("Correo electrónico");
    await expect(email).toHaveAttribute("inputmode", "email");
    await expect(email).toHaveAttribute("autocapitalize", "none");
  });

  test("un usuario que no existe lo dice", async ({ page }) => {
    await page.route(
      (url) => url.pathname.endsWith("/api/v1/users/9802"),
      (route) =>
        route.fulfill({
          status: 404,
          json: {
            statusCode: 404,
            code: "NOT_FOUND",
            message: "Usuario #9802 no encontrado",
            error: "Not Found",
          },
        }),
    );
    await page.goto("/users/form?id=9802");
    await expect(page.getByText("Usuario no encontrado")).toBeVisible();
    await expect(page.getByLabel("Correo electrónico")).toHaveCount(0);
  });
});

test.describe("Colaboradores", () => {
  test("el código abre el teclado numérico", async ({ page }) => {
    await page.goto("/employees/form");
    const code = page.getByLabel("Código de colaborador");
    await expect(code).toHaveAttribute("inputmode", "numeric");
    await expect(code).toHaveAttribute("pattern", "[0-9]*");
  });

  test("al editar, salir con un cambio pide confirmación", async ({ page }) => {
    await mockGet(page, "/employees/9851", {
      id: 9851,
      code: 777,
      name: "E2E Colaborador",
      birthdate: "1990-03-15T06:00:00.000Z",
      dateOfAdmission: "2020-02-01T06:00:00.000Z",
      area: null,
      position: null,
      gender: null,
      manufacturingPlants: [],
    });
    await page.goto("/employees/form?id=9851");
    const name = page.getByLabel("Nombre completo");
    await expect(name).toHaveValue("E2E Colaborador");

    await name.fill("E2E Colaborador editado");
    await cancelButton(page).click();
    await expect(
      page.getByRole("dialog", { name: "¿Descartar los cambios?" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Descartar" }).click();
    await expect(page).toHaveURL(/\/employees$/);
  });
});

test.describe("Plantas", () => {
  test("coordenadas con teclado de texto: valida el formato y acepta negativos y coma decimal", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);
    await page.goto("/manufacturing-plants/form");
    const lat = page.getByLabel("Latitud");
    const lng = page.getByLabel("Longitud");
    // Sin type="number" ni teclado numérico: la longitud lleva signo menos.
    for (const field of [lat, lng]) {
      await expect(field).not.toHaveAttribute("type", "number");
      await expect(field).not.toHaveAttribute("inputmode", /numeric|decimal/);
    }

    await page.getByLabel("Nombre").fill("E2E Planta (no se guarda)");
    await page.getByLabel("Link").fill("https://maps.example.com/e2e");
    await lat.fill("95");
    await lng.fill("abc");
    await saveButton(page).click();
    await expect(
      page.getByText(/La latitud debe ser un número entre -90 y 90/),
    ).toBeVisible();
    await expect(
      page.getByText(/La longitud debe ser un número entre -180 y 180/),
    ).toBeVisible();
    expect(writes).toEqual([]);

    // La coma decimal se cambia por punto.
    await lat.fill("19,4326");
    await expect(lat).toHaveValue("19.4326");
    await lng.fill("-99.1332");
    await saveButton(page).click();
    await expect(toast(page, "Planta creada correctamente")).toBeVisible();
    expect(writes[0].body).toMatchObject({ lat: 19.4326, lng: -99.1332 });
    expect(errors).toEqual([]);
  });

  test("el link abre el teclado de direcciones web", async ({ page }) => {
    await page.goto("/manufacturing-plants/form");
    await expect(page.getByLabel("Link")).toHaveAttribute("inputmode", "url");
  });
});

test.describe("Lugares y Zonas", () => {
  test("Zonas: la planta sola no cuenta como captura al salir (como en ICS)", async ({
    page,
  }) => {
    await page.goto("/areas/form");
    const plants = await sessionPlants(page);
    // Con una sola planta el selector la elige solo; con varias, a mano.
    if (plants.length > 1) await pickOption(page, "Planta", plants[0].name);
    await cancelButton(page).click();
    await expect(page).toHaveURL(/\/areas$/);

    await page.goto("/areas/form");
    await page.getByLabel("Nombre").fill("E2E Zona a medias");
    await cancelButton(page).click();
    await expect(
      page.getByRole("dialog", { name: "¿Descartar el registro?" }),
    ).toBeVisible();
  });

  test("Zonas: el punto del plano cuenta como cambio al editar", async ({
    page,
  }) => {
    await mockGet(page, "/areas/9901", {
      id: 9901,
      name: "E2E Zona ubicada",
      manufacturingPlant: { id: 1, name: "Planta" },
      coordinateX: 320,
      coordinateY: 240,
      zoomLevel: 2,
    });
    await page.goto("/areas/form?id=9901");
    await expect(
      page.getByText("Punto seleccionado: X 320, Y 240, Zoom 2.00x"),
    ).toBeVisible();

    // Sin cambios: sale directo.
    await cancelButton(page).click();
    await expect(page).toHaveURL(/\/areas$/);
  });

  for (const [route, list, title] of [
    ["/zones/form", "Lugares", "Nuevo lugar"],
    ["/areas/form", "Zonas", "Nueva zona"],
    ["/manufacturing-plants/form", "Plantas", "Nueva planta"],
    ["/employees/form", "Colaboradores", "Nuevo colaborador"],
    ["/users/form", "Usuarios", "Nuevo usuario"],
  ] as const) {
    test(`breadcrumbs: Configuración › ${list} › ${title}`, async ({
      page,
    }) => {
      await page.goto(route);
      await expect(trail(page)).toHaveText(`Configuración›${list}›${title}`);
    });
  }
});

test.describe("Listas en celular", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  const dates = {
    createdAt: "2026-10-01T15:00:00.000Z",
    updatedAt: "2026-10-01T15:00:00.000Z",
  };

  for (const { route, ariaLabel, row, texts } of [
    {
      route: "/employees",
      ariaLabel: "Colaboradores",
      row: {
        id: 9851,
        code: 777,
        name: "E2E Colaborador",
        dateOfAdmission: "2020-02-01T06:00:00.000Z",
        birthdate: "1990-03-15T06:00:00.000Z",
        isActive: true,
        area: { id: 1, name: "E2E Área" },
        position: { id: 1, name: "E2E Puesto" },
        gender: { id: 1, name: "E2E Género" },
        manufacturingPlants: [{ id: 1, name: "E2E Planta" }],
      },
      texts: ["E2E Colaborador", "Código 777", "Activo", "E2E Puesto"],
    },
    {
      route: "/manufacturing-plants",
      ariaLabel: "Plantas",
      row: {
        id: 9852,
        name: "E2E Planta",
        lat: 19.4326,
        lng: -99.1332,
        link: "https://maps.app.goo.gl/un-link-muy-largo-que-no-cabe-en-la-tarjeta",
        ...dates,
      },
      texts: ["E2E Planta", "19.4326", "-99.1332", "Abrir mapa"],
    },
    {
      route: "/zones",
      ariaLabel: "Lugares",
      row: {
        id: 9853,
        name: "E2E Lugar",
        manufacturingPlant: { id: 1, name: "E2E Planta" },
        area: { id: 1, name: "E2E Zona" },
        createdBy: { name: "E2E Autor" },
        updatedBy: null,
        ...dates,
      },
      texts: ["E2E Lugar", "E2E Planta", "E2E Zona", "E2E Autor"],
    },
    {
      route: "/areas",
      ariaLabel: "Zonas",
      row: {
        id: 9854,
        name: "E2E Zona",
        manufacturingPlant: { id: 1, name: "E2E Planta" },
        createdBy: { name: "E2E Autor" },
        updatedBy: null,
        ...dates,
      },
      texts: ["E2E Zona", "E2E Planta", "E2E Autor"],
    },
  ]) {
    test(`${ariaLabel}: tarjetas sin desplazarse de lado`, async ({ page }) => {
      await mockGet(
        page,
        route,
        { data: [row], count: 1 },
        { when: (url) => url.searchParams.has("page") },
      );
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
});
