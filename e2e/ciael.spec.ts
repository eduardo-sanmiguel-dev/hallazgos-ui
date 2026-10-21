import type { Page } from "@playwright/test";

import { captureWrites, mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import {
  fillDate,
  pickOption,
  sessionPlants,
  toast,
  trackPageErrors,
} from "./support/ui";

// Alta de CIAEL. Los catálogos traen datos fijos (mockGet) para que todos los
// selects tengan opciones; el alta se intercepta (captureWrites).

const option = (id: number, name: string) => ({ id, name });

const CATALOGS: Record<string, unknown[]> = {
  "/types-of-events": [option(1, "E2E Accidente")],
  "/cie-diagnoses": [option(1, "E2E Contusión")],
  "/body-parts": [option(1, "E2E Mano")],
  "/at-agents": [option(1, "E2E Herramienta")],
  "/type-of-injuries": [option(1, "E2E Golpe")],
  "/at-mechanisms": [option(1, "E2E Caída")],
  "/working-days": [option(1, "E2E Matutina")],
  "/type-of-links": [option(1, "E2E Directo")],
  "/risk-factors": [option(1, "E2E Mecánico")],
  "/nature-of-events": [option(1, "E2E Operativa")],
  "/users": [option(31, "E2E Líder"), option(32, "E2E Gestor")],
  "/employees": [option(41, "E2E Colaborador")],
  "/accident-positions": [option(1, "E2E Operador")],
  "/machines": [option(1, "E2E Prensa")],
  "/associated-tasks": [option(1, "E2E Ensamble")],
};

/**
 * Validaciones en el orden del formulario: lo que reporta el error y cómo se
 * llena ese campo.
 */
const FIELDS: Array<[string, string, (page: Page) => Promise<unknown>]> = [
  ["manufacturingPlant", "Seleccione una planta", async (page) => {
    const [plant] = await sessionPlants(page);
    await pickOption(page, "Planta *", plant.name);
  }],
  ["typeOfEvent", "Seleccione un tipo de evento", (p) => pickOption(p, "Tipo de evento *")],
  ["cieDiagnosis", "Seleccione un diagnóstico CIE", (p) => pickOption(p, "Diagnóstico CIE *")],
  ["employee", "Seleccione un colaborador", (p) => pickOption(p, "Colaborador *")],
  ["eventDate", "Seleccione la fecha del evento", (p) =>
    fillDate(p, "Fecha del evento *", "02/03/2026")],
  ["description", "Ingrese la descripción del evento", (p) =>
    p.getByLabel("Descripción del evento *").fill("  E2E se golpeó la mano  ")],
  ["zone", "Seleccione una zona", (p) => pickOption(p, "Zona *")],
  ["accidentPosition", "Seleccione un nombre del cargo", (p) => pickOption(p, "Nombre del cargo *")],
  ["bodyPart", "Seleccione una parte del cuerpo afectada", (p) => pickOption(p, "Parte del cuerpo afectada *")],
  ["atAgent", "Seleccione un agente AT", (p) => pickOption(p, "Agente AT *")],
  ["typeOfInjury", "Seleccione un tipo de lesión", (p) => pickOption(p, "Tipo de lesión *")],
  ["atMechanism", "Seleccione un mecanismo o formas del AT", (p) => pickOption(p, "Mecanismo o formas del AT *")],
  ["workingDay", "Seleccione una jornada", (p) => pickOption(p, "Jornada *")],
  ["timeWorked", "Ingrese el tiempo laborado previo al AT", (p) =>
    p.getByLabel("Tiempo laborado previo al AT (H) *").fill("4")],
  ["usualWork", "Seleccione si es labor habitual", (p) => pickOption(p, "Labor habitual *", "Si")],
  ["typeOfLink", "Seleccione un tipo de vinculación", (p) => pickOption(p, "Tipo de vinculación *")],
  ["isDeath", "Seleccione si causó la muerte", (p) => pickOption(p, "Muerte *", "No")],
  ["machine", "Seleccione una máquina o equipo", (p) => pickOption(p, "Máquina / Equipo *")],
  ["isInside", "Seleccione si fue dentro de la planta", (p) => pickOption(p, "Dentro de la empresa *", "Si")],
  ["associatedTask", "Seleccione una tarea asociada", (p) => pickOption(p, "Tarea asociada *")],
  ["areaLeader", "Seleccione un líder de área", (p) => pickOption(p, "Líder de área *", "E2E Líder")],
  ["riskFactor", "Seleccione un factor de riesgo asociado", (p) => pickOption(p, "Factor de riesgo asociado *")],
  ["natureOfEvent", "Seleccione una naturaleza del evento", (p) => pickOption(p, "Naturaleza del evento *")],
];

const openDialog = async (page: Page) => {
  await page.route(
    (url) => url.pathname.endsWith("/api/v1/zones"),
    (route) =>
      route.request().method() === "GET"
        ? route.fulfill({
            json: [
              {
                id: 51,
                name: "E2E Lugar",
                area: { id: 61, name: "E2E Zona" },
                manufacturingPlant: { id: 1, name: "Planta" },
              },
            ],
          })
        : route.fallback(),
  );
  for (const [path, json] of Object.entries(CATALOGS)) {
    await mockGet(page, path, json);
  }
  await page.goto("/ciael");
  await page.getByRole("button", { name: "Crear registro" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Nuevo registro CIAEL")).toBeVisible();
  return dialog;
};

test.describe("CIAEL", () => {
  test("valida cada campo en orden y crea el registro (sin guardar)", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);
    const dialog = await openDialog(page);
    const save = dialog.getByRole("button", { name: "Guardar" });

    // Días de incapacidad: solo enteros positivos.
    const days = dialog.getByLabel("Días de incapacidad");
    await days.pressSequentially("e-0");
    await expect(days).toHaveValue("");
    await days.fill("12a");
    await expect(days).toHaveValue("12");

    for (const [, message, fill] of FIELDS) {
      await save.click();
      await expect(toast(page, message).first()).toBeVisible();
      await fill(page);
    }
    expect(writes).toEqual([]);

    await pickOption(page, "Gestor en turno", "E2E Gestor");
    await save.click();
    await expect(toast(page, "CIAEL creado con éxito")).toBeVisible();
    await expect(page.getByText("Nuevo registro CIAEL")).toHaveCount(0);

    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({
      method: "POST",
      path: "/ciaels",
      body: expect.objectContaining({
        description: "E2E se golpeó la mano",
        daysOfDisability: "12",
        timeWorked: "4",
        usualWork: true,
        isDeath: false,
        isInside: true,
        managerId: "32",
      }),
    });
    expect(errors).toEqual([]);
  });

  test("cerrar el diálogo descarta lo capturado", async ({ page }) => {
    const dialog = await openDialog(page);
    await dialog.getByLabel("Días de incapacidad").fill("3");
    await dialog.getByRole("button", { name: "Cerrar" }).click();
    await expect(page.getByText("Nuevo registro CIAEL")).toHaveCount(0);

    await page.getByRole("button", { name: "Crear registro" }).click();
    await expect(page.getByRole("dialog").getByLabel("Días de incapacidad")).toHaveValue("");
  });
});
