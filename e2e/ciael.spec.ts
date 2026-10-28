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
 * Obligatorios en el orden del formulario (secciones Evento, Colaborador,
 * Lesión, Causas y Responsables): mensaje junto al campo y cómo se llena.
 */
const FIELDS: Array<[string, string, (page: Page) => Promise<unknown>]> = [
  ["manufacturingPlant", "Selecciona la planta.", async (page) => {
    const [plant] = await sessionPlants(page);
    await pickOption(page, "Planta *", plant.name);
  }],
  ["eventDate", "Elige la fecha del evento.", (p) =>
    fillDate(p, "Fecha del evento *", "02/03/2026")],
  ["typeOfEvent", "Selecciona el tipo de evento.", (p) => pickOption(p, "Tipo de evento *")],
  ["natureOfEvent", "Selecciona la naturaleza del evento.", (p) => pickOption(p, "Naturaleza del evento *")],
  ["zone", "Selecciona la zona.", (p) => pickOption(p, "Zona *")],
  ["isInside", "Indica si fue dentro de la empresa.", (p) => pickOption(p, "Dentro de la empresa *", "Si")],
  ["description", "Describe el evento.", (p) =>
    p.getByLabel("Descripción del evento *").fill("  E2E se golpeó la mano  ")],
  ["employee", "Selecciona el colaborador.", (p) => pickOption(p, "Colaborador *")],
  ["accidentPosition", "Selecciona el nombre del cargo.", (p) => pickOption(p, "Nombre del cargo *")],
  ["typeOfLink", "Selecciona el tipo de vinculación.", (p) => pickOption(p, "Tipo de vinculación *")],
  ["workingDay", "Selecciona la jornada.", (p) => pickOption(p, "Jornada *")],
  ["timeWorked", "Escribe las horas laboradas antes del AT.", (p) =>
    p.getByLabel("Tiempo laborado previo al AT (H) *").fill("4")],
  ["usualWork", "Indica si era su labor habitual.", (p) => pickOption(p, "Labor habitual *", "Si")],
  ["cieDiagnosis", "Selecciona el diagnóstico CIE.", (p) => pickOption(p, "Diagnóstico CIE *")],
  ["bodyPart", "Selecciona la parte del cuerpo afectada.", (p) => pickOption(p, "Parte del cuerpo afectada *")],
  ["typeOfInjury", "Selecciona el tipo de lesión.", (p) => pickOption(p, "Tipo de lesión *")],
  ["isDeath", "Indica si causó la muerte.", (p) => pickOption(p, "Muerte *", "No")],
  ["atAgent", "Selecciona el agente AT.", (p) => pickOption(p, "Agente AT *")],
  ["atMechanism", "Selecciona el mecanismo o forma del AT.", (p) => pickOption(p, "Mecanismo o formas del AT *")],
  ["riskFactor", "Selecciona el factor de riesgo asociado.", (p) => pickOption(p, "Factor de riesgo asociado *")],
  ["machine", "Selecciona la máquina o equipo.", (p) => pickOption(p, "Máquina / Equipo *")],
  ["associatedTask", "Selecciona la tarea asociada.", (p) => pickOption(p, "Tarea asociada *")],
  ["areaLeader", "Selecciona el líder de área.", (p) => pickOption(p, "Líder de área *", "E2E Líder")],
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
              {
                id: 52,
                name: "E2E Otro lugar",
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
  test("el formulario está dividido en secciones", async ({ page }) => {
    const dialog = await openDialog(page);

    for (const name of ["Evento", "Colaborador", "Lesión", "Causas", "Responsables"]) {
      await expect(dialog.getByRole("region", { name })).toBeVisible();
    }
    // Lo que depende de la planta o de la zona espera a que se elijan.
    await expect(dialog.getByRole("combobox", { name: "Colaborador *" })).toBeDisabled();
    await expect(dialog.getByRole("combobox", { name: "Líder de área *" })).toBeDisabled();
    // Teclado numérico en los campos de números.
    await expect(dialog.getByLabel("Días de incapacidad")).toHaveAttribute("inputmode", "numeric");
    await expect(
      dialog.getByLabel("Tiempo laborado previo al AT (H) *"),
    ).toHaveAttribute("inputmode", "numeric");
  });

  test("cambiar la planta o la zona limpia lo que depende de ellas y avisa", async ({
    page,
  }) => {
    const dialog = await openDialog(page);
    const plants = await sessionPlants(page);
    test.skip(plants.length < 2, "El usuario de e2e necesita dos plantas.");
    /** Texto elegido en un select (SelectDefault lo pinta junto al input). */
    const selected = (label: string) =>
      dialog.locator(".MuiAutocomplete-root", {
        has: page.getByRole("combobox", { name: label, exact: true }),
      });

    await pickOption(page, "Planta *", plants[0].name);
    await pickOption(page, "Zona *", "E2E Lugar");
    await pickOption(page, "Colaborador *");
    await pickOption(page, "Líder de área *", "E2E Líder");
    await pickOption(page, "Parte del cuerpo afectada *");

    // La zona: solo se limpia el líder de área.
    await pickOption(page, "Zona *", "E2E Otro lugar");
    await expect(
      toast(page, "Vuelve a elegir líder de área: depende de la zona."),
    ).toBeVisible();
    await expect(selected("Líder de área *")).not.toContainText("E2E Líder");
    await expect(selected("Colaborador *")).toContainText("E2E Colaborador");

    // La planta: zona, colaborador y lo demás que depende de ella.
    await pickOption(page, "Líder de área *", "E2E Líder");
    await pickOption(page, "Planta *", plants[1].name);
    await expect(
      toast(
        page,
        "Vuelve a elegir zona, colaborador y líder de área: dependen de la planta.",
      ),
    ).toBeVisible();
    await expect(selected("Zona *")).not.toContainText("E2E");
    await expect(selected("Colaborador *")).not.toContainText("E2E");
    await expect(selected("Líder de área *")).not.toContainText("E2E");
    await expect(dialog.getByRole("combobox", { name: "Líder de área *" })).toBeDisabled();
    // Lo que no depende de la planta se conserva.
    await expect(selected("Parte del cuerpo afectada *")).toContainText("E2E Mano");
  });

  test("marca todo lo que falta y crea el registro (sin guardar)", async ({
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

    // Guardar nunca está deshabilitado: al tocarlo marca todos los que faltan
    // junto a su campo y enfoca el primero.
    await expect(save).toBeEnabled();
    await save.click();
    await expect(toast(page, `Completa los ${FIELDS.length} campos marcados.`)).toBeVisible();
    for (const [, message] of FIELDS) {
      await expect(dialog.getByText(message, { exact: true })).toBeVisible();
    }
    await expect(dialog.getByRole("combobox", { name: "Planta *" })).toBeFocused();

    // Cada marca se quita al llenar su campo; las demás siguen.
    const [, plantMessage, fillPlant] = FIELDS[0];
    await fillPlant(page);
    await expect(dialog.getByText(plantMessage, { exact: true })).toHaveCount(0);
    await expect(
      dialog.getByText("Selecciona el colaborador.", { exact: true }),
    ).toBeVisible();

    // Con uno solo pendiente, el aviso dice cuál.
    const [, lastMessage, fillLast] = FIELDS.at(-1)!;
    for (const [, , fill] of FIELDS.slice(1, -1)) await fill(page);
    await save.click();
    await expect(toast(page, lastMessage)).toBeVisible();
    await expect(dialog.getByText(lastMessage, { exact: true })).toBeVisible();
    expect(writes).toEqual([]);
    await fillLast(page);

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

  test("vacío se cierra directo; con datos pide confirmar antes de descartar", async ({
    page,
  }) => {
    let dialog = await openDialog(page);
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByText("Nuevo registro CIAEL")).toHaveCount(0);

    await page.getByRole("button", { name: "Crear registro" }).click();
    dialog = page.getByRole("dialog", { name: "Nuevo registro CIAEL" });
    await dialog.getByLabel("Días de incapacidad").fill("3");

    // "Seguir editando" conserva lo capturado.
    await dialog.getByRole("button", { name: "Cerrar" }).click();
    const confirmation = page.getByRole("dialog", { name: "¿Descartar el registro?" });
    await confirmation.getByRole("button", { name: "Seguir editando" }).click();
    await expect(dialog.getByLabel("Días de incapacidad")).toHaveValue("3");

    // Esc también pregunta; "Descartar" cierra y limpia.
    await page.keyboard.press("Escape");
    await confirmation.getByRole("button", { name: "Descartar" }).click();
    await expect(page.getByText("Nuevo registro CIAEL")).toHaveCount(0);

    await page.getByRole("button", { name: "Crear registro" }).click();
    await expect(page.getByRole("dialog").getByLabel("Días de incapacidad")).toHaveValue("");
  });

  test.describe("en celular", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("la lista se ve en tarjetas sin desplazarse de lado", async ({ page }) => {
      await mockGet(
        page,
        "/ciaels",
        {
          data: [
            {
              id: 9700,
              eventDate: "2026-10-01",
              createdAt: new Date().toISOString(),
              typeOfEvent: { name: "E2E Accidente" },
              employee: { name: "E2E Colaborador" },
              cieDiagnosis: { name: "E2E Contusión" },
              zone: { name: "E2E Lugar", area: { name: "E2E Zona" } },
              createdBy: { name: "E2E Autor" },
            },
          ],
          count: 1,
        },
        { when: (url) => url.searchParams.has("page") },
      );
      await page.goto("/ciael");

      await expect(page.getByRole("table")).toHaveCount(0);
      const card = page
        .getByRole("list", { name: "Registros CIAEL" })
        .getByRole("listitem");
      await expect(card).toContainText("E2E Accidente · 01 octubre 2026");
      await expect(card).toContainText("E2E Colaborador");
      await expect(card).toContainText("E2E Contusión");
      await expect(card).toContainText("E2E Lugar · E2E Zona");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
});
