import type { Page } from "@playwright/test";

import { captureWrites, mockGet } from "./support/api";
import { fakeCamera } from "./support/camera";
import { expect, test } from "./support/fixtures";
import {
  pickMany,
  pickOption,
  sessionPlants,
  toast,
  trackPageErrors,
} from "./support/ui";

// Registro de ICS. Catálogos y colaboradores con datos fijos (mockGet) para
// recorrer los selects en cascada; el alta se intercepta (captureWrites).

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

const CATALOGS = [
  {
    id: 71,
    name: "E2E Regla con estándares",
    order: 1,
    isActive: true,
    standards: [
      {
        id: 711,
        name: "E2E Estándar con áreas",
        isActive: true,
        areas: [{ id: 7111, name: "E2E Área", isActive: true }],
      },
      { id: 712, name: "E2E Estándar sin áreas", isActive: true, areas: [] },
    ],
  },
  {
    id: 72,
    name: "E2E Regla sin estándares",
    order: 2,
    isActive: true,
    standards: [],
  },
];

const EMPLOYEES = [
  { id: 8101, name: "E2E Colaborador Uno" },
  { id: 8102, name: "E2E Colaborador Dos" },
];

const saveButton = (page: Page) =>
  page.getByRole("button", { name: "Guardar" });

const openForm = async (page: Page, employees = EMPLOYEES) => {
  await mockGet(page, "/ics/catalogs", CATALOGS);
  await mockGet(page, "/employees", employees);
  await page.goto("/ics/form");
  const [plant] = await sessionPlants(page);
  await pickOption(page, "Planta *", plant.name);
  return plant;
};

const totalPeople = (page: Page) => page.getByLabel(/^Personas totales/);

test.describe("ICS", () => {
  test("registra un ICS con foto de la cámara (sin guardar)", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);
    await fakeCamera(page, { qr: "foto" });
    const plant = await openForm(page);

    // Al elegir regla aparecen sus estándares, y del estándar sus áreas.
    await pickOption(page, "Regla de vida *", "E2E Regla con estándares");
    await pickOption(
      page,
      "Estandar de comportamiento *",
      "E2E Estándar con áreas",
    );
    await pickOption(page, "Área *", "E2E Área");

    // Solo números positivos.
    await totalPeople(page).pressSequentially("-e0");
    await expect(totalPeople(page)).toHaveValue("");
    await totalPeople(page).fill("1");
    await pickMany(page, "Personas que no cumplen con el estándar *", 2);

    await saveButton(page).click();
    await expect(
      toast(page, "El número de personas totales no puede ser menor"),
    ).toBeVisible();
    expect(writes).toEqual([]);

    await totalPeople(page).fill("5");
    await page.getByLabel("Descripción (opcional)").fill("  E2E sin casco  ");
    // Alternativa a la cámara del teléfono: la del navegador. La foto se
    // comprime y se sube como JPG (antes, un PNG al tamaño del visor).
    await page
      .getByRole("button", { name: "Usar cámara del navegador" })
      .click();
    await page.locator("#outer-circle").click();
    await expect(
      page.getByAltText("Vista previa de la evidencia"),
    ).toBeVisible();

    await saveButton(page).click();
    await expect(toast(page, "Ics creado correctamente")).toBeVisible();
    await expect(page).toHaveURL(/\/ics$/);

    expect(writes).toHaveLength(1);
    const [{ method, path, body }] = writes;
    expect({ method, path }).toEqual({ method: "POST", path: "/ics" });
    const fields = String(body);
    for (const [name, value] of [
      ["manufacturingPlantId", String(plant.id)],
      ["totalPeople", "5"],
      ["ruleOfLifeId", "71"],
      ["standardOfBehaviorId", "711"],
      ["areaOfBehaviorId", "7111"],
      ["description", "E2E sin casco"],
      ["employeesIds[0]", "8101"],
      ["employeesIds[1]", "8102"],
    ]) {
      expect(fields).toContain(`name="${name}"\r\n\r\n${value}\r\n`);
    }
    expect(fields).toMatch(
      /name="file"; filename="[0-9a-f-]{36}-evidence\.jpg"/,
    );
    expect(errors).toEqual([]);
  });

  test("registra un ICS con imagen adjunta y sin estándar (sin guardar)", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    await openForm(page);

    await pickOption(page, "Regla de vida *", "E2E Regla sin estándares");
    await expect(
      page.getByRole("combobox", { name: "Estandar de comportamiento *" }),
    ).toHaveCount(0);
    await totalPeople(page).fill("3");
    await pickMany(page, "Personas que no cumplen con el estándar *");
    await page.getByLabel("Elegir de galería").setInputFiles({
      name: "evidencia.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    });
    // La imagen se comprime antes de adjuntarse (un PNG sigue siendo PNG);
    // su vista previa lo indica.
    await expect(
      page.getByAltText("Vista previa de la evidencia"),
    ).toBeVisible();

    await saveButton(page).click();
    await expect(toast(page, "Ics creado correctamente")).toBeVisible();

    const fields = String(writes[0].body);
    expect(fields).not.toContain('name="standardOfBehaviorId"');
    expect(fields).not.toContain('name="description"');
    expect(fields).toMatch(/filename="[0-9a-f-]{36}-evidence\.png"/);
  });

  // Antes un rechazo del API no mostraba nada: IcsService.create usa axios
  // directo, sin el interceptor que avisa los errores.
  test("mientras guarda bloquea el botón y, si el API rechaza, avisa y deja reintentar", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    let posts = 0;
    await page.route("**/api/v1/ics", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      posts++;
      await held;
      return route.fulfill({
        status: 400,
        json: { message: "E2E la regla de vida ya no está activa" },
      });
    });
    await openForm(page);
    await pickOption(page, "Regla de vida *", "E2E Regla sin estándares");
    await totalPeople(page).fill("3");
    await pickMany(page, "Personas que no cumplen con el estándar *");

    await saveButton(page).click();
    await expect(saveButton(page)).toBeDisabled();
    // Un segundo toque mientras guarda no envía otra vez.
    await saveButton(page).click({ force: true });

    release();
    await expect(
      toast(page, "E2E la regla de vida ya no está activa"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/ics\/form$/);
    await expect(saveButton(page)).toBeEnabled();
    expect(posts).toBe(1);
    expect(errors).toEqual([]);
  });

  test("un estándar sin áreas no muestra el select de área", async ({
    page,
  }) => {
    await openForm(page);
    await pickOption(page, "Regla de vida *", "E2E Regla con estándares");
    await pickOption(
      page,
      "Estandar de comportamiento *",
      "E2E Estándar sin áreas",
    );
    await expect(page.getByRole("combobox", { name: "Área *" })).toHaveCount(0);
  });

  test("avisa cuando la planta no tiene colaboradores", async ({ page }) => {
    await mockGet(page, "/ics/catalogs", CATALOGS);
    await page.goto("/ics/form");
    await expect(
      page.getByText("Seleccione una planta, para ver los colaboradores."),
    ).toBeVisible();
    await mockGet(page, "/employees", []);
    const [plant] = await sessionPlants(page);
    await pickOption(page, "Planta *", plant.name);
    await expect(
      page.getByText("No hay colaboradores disponibles"),
    ).toBeVisible();
    await expect(saveButton(page)).toBeDisabled();
  });
});
