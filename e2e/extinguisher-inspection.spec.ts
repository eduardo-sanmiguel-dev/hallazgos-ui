import type { Page } from "@playwright/test";

import { captureWrites, mockGet } from "./support/api";
import { fakeCamera } from "./support/camera";
import { expect, test } from "./support/fixtures";
import {
  fillDate,
  pickOption,
  sessionPlants,
  toast,
  trackPageErrors,
} from "./support/ui";

// Inspección de extintores: el equipo se agrega escaneando su QR con la
// cámara (simulada con fakeCamera). Las escrituras se interceptan.

const TEAM_ID = 9501;

const emergencyTeam = (plantId: number, overrides = {}) => ({
  id: TEAM_ID,
  location: "E2E Pasillo norte",
  extinguisherNumber: "E2E-501",
  typeOfExtinguisher: "PQS",
  capacity: 6,
  manufacturingPlant: { id: plantId, name: "Planta" },
  ...overrides,
});

/** Abre el formulario con la cámara viendo `qr` y elige la primera planta. */
const openWithCamera = async (page: Page, qr: string) => {
  await fakeCamera(page, { qr });
  await page.goto("/extinguisher-inspection/form");
  await expect(page.getByRole("combobox", { name: "Planta" })).toBeVisible();
  const [plant] = await sessionPlants(page);
  await pickOption(page, "Planta", plant.name);
  return plant;
};

const scan = (page: Page) =>
  page.getByRole("button", { name: "Agregar evaluación" }).click();

const saveButton = (page: Page) =>
  page.getByRole("button", { name: "Guardar" });

/** Botones C / NC / NA de un concepto (de la única evaluación en pantalla). */
const concept = (page: Page, label: string) =>
  page.getByRole("group", { name: label, exact: true });

