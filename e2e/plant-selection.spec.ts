import type { Page } from "@playwright/test";
import { expect, test } from "./support/fixtures";
import { mockGet } from "./support/api";
import { openFilters, pickMany, pickOption, sessionPlants, trackPageErrors } from "./support/ui";

const plantField = (page: Page) => page.getByRole("combobox", { name: "Planta", exact: true });
// SelectDefault muestra la seleccion con renderValue, junto al input de busqueda.
const plantValue = (page: Page) =>
  page.locator(".MuiAutocomplete-root", { has: plantField(page) }).locator(".MuiInputBase-root");

test("la lista y el dialogo de EPP comparten la seleccion", async ({ page }) => {
  await page.goto("/epp");
  const plants = await sessionPlants(page);
  test.skip(plants.length < 2, "Requiere dos plantas asignadas");
  await pickOption(page, "Planta", plants[0].name);
  await page.getByRole("button", { name: "Crear registro", exact: true }).click();
  await expect(plantValue(page)).toContainText(plants[0].name);
  await pickOption(page, "Planta", plants[1].name);
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await openFilters(page);
  await expect(plantValue(page)).toContainText(plants[1].name);
  await page.reload();
  await openFilters(page);
  await expect(plantValue(page)).toContainText(plants[1].name);
  await pickOption(page, "Planta", plants[0].name);
  await page.getByRole("button", { name: "Crear registro", exact: true }).click();
  await expect(plantValue(page)).toContainText(plants[0].name);
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await pickOption(page, "Planta", plants[1].name);
  await page.getByRole("button", { name: "Crear registro", exact: true }).click();
  await expect(plantValue(page)).toContainText(plants[1].name);
});

test("ignora preferencias de otro usuario o de una planta sin acceso", async ({ page }) => {
  await page.goto("/epp");
  const plants = await sessionPlants(page);
  test.skip(plants.length < 2, "Requiere dos plantas asignadas");
  await page.evaluate((plantId) => {
    const userId = JSON.parse(sessionStorage.getItem("user-session")!).state.id;
    localStorage.setItem(`hallazgos:ultima-planta:${userId + 999999}`, plantId);
  }, String(plants[1].id));
  await page.reload();
  await openFilters(page);
  await expect(plantValue(page)).toHaveText("Planta");
  await page.evaluate(() => {
    const userId = JSON.parse(sessionStorage.getItem("user-session")!).state.id;
    localStorage.setItem(`hallazgos:ultima-planta:${userId}`, "999999999");
  });
  await page.reload();
  await openFilters(page);
  await expect(plantValue(page)).toHaveText("Planta");
});

for (const width of [375, 1440]) {
  test(`la planta se comparte entre modulos y sobrevive a recargas (${width}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors = trackPageErrors(page);
    await page.goto("/dashboard");
    const plants = await sessionPlants(page);
    test.skip(plants.length < 2, "Requiere dos plantas asignadas");
    await pickOption(page, "Planta", plants[1].name);

    for (const path of [
      "/epp",
      "/areas",
      "/hallazgos",
      "/dashboard",
      "/business-intelligence/epp",
    ]) {
      await page.goto(path);
      await openFilters(page);
      await expect(plantValue(page)).toContainText(plants[1].name);
      await page.reload();
      await openFilters(page);
      await expect(plantValue(page)).toContainText(plants[1].name);
    }

    await page.goto("/epp");
    await pickOption(page, "Planta", plants[0].name);
    await page.goto("/hallazgos/form");
    await expect(plantValue(page)).toContainText(plants[0].name);
    expect(errors).toEqual([]);
  });
}

test("un enlace y un registro en edicion conservan su planta explicita", async ({ page }) => {
  await page.goto("/dashboard");
  const plants = await sessionPlants(page);
  test.skip(plants.length < 2, "Requiere dos plantas asignadas");
  await pickOption(page, "Planta", plants[1].name);
  await page.goto(`/hallazgos?manufacturingPlantId=${plants[0].id}`);
  await openFilters(page);
  await expect(plantValue(page)).toContainText(plants[0].name);

  await mockGet(page, "/processes/9701", {
    id: 9701,
    name: "Proceso con planta propia",
    manufacturingPlant: plants[0],
  });
  await page.goto("/processes/form?id=9701");
  await expect(plantValue(page)).toContainText(plants[0].name);
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page).toHaveURL(/\/processes$/);
  await page.goto("/epp");
  await openFilters(page);
  await expect(plantValue(page)).toContainText(plants[1].name);
});

test("las asignaciones multiples conservan Todos/Ninguno y no cambian la planta de trabajo", async ({
  page,
}) => {
  await page.goto("/dashboard");
  const plants = await sessionPlants(page);
  test.skip(plants.length < 2, "Requiere dos plantas asignadas");
  await pickOption(page, "Planta", plants[0].name);
  await page.goto("/users/form");
  await pickOption(page, "Rol", "General");
  await pickMany(page, "Plantas");
  await page.getByRole("combobox", { name: "Plantas", exact: true }).click();
  await page.getByRole("option", { name: "Todos", exact: true }).click();
  await expect(page.getByRole("option", { name: "Ninguno", exact: true })).toBeVisible();
  await page.getByRole("option", { name: "Ninguno", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.goto("/epp");
  await openFilters(page);
  await expect(plantValue(page)).toContainText(plants[0].name);
});

test("sin almacenamiento local la planta se comparte mientras siga abierta la app", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
  });
  await page.goto("/dashboard");
  const plants = await sessionPlants(page);
  test.skip(plants.length < 2, "Requiere dos plantas asignadas");
  await pickOption(page, "Planta", plants[1].name);
  await page.getByRole("button", { name: "Ir a Hallazgos" }).click();
  await expect(page).toHaveURL(/\/hallazgos\?/);
  // Navegacion SPA: conserva la preferencia en memoria, sin localStorage.
  await page.getByRole("button", { name: "Crear", exact: true }).click();
  await expect(plantValue(page)).toContainText(plants[1].name);
});
