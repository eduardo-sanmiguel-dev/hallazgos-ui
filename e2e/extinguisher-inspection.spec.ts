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
  page.getByRole("button", { name: "Crear evaluación" }).click();

const saveButton = (page: Page) =>
  page.getByRole("button", { name: "Guardar" });

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

    await expect(saveButton(page)).toBeDisabled();
    await scan(page);
    await expect(
      toast(page, `Equipo #${TEAM_ID} agregado a la inspección`),
    ).toBeVisible();
    await expect(page.getByText("E2E Pasillo norte")).toBeVisible();

    // Sin elegir novedad y estado no se agrega.
    await page.getByRole("button", { name: "Agregar", exact: true }).click();
    await expect(
      toast(page, "Seleccione novedad y estado para agregar"),
    ).toBeVisible();

    await pickOption(page, "Novedad", "Manómetro");
    await pickOption(page, "Estado", "NC: NO CUMPLE");
    await page.getByRole("button", { name: "Agregar", exact: true }).click();
    await expect(toast(page, "Novedad agregada")).toBeVisible();

    // El mismo concepto otra vez actualiza el estado.
    await pickOption(page, "Novedad", "Manómetro");
    await pickOption(page, "Estado", "NA: No Aplica");
    await page.getByRole("button", { name: "Agregar", exact: true }).click();
    await expect(toast(page, "Novedad actualizada")).toBeVisible();

    await pickOption(page, "Novedad", "Sello");
    await pickOption(page, "Estado", "NC: NO CUMPLE");
    await page.getByRole("button", { name: "Agregar", exact: true }).click();
    await expect(page.getByRole("cell", { name: "Sello" })).toBeVisible();
    await page.getByRole("button", { name: "Quitar novedad" }).last().click();
    await expect(page.getByRole("cell", { name: "Sello" })).toHaveCount(0);

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
    await expect(saveButton(page)).toBeDisabled();
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

  test("un QR sin número avisa", async ({
    page,
  }) => {
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
      await expect(
        page.getByRole("dialog").getByRole("alert"),
      ).toContainText(message);
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
      page.getByRole("heading", { name: "Agregar evaluaciones a la inspección" }),
    ).toBeVisible();
    await expect(page.getByText("E2E Bodega")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Válvula" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Manguera" })).toBeVisible();

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
});
