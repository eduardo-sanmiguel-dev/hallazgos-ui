import type { Locator, Page } from "@playwright/test";

import { captureWrites, mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import {
  pickOption,
  sessionPlants,
  toast,
  trackPageErrors,
} from "./support/ui";

// EPP: catálogo de equipos y registro de entregas con firma. Las escrituras
// se interceptan (captureWrites).

const EQUIPMENTS = [
  {
    id: 9701,
    name: "E2E Casco",
    deliveryFrequency: 30,
    manufacturingPlant: { id: 1, name: "Planta" },
    costHistory: [{ price: 150 }],
  },
  {
    id: 9702,
    name: "E2E Guantes",
    deliveryFrequency: null,
    manufacturingPlant: { id: 1, name: "Planta" },
    costHistory: [],
  },
];

/** Dibuja un trazo sobre el canvas de firma. */
const sign = async (page: Page, canvas: Locator) => {
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 40, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + 160, box.y + 90, { steps: 8 });
  await page.mouse.move(box.x + 260, box.y + 50, { steps: 8 });
  await page.mouse.up();
};

test.describe("EPP: equipos", () => {
  test("valida y crea un equipo (sin guardar)", async ({ page }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);
    await page.goto("/equipments");
    await page.getByRole("button", { name: "Crear", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Nuevo equipo" });

    const save = dialog.getByRole("button", { name: "Guardar" });
    await save.click();
    await expect(toast(page, "El nombre es requerido")).toBeVisible();
    await dialog.getByLabel("Nombre").fill("  E2E Lentes  ");

    const plants = await sessionPlants(page);
    if (plants.length > 1) {
      await save.click();
      await expect(
        toast(page, "Debe seleccionar una planta de manufactura."),
      ).toBeVisible();
      await pickOption(page, "Planta", plants[0].name);
    }

    // Solo números positivos; el precio se redondea a centavos.
    const frequency = dialog.getByLabel("Frecuencia de entrega (dias)");
    await frequency.pressSequentially("e-.0");
    await expect(frequency).toHaveValue("");
    await frequency.fill("15");
    const price = dialog.getByLabel("Precio");
    await price.pressSequentially("e-");
    await price.fill("12.345");
    await expect(price).toHaveValue("12.35");

    await save.click();
    await expect(toast(page, "Equipo creado correctamente")).toBeVisible();
    expect(writes).toEqual([
      {
        method: "POST",
        path: "/equipments",
        body: {
          name: "E2E Lentes",
          deliveryFrequency: 15,
          manufacturingPlantId: plants[0].id,
          price: 12.35,
        },
      },
    ]);
    expect(errors).toEqual([]);
  });

  test("edita un equipo y cancela sin guardar", async ({ page }) => {
    const writes = await captureWrites(page);
    await page.goto("/equipments");
    await page.getByRole("button", { name: "Editar" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Editar equipo" });
    await expect(dialog.getByLabel("Nombre")).toHaveValue(/\S/);

    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toHaveCount(0);
    expect(writes).toEqual([]);

    await page.getByRole("button", { name: "Editar" }).first().click();
    await expect(dialog.getByLabel("Nombre")).toHaveValue(/\S/);
    await dialog.getByRole("button", { name: "Guardar" }).click();
    await expect(toast(page, "Equipo actualizado correctamente")).toBeVisible();
    expect(writes[0]).toMatchObject({
      method: "PATCH",
      path: expect.stringMatching(/^\/equipments\/\d+$/),
    });

    await page.getByRole("button", { name: "Crear", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Cerrar" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test.describe("EPP: entregas", () => {
  test("registra una entrega con firma (sin guardar)", async ({ page }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);
    await mockGet(page, "/equipments", EQUIPMENTS);
    await mockGet(page, "/employees", [
      { id: 9801, code: 501, name: "E2E Colaborador" },
    ]);
    await mockGet(page, "/epps/validate-delivery-frequency", {
      canDeliver: false,
      message: "E2E ya se entregó en los últimos 30 días",
    });

    await page.goto("/epp");
    await page.getByRole("button", { name: "Crear registro" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Registro de EPP")).toBeVisible();
    const [plant] = await sessionPlants(page);
    await pickOption(page, "Planta", plant.name);
    await pickOption(page, "Colaborador", "501 - E2E Colaborador");

    // Sin equipo elegido, Agregar no hace nada.
    const add = dialog.getByRole("button", { name: "Agregar" });
    await add.click();

    // Con frecuencia de entrega se valida y se marca si no procede.
    await pickOption(page, "Equipo", "E2E Casco");
    await dialog.getByLabel("Observaciones").fill("  Talla M  ");
    await add.click();
    await expect(
      toast(page, "E2E ya se entregó en los últimos 30 días"),
    ).toBeVisible();
    await pickOption(page, "Equipo", "E2E Guantes");
    await add.click();
    await dialog.getByRole("button", { name: "Quitar E2E Guantes" }).click();
    await pickOption(page, "Equipo", "E2E Guantes");
    await add.click();

    const save = dialog.getByRole("button", { name: "Guardar", exact: true });
    await expect(save).toBeDisabled();

    await dialog.getByRole("button", { name: "Firmar" }).click();
    const signature = page.getByRole("dialog").filter({ hasText: "Firma electrónica" });
    const canvas = signature.locator("canvas");
    await sign(page, canvas);
    await signature.getByRole("button", { name: "Limpiar" }).click();
    await sign(page, canvas);
    await signature.getByRole("button", { name: "Guardar" }).click();
    await expect(dialog.getByAltText("Firma del colaborador")).toBeVisible();

    await save.click();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toMatchObject({
      method: "POST",
      path: "/epps",
      body: {
        employeeId: 9801,
        equipments: [
          { id: 9701, quantity: 1, observations: "Talla M" },
          { id: 9702, quantity: 1, observations: "" },
        ],
        signature: expect.stringMatching(/^data:image\/png;base64,/),
      },
    });
    expect(errors).toEqual([]);
  });

  test("cerrar sin firmar no registra nada", async ({ page }) => {
    const writes = await captureWrites(page);
    await page.goto("/epp");
    await page.getByRole("button", { name: "Crear registro" }).click();
    const [plant] = await sessionPlants(page);
    await pickOption(page, "Planta", plant.name);
    await page.getByRole("dialog").getByRole("button", { name: "Cerrar" }).click();
    await expect(page.getByText("Registro de EPP")).toHaveCount(0);
    expect(writes).toEqual([]);
  });
});

test.describe("EPP: lista de entregas", () => {
  const SIGNATURE =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  const employee = (id: number, name: string, createdById: number) => ({
    id,
    name,
    code: id,
    position: { name: "E2E Puesto" },
    area: { name: "E2E Área" },
    epps: [
      {
        signature: SIGNATURE,
        createBy: { id: createdById, name: "E2E Entregó" },
        equipments: [
          {
            id: id * 10,
            deliveryDate: new Date().toISOString(),
            observations: "Talla M",
            equipment: { name: "E2E Casco" },
          },
        ],
      },
    ],
  });

  test("ordena, despliega el historial, lo elimina y descarga (sin guardar)", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);
    await page.goto("/epp");
    // Solo quien registró la entrega puede eliminarla: se usa el id de la
    // sesión (ya cargada al responder la lista).
    const [plant] = await sessionPlants(page);
    const userId = await page.evaluate(
      () => JSON.parse(sessionStorage.getItem("user-session")!).state.id,
    );
    await page.route(
      (url) => url.pathname.endsWith("/api/v1/epps") && url.searchParams.has("page"),
      (route) =>
        route.fulfill({
          json: {
            data: [employee(9901, "E2E Ana", userId), employee(9902, "E2E Beto", 0)],
            count: 2,
            page: 1,
            limit: 5,
          },
        }),
    );
    // La lista se consulta por planta.
    const filters = page.getByRole("region", { name: "Filtros" });
    if (await filters.getByRole("combobox", { name: "Planta" }).isVisible()) {
      await pickOption(page, "Planta", plant.name);
    }
    await expect(page.getByText("E2E Ana")).toBeVisible();

    // Orden de tres estados: asc, desc y sin orden.
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: "Empleado" }).click();
      await page.waitForLoadState("networkidle");
    }
    await page.getByRole("button", { name: "Cédula" }).click();

    await page.getByRole("button", { name: "Ver historial de E2E Ana" }).click();
    await expect(page.getByRole("table", { name: "Historial de entrega de E2E Ana" })).toBeVisible();
    await page.getByRole("button", { name: "Eliminar registro del historial" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Eliminar" }).click();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toMatchObject({ method: "DELETE", path: "/epps/history/99010" });
    await page.getByRole("button", { name: "Ocultar historial de E2E Ana" }).click();

    // Sin Content-Disposition: EPP_{código}_fecha.xlsx
    await page.route(/\/api\/v1\/epps\/download\/file\/\d+/, (route) =>
      route.fulfill({ body: Buffer.from("PK e2e"), contentType: "application/octet-stream" }),
    );
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Descargar archivo de E2E Ana" }).click();
    expect((await download).suggestedFilename()).toMatch(/^EPP_9901_\d{4}-\d{2}-\d{2}_/);
    expect(errors).toEqual([]);
  });
});
