import type { Page } from "@playwright/test";

import { captureWrites, editingId } from "./support/api";
import { expect, test } from "./support/fixtures";
import { pickOption, toast, trackPageErrors } from "./support/ui";

// Altas y ediciones de catálogos. Las escrituras se interceptan (ver
// captureWrites): se valida lo que el UI envía, sin tocar la base.

interface CatalogCase {
  name: string;
  route: string;
  resource: string;
  createdToast: string;
  updatedToast: string;
  /** Llena los campos además del nombre; regresa lo que debe enviarse. */
  fill?: (page: Page) => Promise<Record<string, unknown>>;
  /** Completa lo que un registro existente pueda traer vacío. */
  completeEdit?: (page: Page) => Promise<void>;
}

const pickPlant = async (page: Page) => {
  await pickOption(page, "Planta");
  return { manufacturingPlantId: expect.any(Number) };
};

const CATALOGS: CatalogCase[] = [
  {
    name: "criterios",
    route: "/main-types",
    resource: "/main-types",
    createdToast: "Criterio creado correctamente",
    updatedToast: "Criterio actualizado correctamente",
  },
  {
    name: "tipos de criterio",
    route: "/secondary-types",
    resource: "/secondary-types",
    createdToast: "Tipo de criterio creado correctamente",
    updatedToast: "Tipo de criterio actualizado correctamente",
    fill: async (page) => {
      await pickOption(page, "Criterio");
      await pickOption(page, "Responsable", "Seguridad");
      return { mainTypeId: expect.any(Number), typeResponsible: "Seguridad" };
    },
    // Hay registros sin responsable: el formulario obliga a elegir uno.
    completeEdit: async (page) => {
      const responsible = page.getByRole("combobox", { name: "Responsable" });
      await expect(page.getByRole("combobox", { name: "Criterio" })).toHaveText(
        /\S/,
      );
      // MUI Select vacío muestra un espacio de ancho cero.
      if (!(await responsible.innerText()).replace(/[\s​]/g, "")) {
        await pickOption(page, "Responsable", "Seguridad");
      }
    },
  },
  {
    name: "procesos",
    route: "/processes",
    resource: "/processes",
    createdToast: "Proceso creado correctamente",
    updatedToast: "Proceso actualizado correctamente",
    fill: pickPlant,
  },
  {
    name: "lugares",
    route: "/zones",
    resource: "/zones",
    createdToast: "Lugar creado correctamente",
    updatedToast: "Lugar actualizado correctamente",
    fill: async (page) => {
      const plant = await pickPlant(page);
      await pickOption(page, "Zona (opcional)");
      return { ...plant, areaId: expect.any(Number) };
    },
  },
  {
    name: "zonas",
    route: "/areas",
    resource: "/areas",
    createdToast: "Zona creada correctamente",
    updatedToast: "Zona actualizada correctamente",
    fill: pickPlant,
  },
  {
    name: "plantas",
    route: "/manufacturing-plants",
    resource: "/manufacturing-plants",
    createdToast: "Planta creada correctamente",
    updatedToast: "Planta actualizada correctamente",
    fill: async (page) => {
      await page.getByLabel("Link").fill("https://maps.example.com/e2e");
      await page.getByLabel("Latitud").fill("19.4326");
      await page.getByLabel("Longitud").fill("-99.1332");
      return {
        link: "https://maps.example.com/e2e",
        lat: 19.4326,
        lng: -99.1332,
      };
    },
  },
];

const saveButton = (page: Page) =>
  page.getByRole("button", { name: "Guardar" });

for (const catalog of CATALOGS) {
  test.describe(`Catálogo: ${catalog.name}`, () => {
    test("crea un registro (sin guardar en la base)", async ({ page }) => {
      const errors = trackPageErrors(page);
      const writes = await captureWrites(page);

      await page.goto(`${catalog.route}/form`);
      await expect(saveButton(page)).toBeDisabled();

      const name = `E2E ${catalog.name} (no se guarda)`;
      await page.getByLabel("Nombre").fill(name);
      const expected = (await catalog.fill?.(page)) ?? {};

      await saveButton(page).click();
      await expect(toast(page, catalog.createdToast)).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`${catalog.route}$`));

      expect(writes).toEqual([
        {
          method: "POST",
          path: catalog.resource,
          body: expect.objectContaining({ name, ...expected }),
        },
      ]);
      expect(errors).toEqual([]);
    });

    test("edita un registro desde la tabla (sin guardar)", async ({
      page,
    }) => {
      const errors = trackPageErrors(page);
      const writes = await captureWrites(page);

      await page.goto(catalog.route);
      await page.getByRole("button", { name: "Editar" }).first().click();
      await expect(page).toHaveURL(new RegExp(`${catalog.route}/form\\?id=`));

      // Espera a que el formulario cargue el registro.
      const nameInput = page.getByLabel("Nombre");
      await expect(nameInput).toHaveValue(/\S/);
      const name = (await nameInput.inputValue()).trim();
      const id = editingId(page);
      await catalog.completeEdit?.(page);

      await saveButton(page).click();
      await expect(toast(page, catalog.updatedToast)).toBeVisible();

      expect(writes).toEqual([
        {
          method: "PATCH",
          path: `${catalog.resource}/${id}`,
          body: expect.objectContaining({ name }),
        },
      ]);
      expect(errors).toEqual([]);
    });
  });
}

test("tipos de criterio: exige el responsable al guardar", async ({ page }) => {
  const writes = await captureWrites(page);

  await page.goto("/secondary-types/form");
  await page.getByLabel("Nombre").fill("E2E sin responsable");
  await pickOption(page, "Criterio");

  // El botón se habilita sin responsable; la validación ocurre al guardar.
  await saveButton(page).click();
  await expect(
    page.locator('[data-error-for="typeResponsible"]'),
  ).toHaveText("El tipo de responsable es requerido");
  expect(writes).toEqual([]);
});

test("un nombre de puros espacios no habilita Guardar", async ({ page }) => {
  await page.goto("/main-types/form");
  await page.getByLabel("Nombre").fill("   ");
  await expect(saveButton(page)).toBeDisabled();
});
