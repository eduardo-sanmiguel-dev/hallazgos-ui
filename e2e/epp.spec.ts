import type { Locator, Page } from "@playwright/test";

import { captureWrites, mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import {
  openFilters,
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
  // El diálogo entra deslizándose: si se dibuja antes de que termine, el
  // trazo cae fuera del lienzo (antes no se notaba porque se aceptaba la
  // firma vacía).
  await canvas.evaluate((element) =>
    Promise.all(
      (element.closest(".MuiDialog-root") ?? document)
        .getAnimations({ subtree: true })
        // Una animación cancelada (p. ej. el ripple) también terminó.
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
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
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cerrar" })
      .click();
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

    // El selector pide la versión ligera (id, código y nombre).
    const employeeRequest = page.waitForRequest(
      (request) =>
        new URL(request.url()).pathname.endsWith("/api/v1/employees") &&
        request.method() === "GET",
    );

    await page.goto("/epp");
    await page.getByRole("button", { name: "Crear registro" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Registro de EPP")).toBeVisible();
    const [plant] = await sessionPlants(page);
    await pickOption(page, "Planta", plant.name);
    await pickOption(page, "Colaborador", "501 - E2E Colaborador");
    const params = new URL((await employeeRequest).url()).searchParams;
    expect(params.get("view")).toBe("options");
    expect(params.get("manufacturingPlantId")).toBe(String(plant.id));

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
    const signature = page
      .getByRole("dialog")
      .filter({ hasText: "Firma electrónica" });
    const canvas = signature.locator("canvas");
    // El trazo lleva el nombre de acción que el RUM descarta (no es rage click).
    await expect(
      signature.locator('[data-dd-action-name="firma-trazo"] canvas'),
    ).toHaveCount(1);
    // Sin trazo no se puede guardar (antes se aceptaba una firma vacía).
    const saveSignature = signature.getByRole("button", { name: "Guardar" });
    const clearSignature = signature.getByRole("button", { name: "Limpiar" });
    await expect(saveSignature).toBeDisabled();
    await expect(clearSignature).toBeDisabled();
    await expect(
      signature.getByText("Firme dentro del recuadro para poder guardar."),
    ).toBeVisible();
    await sign(page, canvas);
    await expect(saveSignature).toBeEnabled();
    await clearSignature.click();
    await expect(saveSignature).toBeDisabled();
    await sign(page, canvas);
    await saveSignature.click();
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

  test("Agregar muestra el spinner mientras valida y se recupera si falla la red", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    await mockGet(page, "/equipments", EQUIPMENTS);
    await mockGet(page, "/employees", [
      { id: 9801, code: 501, name: "E2E Colaborador" },
    ]);

    // 1.ª validación: falla la red. 2.ª: se retiene hasta liberarla.
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    let calls = 0;
    await page.route(
      "**/api/v1/epps/validate-delivery-frequency**",
      async (route) => {
        calls++;
        if (calls === 1) return route.abort("failed");
        await held;
        await route.fulfill({
          json: { canDeliver: true, message: "El equipo puede ser entregado." },
        });
      },
    );

    await page.goto("/epp");
    await page.getByRole("button", { name: "Crear registro" }).click();
    const dialog = page.getByRole("dialog");
    const [plant] = await sessionPlants(page);
    await pickOption(page, "Planta", plant.name);
    await pickOption(page, "Colaborador", "501 - E2E Colaborador");
    await pickOption(page, "Equipo", "E2E Casco");
    const add = dialog.getByRole("button", { name: "Agregar" });
    const quitar = dialog.getByRole("button", { name: "Quitar E2E Casco" });

    // Falla la red: aviso de error, no se agrega y el botón vuelve a estar listo.
    await add.click();
    await expect(
      toast(page, /Se produjo un error al procesar su solicitud/),
    ).toBeVisible();
    await expect(quitar).toHaveCount(0);
    await expect(add).toBeEnabled();

    // Mientras valida queda bloqueado (sin clics repetidos).
    await add.click();
    await expect(add).toBeDisabled();
    release();
    await expect(quitar).toBeVisible();
    await expect(add).toBeEnabled();
    expect(calls).toBe(2);
    expect(errors).toEqual([]);
  });

  test("cerrar sin firmar no registra nada", async ({ page }) => {
    const writes = await captureWrites(page);
    await page.goto("/epp");
    await page.getByRole("button", { name: "Crear registro" }).click();
    const [plant] = await sessionPlants(page);
    await pickOption(page, "Planta", plant.name);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cerrar" })
      .click();
    await expect(page.getByText("Registro de EPP")).toHaveCount(0);
    expect(writes).toEqual([]);
  });
});

test.describe("EPP: lista de entregas", () => {
  const SIGNATURE =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  // La lista ya no trae el historial: se pide por colaborador al expandir.
  const employee = (id: number, name: string) => ({
    id,
    name,
    code: id,
    position: { name: "E2E Puesto" },
    area: { name: "E2E Área" },
  });

  const historyItem = (employeeId: number, createdById: number) => ({
    id: employeeId * 10,
    deliveryDate: new Date().toISOString(),
    observations: "Talla M",
    equipment: { id: 9701, name: "E2E Casco" },
    signature: SIGNATURE,
    createBy: { id: createdById, name: "E2E Entregó" },
  });

  const HISTORY = /\/api\/v1\/epps\/employees\/(\d+)\/history/;

  /**
   * Abre /epp con la lista simulada y devuelve el id de la sesión (solo quien
   * registró una entrega puede eliminarla) y las consultas de la lista.
   */
  const openList = async (page: Page) => {
    await page.goto("/epp");
    const [plant] = await sessionPlants(page);
    const userId: number = await page.evaluate(
      () => JSON.parse(sessionStorage.getItem("user-session")!).state.id,
    );
    const listRequests: URL[] = [];
    await page.route(
      (url) =>
        url.pathname.endsWith("/api/v1/epps") && url.searchParams.has("page"),
      (route) => {
        listRequests.push(new URL(route.request().url()));
        return route.fulfill({
          json: {
            data: [employee(9901, "E2E Ana"), employee(9902, "E2E Beto")],
            count: 2,
            page: 1,
            limit: 5,
          },
        });
      },
    );
    // La lista se consulta por planta.
    const filters = page.getByRole("region", { name: "Filtros" });
    await openFilters(page);
    if (await filters.getByRole("combobox", { name: "Planta" }).isVisible()) {
      await pickOption(page, "Planta", plant.name);
    }
    await expect(page.getByText("E2E Ana")).toBeVisible();
    return { plant, userId, listRequests };
  };

  test("ordena, despliega el historial, lo elimina y descarga (sin guardar)", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page);
    // Registrada antes de abrir la página: cualquier petición de historial
    // queda anotada. userId se conoce al cargar la sesión.
    let userId = 0;
    const historyRequests: URL[] = [];
    await page.route(HISTORY, (route) => {
      historyRequests.push(new URL(route.request().url()));
      return route.fulfill({ json: [historyItem(9901, userId)] });
    });
    const list = await openList(page);
    userId = list.userId;
    const { plant, listRequests } = list;

    // La lista pide la página sin historial y nada más se carga hasta expandir.
    expect(listRequests.at(-1)!.searchParams.get("withHistory")).toBe("false");
    expect(historyRequests).toEqual([]);

    // Orden de tres estados: asc, desc y sin orden.
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: "Empleado" }).click();
      await page.waitForLoadState("networkidle");
    }
    await page.getByRole("button", { name: "Cédula" }).click();

    await page
      .getByRole("button", { name: "Ver historial de E2E Ana" })
      .click();
    const history = page.getByRole("table", {
      name: "Historial de entrega de E2E Ana",
    });
    await expect(history.getByText("E2E Casco")).toBeVisible();
    expect(historyRequests.at(-1)!.pathname).toMatch(
      /\/epps\/employees\/9901\/history$/,
    );
    expect(
      historyRequests.at(-1)!.searchParams.get("manufacturingPlantId"),
    ).toBe(String(plant.id));
    await page
      .getByRole("button", { name: "Eliminar registro del historial" })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Eliminar" })
      .click();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toMatchObject({
      method: "DELETE",
      path: "/epps/history/99010",
    });
    await page
      .getByRole("button", { name: "Ocultar historial de E2E Ana" })
      .click();

    // Sin Content-Disposition: EPP_{código}_fecha.xlsx
    await page.route(/\/api\/v1\/epps\/download\/file\/\d+/, (route) =>
      route.fulfill({
        body: Buffer.from("PK e2e"),
        contentType: "application/octet-stream",
      }),
    );
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Descargar archivo de E2E Ana" })
      .click();
    expect((await download).suggestedFilename()).toMatch(
      /^EPP_9901_\d{4}-\d{2}-\d{2}_/,
    );
    expect(errors).toEqual([]);
  });

  test("muestra la carga del historial y se recupera si falla", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const { userId } = await openList(page);

    // Primera respuesta: se retiene para ver la carga y luego falla.
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    let calls = 0;
    await page.route(HISTORY, async (route) => {
      calls++;
      if (calls === 1) {
        await held;
        return route.fulfill({ status: 500, json: { message: "Caída" } });
      }
      return route.fulfill({ json: [historyItem(9902, userId)] });
    });

    await page
      .getByRole("button", { name: "Ver historial de E2E Beto" })
      .click();
    await expect(page.getByRole("status")).toContainText("Cargando historial…");
    await expect(
      page.getByRole("table", { name: "Historial de entrega de E2E Beto" }),
    ).toHaveAttribute("aria-busy", "true");

    release();
    const alert = page
      .locator(".MuiAlert-root")
      .filter({ hasText: "No se pudo cargar el historial." });
    await expect(alert).toBeVisible();

    await alert.getByRole("button", { name: "Reintentar" }).click();
    await expect(alert).toHaveCount(0);
    await expect(
      page
        .getByRole("table", { name: "Historial de entrega de E2E Beto" })
        .getByText("E2E Casco"),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("si al eliminar ya no quedan entregas, avisa y recarga la lista", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    const { userId, listRequests } = await openList(page);
    await page.route(HISTORY, (route) =>
      route.request().method() === "GET"
        ? route.fulfill({
            json: writes.length ? [] : [historyItem(9901, userId)],
          })
        : route.fallback(),
    );

    await page
      .getByRole("button", { name: "Ver historial de E2E Ana" })
      .click();
    const loadedLists = listRequests.length;
    await page
      .getByRole("button", { name: "Eliminar registro del historial" })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Eliminar" })
      .click();

    await expect(
      page.getByText("Sin entregas registradas en esta planta."),
    ).toBeVisible();
    await expect.poll(() => listRequests.length).toBeGreaterThan(loadedLists);
  });
});
