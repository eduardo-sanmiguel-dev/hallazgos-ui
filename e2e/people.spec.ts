import type { Page } from "@playwright/test";

import { captureWrites, editingId, mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import {
  fillDate,
  pickMany,
  pickOption,
  toast,
  trackPageErrors,
} from "./support/ui";

// Usuarios, colaboradores y equipos de emergencia. Las escrituras se
// interceptan (ver captureWrites): no se toca la base.

const saveButton = (page: Page) =>
  page.getByRole("button", { name: "Guardar" });

/** Mensaje de error junto al campo (TextField o select, ver useFieldErrors). */
const fieldError = (page: Page, field: string) =>
  page.locator(`#campo-${field}-helper-text, [data-error-for="${field}"]`);

/** Abre en edición el primer registro de la tabla y espera sus datos. */
const editFirstRow = async (page: Page, route: string, loadedField: string) => {
  await page.goto(route);
  await page.getByRole("button", { name: "Editar" }).first().click();
  await expect(page).toHaveURL(new RegExp(`${route}/form\\?id=`));
  await expect(page.getByLabel(loadedField)).toHaveValue(/\S/);
  return editingId(page);
};

test.describe("Usuarios", () => {
  test("crea un supervisor validando correo y zonas (sin guardar)", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);

    await page.goto("/users/form");
    await page.getByLabel("Nombre").fill("E2E Supervisor (no se guarda)");
    await page.getByLabel("Correo electrónico").fill("e2e-supervisor");
    await page.getByLabel(/^Contraseña/).fill("e2e-password-123");
    await pickOption(page, "Rol", "Supervisor");
    const plants = await pickMany(page, "Plantas");

    await saveButton(page).click();
    await expect(fieldError(page, "email")).toHaveText(
      "El correo electrónico no es válido",
    );
    await expect(page.locator("#campo-email")).toBeFocused();

    await page.getByLabel("Correo electrónico").fill("e2e-supervisor@example.com");
    await saveButton(page).click();
    await expect(fieldError(page, "zoneNames")).toHaveText(
      "La zona es requerida",
    );
    expect(writes).toEqual([]);

    const zones = await pickMany(page, "Zonas");
    const processes = await pickMany(page, "Procesos (opcional)");
    await saveButton(page).click();
    await expect(toast(page, "Usuario creado correctamente")).toBeVisible();
    await expect(page).toHaveURL(/\/users$/);

    expect(writes).toEqual([
      {
        method: "POST",
        path: "/users",
        body: {
          name: "E2E Supervisor (no se guarda)",
          email: "e2e-supervisor@example.com",
          password: "e2e-password-123",
          rule: "Supervisor",
          manufacturingPlantNames: plants,
          zoneNames: zones,
          processNames: processes,
        },
      },
    ]);
    expect(errors).toEqual([]);
  });

  test("un usuario General no envía zonas ni procesos", async ({ page }) => {
    const writes = await captureWrites(page);

    await page.goto("/users/form");
    await page.getByLabel("Nombre").fill("E2E General (no se guarda)");
    await page.getByLabel("Correo electrónico").fill("e2e-general@example.com");
    await page.getByLabel(/^Contraseña/).fill("e2e-password-123");
    await pickOption(page, "Rol", "General");
    await pickMany(page, "Plantas");
    await expect(page.getByRole("combobox", { name: "Zonas" })).toHaveCount(0);

    await saveButton(page).click();
    await expect(toast(page, "Usuario creado correctamente")).toBeVisible();
    expect(writes[0].body).toMatchObject({
      rule: "General",
      zoneNames: [],
      processNames: [],
    });
  });

  test("muestra y oculta la contraseña", async ({ page }) => {
    await page.goto("/users/form");
    const password = page.getByLabel(/^Contraseña/);
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Mostrar contraseña" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Ocultar contraseña" }).click();
    await expect(password).toHaveAttribute("type", "password");
  });

  // La API ya no manda zonas ni procesos en el listado paginado (se cargan al
  // editar): la tabla no los muestra ni los necesita.
  test("la tabla muestra plantas pero no zonas ni procesos", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    await mockGet(
      page,
      "/users",
      {
        data: [
          {
            id: 9852,
            name: "E2E Supervisor",
            email: "e2e-sup@example.com",
            role: "Supervisor",
            isActive: true,
            createdAt: "2026-10-01T10:00:00.000Z",
            updatedAt: "2026-10-01T10:00:00.000Z",
            manufacturingPlants: [
              { id: 1, name: "Planta A" },
              { id: 2, name: "Planta B" },
            ],
          },
        ],
        count: 1,
      },
      { when: (url) => url.searchParams.has("page") },
    );

    await page.goto("/users");
    const row = page.getByRole("row", { name: /E2E Supervisor/ });
    await expect(row).toContainText("Planta A, Planta B");
    await expect(page.getByRole("columnheader", { name: "Plantas" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Zonas" })).toHaveCount(0);
    await expect(
      page.getByRole("columnheader", { name: "Procesos" }),
    ).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("edita un usuario sin exigir contraseña (sin guardar)", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);

    const id = await editFirstRow(page, "/users", "Correo electrónico");
    await expect(page.getByLabel(/^Contraseña/)).toHaveValue("");
    const email = await page.getByLabel("Correo electrónico").inputValue();

    await saveButton(page).click();
    await expect(toast(page, "Usuario actualizado correctamente")).toBeVisible();

    expect(writes).toEqual([
      {
        method: "PATCH",
        path: `/users/${id}`,
        body: expect.objectContaining({ email, password: "" }),
      },
    ]);
    expect(errors).toEqual([]);
  });
});