test.describe("Inspección de extintores", () => {
  test("escanea un equipo, registra novedades y crea la inspección (sin guardar)", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);

    // El QR impreso trae una URL; se toma el número que contiene.
    const plant = await openWithCamera(
      page,
      `https://comportarte.example/equipo/${TEAM_ID}`,
    );
    await mockGet(page, `/emergency-teams/${TEAM_ID}`, emergencyTeam(plant.id));

    // Sin evaluaciones, Guardar marca lo que falta (antes estaba deshabilitado).
    await saveButton(page).click();
    await expect(page.locator('[data-error-for="evaluations"]')).toHaveText(
      "Agrega al menos una evaluación: escanea el QR del extintor.",
    );
    expect(writes).toEqual([]);
    await scan(page);
    await expect(
      toast(page, `Equipo #${TEAM_ID} agregado a la inspección`),
    ).toBeVisible();
    await expect(page.getByText("E2E Pasillo norte")).toBeVisible();

    // Lista de verificación: los 10 conceptos inician en "Cumple".
    const card = page.getByRole("region", {
      name: "Evaluación del extintor E2E-501",
    });
    await expect(card.getByText("Sin novedades")).toBeVisible();
    await expect(
      concept(page, "Manómetro").getByRole("button", {
        name: "Cumple",
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");

    // Una novedad: un toque (antes, dos listas y "Agregar").
    await concept(page, "Manómetro")
      .getByRole("button", { name: "No cumple" })
      .click();
    await expect(card.getByText("1 no cumple")).toBeVisible();
    await expect(page.getByText("1 no cumple", { exact: true })).toHaveCount(2);
    // "No cumple" elegido va en rojo sólido para que resalte.
    await expect(
      concept(page, "Manómetro").getByRole("button", { name: "No cumple" }),
    ).toHaveCSS("background-color", "rgb(211, 47, 47)");

    // El mismo concepto otra vez cambia el estado.
    await concept(page, "Manómetro")
      .getByRole("button", { name: "No aplica" })
      .click();
    await expect(card.getByText("1 no aplica")).toBeVisible();
    await expect(card.getByText("Sin novedades")).toBeVisible();

    // Volver a "Cumple" quita la novedad.
    await concept(page, "Sello")
      .getByRole("button", { name: "No cumple" })
      .click();
    await expect(card.getByText("1 no cumple")).toBeVisible();
    await concept(page, "Sello")
      .getByRole("button", { name: "Cumple", exact: true })
      .click();
    await expect(card.getByText("Sin novedades")).toBeVisible();

    await page
      .getByLabel("Observaciones generales")
      .fill("  Etiqueta despegada  ");

    // Escanear el mismo equipo otra vez no lo duplica.
    await scan(page);
    await expect(
      toast(page, "Ese equipo ya fue agregado en las evaluaciones"),
    ).toBeVisible();

    await saveButton(page).click();
    await expect(toast(page, "Inspección creada correctamente")).toBeVisible();
    await expect(page).toHaveURL(/\/extinguisher-inspection$/);

    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextRechargeDate = nextYear.toLocaleDateString("en-CA");
    expect(writes).toEqual([
      {
        method: "POST",
        path: "/extinguisher-inspections",
        body: {
          manufacturingPlantId: plant.id,
          evaluations: [
            {
              location: "E2E Pasillo norte",
              extinguisherNumber: "E2E-501",
              typeOfExtinguisher: "PQS",
              capacity: 6,
              pressureManometer: "NA",
              valve: "C",
              hose: "C",
              cylinder: "C",
              barrette: "C",
              seal: "C",
              cornet: "C",
              access: "C",
              support: "C",
              signaling: "C",
              nextRechargeDate,
              maintenanceDate: nextRechargeDate,
              observations: "Etiqueta despegada",
            },
          ],
        },
      },
    ]);
    expect(errors).toEqual([]);
  });

  test("rechaza la fecha de recarga pasada y permite quitar la evaluación", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    await fakeCamera(page, { qr: String(TEAM_ID) });
    await page.goto("/extinguisher-inspection/form");
    const [plant] = await sessionPlants(page);
    await pickOption(page, "Planta", plant.name);
    await mockGet(page, `/emergency-teams/${TEAM_ID}`, emergencyTeam(plant.id));

    await scan(page);
    await expect(page.getByText("E2E Pasillo norte")).toBeVisible();

    await fillDate(page, "Próxima recarga", "01/01/2020");
    await saveButton(page).click();
    await expect(
      toast(page, "La fecha de próxima recarga no puede ser anterior a hoy"),
    ).toBeVisible();

    await page.getByRole("button", { name: "Eliminar evaluación" }).click();
    await expect(page.getByText("E2E Pasillo norte")).toHaveCount(0);
    // La fecha sigue en el pasado: es lo primero que se marca, junto al campo.
    await saveButton(page).click();
    await expect(
      page
        .locator("#contenido")
        .getByText("La fecha de próxima recarga no puede ser anterior a hoy."),
    ).toBeVisible();
    expect(writes).toEqual([]);
  });

  test("un equipo de otra planta no se agrega", async ({ page }) => {
    await fakeCamera(page, { qr: String(TEAM_ID) });
    await page.goto("/extinguisher-inspection/form");
    const [plant] = await sessionPlants(page);
    await pickOption(page, "Planta", plant.name);
    await mockGet(
      page,
      `/emergency-teams/${TEAM_ID}`,
      emergencyTeam(plant.id + 1000),
    );

    await scan(page);
    await expect(
      toast(page, "El equipo escaneado pertenece a una planta diferente"),
    ).toBeVisible();
  });

  test("un QR sin número avisa", async ({ page }) => {
    await fakeCamera(page, { qr: "sin-numero" });
    await page.goto("/extinguisher-inspection/form");
    const [plant] = await sessionPlants(page);
    await pickOption(page, "Planta", plant.name);
    await scan(page);
    await expect(toast(page, "El QR no contiene un ID válido")).toBeVisible();
    await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  });

  test("avisa si el equipo del QR no existe", async ({ page }) => {
    await fakeCamera(page, { qr: String(TEAM_ID) });
    await mockGet(
      page,
      `/emergency-teams/${TEAM_ID}`,
      { message: "No encontrado" },
      { status: 404 },
    );
    await page.goto("/extinguisher-inspection/form");
    const [plant] = await sessionPlants(page);
    await pickOption(page, "Planta", plant.name);
    await scan(page);
    await expect(
      toast(page, "No se pudo obtener el equipo de emergencia desde el QR"),
    ).toBeVisible();
  });

  test("sin planta no abre el escáner", async ({ page }) => {
    await page.goto("/extinguisher-inspection/form");
    await expect(page.getByRole("combobox", { name: "Planta" })).toBeVisible();
    // Con una sola planta se elige sola; entonces no aplica.
    test.skip((await sessionPlants(page)).length === 1);
    await scan(page);
    await expect(
      toast(page, "Seleccione una planta antes de crear evaluación"),
    ).toBeVisible();
  });

  for (const [error, message] of [
    ["NotAllowedError", "Permiso de cámara denegado"],
    ["NotFoundError", "No se encontró ninguna cámara conectada."],
    ["OverconstrainedError", "No se encontró ninguna cámara conectada."],
    ["NotReadableError", "La cámara está en uso por otra aplicación"],
    ["AbortError", "No se pudo acceder a la cámara"],
    ["unsupported", "El navegador no permite usar la cámara"],
  ]) {
    test(`explica el error de cámara ${error}`, async ({ page }) => {
      await fakeCamera(page, { error });
      await page.goto("/extinguisher-inspection/form");
      const [plant] = await sessionPlants(page);
      await pickOption(page, "Planta", plant.name);
      await scan(page);
      await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
        message,
      );
    });
  }

  test("agrega evaluaciones a una inspección existente (sin guardar)", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);
    await page.goto("/extinguisher-inspection");
    const [plant] = await sessionPlants(page);
    const evaluation = {
      id: 9601,
      location: "E2E Bodega",
      extinguisherNumber: 77,
      typeOfExtinguisher: "CO2",
      capacity: 9,
      pressureManometer: "C",
      valve: "NC",
      hose: "NA",
      cylinder: "C",
      barrette: "C",
      seal: "C",
      cornet: "C",
      access: "C",
      support: "C",
      signaling: "C",
      nextRechargeDate: "2099-05-10",
      observations: null,
    };
    await mockGet(page, "/extinguisher-inspections/9600", {
      id: 9600,
      manufacturingPlant: plant,
      evaluations: [evaluation],
    });

    await page.goto("/extinguisher-inspection/form?id=9600");
    await expect(
      page.getByRole("heading", {
        name: "Agregar evaluaciones a la inspección",
      }),
    ).toBeVisible();
    await expect(page.getByText("E2E Bodega")).toBeVisible();
    // Las novedades guardadas aparecen marcadas en su concepto.
    await expect(
      concept(page, "Válvula").getByRole("button", { name: "No cumple" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      concept(page, "Manguera").getByRole("button", { name: "No aplica" }),
    ).toHaveAttribute("aria-pressed", "true");

    await saveButton(page).click();
    await expect(
      toast(page, "Evaluaciones agregadas correctamente"),
    ).toBeVisible();
    expect(writes).toEqual([
      {
        method: "PATCH",
        path: "/extinguisher-inspections/9600",
        body: {
          manufacturingPlantId: plant.id,
          evaluations: [
            expect.objectContaining({
              extinguisherNumber: "77",
              valve: "NC",
              hose: "NA",
              pressureManometer: "C",
              nextRechargeDate: "2099-05-10",
            }),
          ],
        },
      },
    ]);
    expect(errors).toEqual([]);
  });

  test("no guarda evaluaciones con número de extintor repetido", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    await page.goto("/extinguisher-inspection");
    const [plant] = await sessionPlants(page);
    const base = {
      location: "E2E",
      extinguisherNumber: 88,
      typeOfExtinguisher: "PQS",
      capacity: 6,
      pressureManometer: "C",
      valve: "C",
      hose: "C",
      cylinder: "C",
      barrette: "C",
      seal: "C",
      cornet: "C",
      access: "C",
      support: "C",
      signaling: "C",
      nextRechargeDate: null,
      observations: "",
    };
    await mockGet(page, "/extinguisher-inspections/9602", {
      id: 9602,
      manufacturingPlant: plant,
      evaluations: [
        { ...base, id: 1 },
        { ...base, id: 1 },
      ],
    });

    await page.goto("/extinguisher-inspection/form?id=9602");
    await expect(page.getByText("E2E", { exact: true })).toHaveCount(2);
    await saveButton(page).click();
    await expect(
      toast(page, "No se pueden guardar evaluaciones con IDs o números"),
    ).toBeVisible();
    expect(writes).toEqual([]);
  });

  test("los errores del API de cada evaluación se muestran en su tarjeta y la fecha en su campo", async ({
    page,
  }) => {
    await page.route("**/api/v1/extinguisher-inspections", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({
            status: 400,
            json: {
              statusCode: 400,
              code: "VALIDATION_FAILED",
              message:
                "Revisa 2 campos: Capacidad (renglón 1) y Próxima recarga (renglón 1).",
              error: "Bad Request",
              errors: {
                "evaluations.0.capacity": "Debe ser 1 o mayor.",
                "evaluations.0.nextRechargeDate": "Fecha no válida.",
              },
            },
          })
        : route.fallback(),
    );
    const plant = await openWithCamera(page, String(TEAM_ID));
    await mockGet(page, `/emergency-teams/${TEAM_ID}`, emergencyTeam(plant.id));
    await scan(page);
    await expect(page.getByText("E2E Pasillo norte")).toBeVisible();

    await saveButton(page).click();

    const card = page.getByRole("region", {
      name: "Evaluación del extintor E2E-501",
    });
    await expect(card.getByRole("alert")).toHaveText(
      "Capacidad: debe ser 1 o mayor.",
    );
    // La fecha es una sola para todas: su error va al campo de arriba.
    await expect(page.getByText("Fecha no válida.")).toBeVisible();
    await expect(toast(page, "Revisa los datos")).toBeVisible();
  });

  test("M1: agregar va arriba de las evaluaciones; Guardar y Cancelar al pie, con Guardar como principal", async ({
    page,
  }) => {
    const plant = await openWithCamera(page, String(TEAM_ID));
    await mockGet(page, `/emergency-teams/${TEAM_ID}`, emergencyTeam(plant.id));
    await scan(page);
    const card = page.getByRole("region", {
      name: "Evaluación del extintor E2E-501",
    });
    await expect(card).toBeVisible();

    const cancelButton = page.getByRole("button", {
      name: "Cancelar",
      exact: true,
    });
    const add = (await page
      .getByRole("button", { name: "Agregar evaluación" })
      .boundingBox())!;
    const cardBox = (await card.boundingBox())!;
    const cancel = (await cancelButton.boundingBox())!;
    const save = (await saveButton(page).boundingBox())!;

    expect(add.y).toBeLessThan(cardBox.y);
    // La barra de acciones queda fija al pie de la pantalla...
    const viewport = page.viewportSize()!;
    expect(cancel.y + cancel.height).toBeGreaterThan(viewport.height - 100);
    // ...y, al final de la página, después de las evaluaciones.
    await card.hover();
    await page.mouse.wheel(0, 5000);
    await expect
      .poll(async () => {
        const cardEnd = (await card.boundingBox())!;
        const bar = (await cancelButton.boundingBox())!;
        return bar.y - (cardEnd.y + cardEnd.height);
      })
      .toBeGreaterThan(0);
    // En escritorio, Guardar a la derecha de Cancelar.
    expect(save.x).toBeGreaterThan(cancel.x);
    await expect(saveButton(page)).toHaveClass(/MuiButton-contained/);
    await expect(
      page.getByRole("button", { name: "Cancelar", exact: true }),
    ).toHaveClass(/MuiButton-outlined/);

    // Observaciones con su límite a la vista.
    const observations = card.getByLabel("Observaciones generales");
    await observations.fill("x".repeat(520));
    await expect(observations).toHaveValue("x".repeat(500));
    await expect(card.getByText("500 / 500")).toBeVisible();
  });

  test.describe("en celular", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("la lista se ve en tarjetas con sus acciones", async ({ page }) => {
      await mockGet(
        page,
        "/extinguisher-inspections",
        {
          data: [
            {
              id: 9600,
              inspectionDate: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              manufacturingPlant: { id: 1, name: "E2E Planta" },
              responsible: { id: 1, name: "E2E Responsable" },
              createdBy: { id: 1, name: "E2E Autor" },
              evaluations: [{ id: 1 }, { id: 2 }],
            },
          ],
          count: 1,
        },
        { when: (url) => url.searchParams.has("page") },
      );
      await page.goto("/extinguisher-inspection");

      await expect(page.getByRole("table")).toHaveCount(0);
      const card = page
        .getByRole("list", { name: "Inspecciones de extintores" })
        .getByRole("listitem");
      await expect(card).toContainText("Inspección #9600");
      await expect(card).toContainText("E2E Planta");
      await expect(card).toContainText("E2E Responsable");
      await expect(
        card.getByRole("button", {
          name: "Descargar Excel de la inspección 9600",
        }),
      ).toBeVisible();
      // Inspección de hoy: se le pueden agregar evaluaciones.
      await expect(
        card.getByRole("button", {
          name: "Agregar evaluaciones a la inspección 9600",
        }),
      ).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test("sin inspecciones muestra el vacío compartido", async ({ page }) => {
      await mockGet(
        page,
        "/extinguisher-inspections",
        { data: [], count: 0 },
        { when: (url) => url.searchParams.has("page") },
      );
      await page.goto("/extinguisher-inspection");
      await expect(page.getByText("Sin registros")).toBeVisible();
      await expect(
        page.getByText("No hay inspecciones con los filtros actuales."),
      ).toBeVisible();
    });
  });
});