test.describe("Colaboradores", () => {
  test("crea un colaborador (sin guardar)", async ({ page }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);

    await page.goto("/employees/form");
    await page.getByLabel("Código de empleado").fill("990001");
    await page.getByLabel("Nombre completo").fill("E2E Colaborador (no se guarda)");
    await fillDate(page, "Fecha de nacimiento *", "15/03/1990");
    await fillDate(page, "Fecha de admisión *", "01/02/2020");
    await pickOption(page, "Area *");
    await pickOption(page, "Puesto *");
    await expect(saveButton(page)).toBeDisabled();
    await pickOption(page, "Género *");
    await pickMany(page, "Plantas");

    await saveButton(page).click();
    await expect(toast(page, "Colaborador creado correctamente")).toBeVisible();
    await expect(page).toHaveURL(/\/employees$/);

    expect(writes).toHaveLength(1);
    const [{ method, path, body }] = writes;
    expect({ method, path }).toEqual({ method: "POST", path: "/employees" });
    expect(body).toMatchObject({
      code: "990001",
      name: "E2E Colaborador (no se guarda)",
      areaId: expect.stringMatching(/^\d+$/),
      positionId: expect.stringMatching(/^\d+$/),
      genderId: expect.stringMatching(/^\d+$/),
      manufacturingPlantsIds: [expect.any(Number)],
    });
    // Las fechas viajan en ISO; el día se conserva en la zona del navegador.
    const { birthdate, dateOfAdmission } = body as Record<string, string>;
    expect(new Date(birthdate).toLocaleDateString("es-MX")).toBe("15/3/1990");
    expect(new Date(dateOfAdmission).toLocaleDateString("es-MX")).toBe(
      "1/2/2020",
    );
    expect(errors).toEqual([]);
  });

  test("edita un colaborador desde la tabla (sin guardar)", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);

    const id = await editFirstRow(page, "/employees", "Nombre completo");
    const name = (await page.getByLabel("Nombre completo").inputValue()).trim();
    await expect(saveButton(page)).toBeEnabled();

    await saveButton(page).click();
    await expect(
      toast(page, "Colaborador actualizado correctamente"),
    ).toBeVisible();

    expect(writes).toEqual([
      {
        method: "PATCH",
        path: `/employees/${id}`,
        body: expect.objectContaining({ name }),
      },
    ]);
    expect(errors).toEqual([]);
  });
});

test.describe("Equipos de emergencia", () => {
  test("los campos se habilitan al elegir planta y se crea (sin guardar)", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);

    await page.goto("/emergency-teams/form");
    const location = page.getByLabel("Ubicación");
    // Con una sola planta se elige sola; si hay varias, hay que elegirla.
    if (await location.isDisabled()) await pickOption(page, "Planta");
    await expect(location).toBeEnabled();

    await location.fill("E2E Pasillo (no se guarda)");
    // Solo letras, números y guiones.
    await page.getByLabel("Núm. Extintor").fill("E2E-01 #");
    await expect(page.getByLabel("Núm. Extintor")).toHaveValue("E2E-01");
    const type = await pickOption(page, "Tipo de extintor", /^(?!Seleccione)/);
    await page.getByLabel("Capacidad").fill("6");

    await saveButton(page).click();
    await expect(
      toast(page, "Equipo de emergencia creado correctamente"),
    ).toBeVisible();

    expect(writes).toEqual([
      {
        method: "POST",
        path: "/emergency-teams",
        body: {
          location: "E2E Pasillo (no se guarda)",
          extinguisherNumber: "E2E-01",
          typeOfExtinguisher: type,
          capacity: 6,
          manufacturingPlantId: expect.any(Number),
        },
      },
    ]);
    expect(errors).toEqual([]);
  });

  test("edita un equipo desde la tabla (sin guardar)", async ({ page }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);

    const id = await editFirstRow(page, "/emergency-teams", "Ubicación");
    const location = (await page.getByLabel("Ubicación").inputValue()).trim();

    await saveButton(page).click();
    await expect(
      toast(page, "Equipo de emergencia actualizado correctamente"),
    ).toBeVisible();

    expect(writes).toEqual([
      {
        method: "PATCH",
        path: `/emergency-teams/${id}`,
        body: expect.objectContaining({ location }),
      },
    ]);
    expect(errors).toEqual([]);
  });
});

test("edita un colaborador al que le faltan datos (sin guardar)", async ({
  page,
}) => {
  const writes = await captureWrites(page);
  await mockGet(page, "/employees/9851", {
    id: 9851,
    code: 777,
    name: "E2E Colaborador incompleto",
    birthdate: null,
    dateOfAdmission: null,
    area: null,
    position: null,
    gender: null,
    manufacturingPlants: [],
  });
  await page.goto("/employees/form?id=9851");
  await expect(page.getByLabel("Nombre completo")).toHaveValue(
    "E2E Colaborador incompleto",
  );
  // Faltan datos obligatorios: no se puede guardar hasta completarlos.
  await expect(saveButton(page)).toBeDisabled();
  await fillDate(page, "Fecha de nacimiento *", "15/03/1990");
  await fillDate(page, "Fecha de admisión *", "01/02/2020");
  await pickOption(page, "Area *");
  await pickOption(page, "Puesto *");
  await pickOption(page, "Género *");
  await pickMany(page, "Plantas");
  await saveButton(page).click();
  await expect(toast(page, "Colaborador actualizado correctamente")).toBeVisible();
  expect(writes[0]).toMatchObject({ method: "PATCH", path: "/employees/9851" });
});
