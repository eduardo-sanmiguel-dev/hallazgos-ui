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
    await expect(page).toHaveURL(/\/equipments\/form$/);
    // Ahora es su propia ruta: los campos van en la página (antes, diálogo).
    const form = page.getByRole("main");

    const save = form.getByRole("button", { name: "Guardar" });
    const plants = await sessionPlants(page);
    // "Guardar" marca a la vez lo que falta: nombre y, con varias plantas,
    // la planta (con una sola se elige sola).
    await save.click();
    await expect(
      toast(
        page,
        plants.length > 1
          ? "Completa los 2 campos marcados."
          : "Escribe el nombre.",
      ),
    ).toBeVisible();
    await expect(form.getByText("Escribe el nombre.")).toBeVisible();
    await form.getByLabel("Nombre").fill("  E2E Lentes  ");
    if (plants.length > 1) await pickOption(page, "Planta", plants[0].name);

    // Teclado numérico (B1); solo números positivos y el precio se redondea
    // a centavos.
    const frequency = form.getByLabel("Frecuencia de entrega (días)");
    await expect(frequency).toHaveAttribute("inputmode", "numeric");
    await expect(form.getByLabel("Precio")).toHaveAttribute(
      "inputmode",
      "decimal",
    );
    await frequency.pressSequentially("e-.0");
    await expect(frequency).toHaveValue("");
    await frequency.fill("15");
    const price = form.getByLabel("Precio");
    await price.pressSequentially("e-");
    await price.fill("12.345");
    await expect(price).toHaveValue("12.35");

    await save.click();
    await expect(toast(page, "Equipo creado correctamente")).toBeVisible();
    await expect(page).toHaveURL(/\/equipments$/);
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
    await expect(page).toHaveURL(/\/equipments\/form\?id=\d+$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Editar equipo" }),
    ).toBeVisible();
    await expect(page.getByLabel("Nombre")).toHaveValue(/\S/);

    // Sin cambios, Cancelar regresa a la lista sin preguntar.
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page).toHaveURL(/\/equipments$/);
    expect(writes).toEqual([]);

    await page.getByRole("button", { name: "Editar" }).first().click();
    await expect(page.getByLabel("Nombre")).toHaveValue(/\S/);
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(toast(page, "Equipo actualizado correctamente")).toBeVisible();
    await expect(page).toHaveURL(/\/equipments$/);
    expect(writes[0]).toMatchObject({
      method: "PATCH",
      path: expect.stringMatching(/^\/equipments\/\d+$/),
    });
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
      .filter({ hasText: "Firma del colaborador" });
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
      signature.getByText("Firma dentro del recuadro para poder guardar."),
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

    // Falla la red: aviso "Sin conexión" (antes, el mensaje genérico), no se
    // agrega y el botón vuelve a estar listo.
    await add.click();
    await expect(toast(page, "Sin conexión")).toBeVisible();
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

  test("registro en secciones: indica el paso que falta y qué falta para guardar", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    await mockGet(page, "/equipments", EQUIPMENTS);
    await mockGet(page, "/employees", [
      { id: 9801, code: 501, name: "E2E Colaborador" },
    ]);
    await mockGet(page, "/epps/validate-delivery-frequency", {
      canDeliver: false,
      message: "E2E fuera de frecuencia",
    });

    await page.goto("/epp");
    await page.getByRole("button", { name: "Crear registro" }).click();
    const dialog = page.getByRole("dialog");
    const equipmentsSection = dialog.getByRole("region", {
      name: "Equipos a entregar",
    });
    const signatureSection = dialog.getByRole("region", { name: "Firma" });
    const save = dialog.getByRole("button", { name: "Guardar", exact: true });

    // Las tres secciones a la vista; las que dependen del colaborador lo dicen.
    await expect(
      dialog.getByRole("region", { name: "Colaborador" }),
    ).toBeVisible();
    await expect(
      equipmentsSection.getByText("Elige primero al colaborador."),
    ).toBeVisible();
    await expect(
      signatureSection.getByText("Elige primero al colaborador."),
    ).toBeVisible();
    await expect(save).toBeDisabled();

    const [plant] = await sessionPlants(page);
    await pickOption(page, "Planta", plant.name);
    await expect(
      dialog.getByText("Falta: colaborador, equipos y firma"),
    ).toBeVisible();
    await pickOption(page, "Colaborador", "501 - E2E Colaborador");
    await expect(dialog.getByText("Falta: equipos y firma")).toBeVisible();
    // Vacío: ya no se marca en rojo (volvía a rojo tras cada "Agregar").
    await expect(
      dialog.getByRole("combobox", { name: "Equipo" }),
    ).not.toHaveAttribute("aria-invalid", "true");

    await pickOption(page, "Equipo", "E2E Casco");
    await dialog.getByRole("button", { name: "Agregar" }).click();
    // También en escritorio, lista (antes, tabla) con el aviso en el equipo.
    const items = dialog.getByRole("list", { name: "Equipos a entregar" });
    await expect(
      items.getByRole("listitem").filter({ hasText: "E2E Casco" }),
    ).toContainText("Fuera de la frecuencia de entrega");
    await expect(dialog.getByRole("table")).toHaveCount(0);
    await expect(equipmentsSection.getByText("1 equipo")).toBeVisible();
    await expect(dialog.getByText("Falta: firma")).toBeVisible();

    await signatureSection.getByRole("button", { name: "Firmar" }).click();
    const signature = page
      .getByRole("dialog")
      .filter({ hasText: "Firma del colaborador" });
    await sign(page, signature.locator("canvas"));
    await signature.getByRole("button", { name: "Guardar" }).click();
    await expect(signatureSection.getByText("Firmado")).toBeVisible();
    // Como en papel: la firma sobre el nombre de quien recibe.
    await expect(
      signatureSection.getByText("501 - E2E Colaborador"),
    ).toBeVisible();
    await expect(
      signatureSection.getByText("Firma de recibido", { exact: true }),
    ).toBeVisible();
    await expect(dialog.getByText(/^Falta:/)).toHaveCount(0);
    await expect(save).toBeEnabled();

    // Se puede repetir la firma.
    await signatureSection
      .getByRole("button", { name: "Volver a firmar" })
      .click();
    await expect(signature.locator("canvas")).toBeVisible();
    await signature.getByRole("button", { name: "Cerrar sin firmar" }).click();

    // "Cancelar" al pie descarta sin registrar.
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByText("Registro de EPP")).toHaveCount(0);
    expect(writes).toEqual([]);
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
  test("con varias plantas y ninguna elegida, pide elegirla (no dice 'sin registros')", async ({
    page,
  }) => {
    await page.goto("/epp");
    const plants = await sessionPlants(page);
    test.skip(plants.length < 2, "El usuario de e2e necesita dos plantas.");
    await expect(page.getByText("Elige una planta")).toBeVisible();
    await expect(page.getByText("Sin entregas de EPP")).toHaveCount(0);

    await pickOption(page, "Planta", plants[0].name);
    await expect(page.getByText("Elige una planta")).toHaveCount(0);
  });

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

  test.describe("en celular", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("muestra tarjetas con el historial desplegable, sin desplazarse de lado", async ({
      page,
    }) => {
      const errors = trackPageErrors(page);
      let userId = 0;
      await page.route(HISTORY, (route) =>
        route.fulfill({ json: [historyItem(9901, userId)] }),
      );
      ({ userId } = await openList(page));

      await expect(page.getByRole("table")).toHaveCount(0);
      const list = page.getByRole("list", {
        name: "Entregas de EPP por colaborador",
      });
      const card = list.getByRole("listitem").filter({ hasText: "E2E Ana" });
      await expect(card).toContainText("Cédula 9901");
      await expect(card).toContainText("E2E Puesto");
      await expect(
        card.getByRole("button", { name: "Descargar archivo de E2E Ana" }),
      ).toBeVisible();

      await card.getByRole("button", { name: "Ver historial" }).click();
      const history = card.getByRole("list", {
        name: "Historial de entrega de E2E Ana",
      });
      await expect(history).toContainText("E2E Casco");
      await expect(history).toContainText("Talla M");
      await expect(history.getByAltText("Firma digital")).toBeVisible();
      await expect(
        history.getByRole("button", {
          name: "Eliminar registro del historial",
        }),
      ).toBeVisible();

      // Nada se sale del ancho de la pantalla.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });

    test("sin entregas o con error usa los estados compartidos", async ({
      page,
    }) => {
      let fail = false;
      await page.route(
        (url) =>
          url.pathname.endsWith("/api/v1/epps") && url.searchParams.has("page"),
        (route) =>
          fail
            ? route.fulfill({ status: 500, json: { message: "Caída" } })
            : route.fulfill({
                json: { data: [], count: 0, page: 1, limit: 5 },
              }),
      );
      await page.goto("/epp");
      const [plant] = await sessionPlants(page);
      const filters = page.getByRole("region", { name: "Filtros" });
      await openFilters(page);
      if (await filters.getByRole("combobox", { name: "Planta" }).isVisible()) {
        await pickOption(page, "Planta", plant.name);
      }

      await expect(page.getByText("Sin entregas de EPP")).toBeVisible();
      await expect(
        page.getByText("No hay registros de EPP para esta planta."),
      ).toBeVisible();

      fail = true;
      await page.getByRole("button", { name: "Actualizar" }).click();
      const alert = page
        .getByRole("alert")
        .filter({ hasText: "No se pudo cargar" });
      await expect(alert).toBeVisible();
      fail = false;
      await alert.getByRole("button", { name: "Reintentar" }).click();
      await expect(page.getByText("Sin entregas de EPP")).toBeVisible();
    });
  });
});

// Firma en celular (A4): el lienzo ocupa el ancho y, en horizontal, el alto.
test.describe("EPP: firma en celular", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  const openSignature = async (page: Page) => {
    await mockGet(page, "/equipments", EQUIPMENTS);
    await mockGet(page, "/employees", [
      { id: 9801, code: 501, name: "E2E Colaborador" },
    ]);
    await page.goto("/epp");
    await page.getByRole("button", { name: "Crear registro" }).click();
    const dialog = page.getByRole("dialog");
    const [plant] = await sessionPlants(page);
    await pickOption(page, "Planta", plant.name);
    await pickOption(page, "Colaborador", "501 - E2E Colaborador");
    await pickOption(page, "Equipo", "E2E Guantes");
    await dialog.getByRole("button", { name: "Agregar" }).click();
    await dialog.getByRole("button", { name: "Firmar" }).click();
    const signature = page
      .getByRole("dialog")
      .filter({ hasText: "Firma del colaborador" });
    return { dialog, signature, canvas: signature.locator("canvas") };
  };

  /** Medidas, esquina y peso de la firma guardada (data URL del <img>). */
  const savedSignature = (preview: Locator) =>
    preview.evaluate(async (img: HTMLImageElement) => {
      const image = new Image();
      image.src = img.currentSrc || img.src;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data;
      // Primera fila y columna con trazo: el margen que se dejó alrededor.
      let top = canvas.height;
      let left = canvas.width;
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          if (pixels[(y * canvas.width + x) * 4 + 3] > 0) {
            top = Math.min(top, y);
            left = Math.min(left, x);
          }
        }
      }
      return {
        width: image.naturalWidth,
        height: image.naturalHeight,
        corner: Array.from(context.getImageData(0, 0, 1, 1).data),
        top,
        left,
        background: getComputedStyle(img).backgroundColor,
        bytes: (img.currentSrc || img.src).length,
      };
    });

  test("en vertical el lienzo ocupa el ancho en proporción 2.5:1 e invita a girar; la firma se guarda recortada y transparente, y se muestra sobre blanco", async ({
    page,
  }) => {
    const { dialog, signature, canvas } = await openSignature(page);

    await expect(
      signature.getByText("Gira el teléfono para firmar con más espacio."),
    ).toBeVisible();
    const portrait = (await canvas.boundingBox())!;
    // Antes 300 × 200 px; ahora casi todo el ancho de 390 px.
    expect(portrait.width).toBeGreaterThan(350);
    // Alargado, como una línea de firma (antes casi cuadrado): ~2.5:1.
    const ratio = portrait.width / portrait.height;
    expect(ratio).toBeGreaterThan(2.3);
    expect(ratio).toBeLessThan(2.7);

    await sign(page, canvas);
    await signature.getByRole("button", { name: "Guardar" }).click();
    const preview = dialog.getByAltText("Firma del colaborador");
    await expect(preview).toBeVisible();

    const saved = await savedSignature(preview);
    // Transparente: en el Excel no tapa los bordes de la celda.
    expect(saved.corner).toEqual([0, 0, 0, 0]);
    // Recortada al trazo (el trazo mide ~220 × 50 px) con margen de 8 px.
    expect(saved.width).toBeLessThanOrEqual(600);
    expect(saved.height).toBeLessThanOrEqual(200);
    expect(saved.width).toBeLessThan(portrait.width);
    expect(saved.top).toBeGreaterThanOrEqual(6);
    expect(saved.left).toBeGreaterThanOrEqual(6);
    // En pantalla, sobre blanco (se lee también en el tema oscuro).
    expect(saved.background).toBe("rgb(255, 255, 255)");
  });

  test.describe("celular de alta densidad", () => {
    test.use({
      viewport: { width: 844, height: 390 },
      deviceScaleFactor: 3,
    });

    /** Firma trazo por trazo en proporciones del lienzo (0–1). */
    const drawStrokes = async (
      page: Page,
      canvas: Locator,
      strokes: number[][][],
    ) => {
      await canvas.evaluate((element) =>
        Promise.all(
          (element.closest(".MuiDialog-root") ?? document)
            .getAnimations({ subtree: true })
            .map((animation) => animation.finished.catch(() => undefined)),
        ),
      );
      const box = (await canvas.boundingBox())!;
      for (const stroke of strokes) {
        const [first, ...rest] = stroke;
        await page.mouse.move(
          box.x + first[0] * box.width,
          box.y + first[1] * box.height,
        );
        await page.mouse.down();
        for (const [x, y] of rest) {
          await page.mouse.move(box.x + x * box.width, box.y + y * box.height, {
            steps: 10,
          });
        }
        await page.mouse.up();
      }
    };

    const signAndMeasure = async (page: Page, strokes: number[][][]) => {
      const { dialog, signature, canvas } = await openSignature(page);
      await drawStrokes(page, canvas, strokes);
      await signature.getByRole("button", { name: "Guardar" }).click();
      return savedSignature(dialog.getByAltText("Firma del colaborador"));
    };

    test("una firma horizontal normal pesa menos de 30 KB (antes ~100 KB, el límite del API)", async ({
      page,
    }) => {
      const saved = await signAndMeasure(page, [
        [
          [0.1, 0.6],
          [0.2, 0.3],
          [0.28, 0.7],
          [0.36, 0.35],
          [0.45, 0.65],
        ],
        [
          [0.5, 0.5],
          [0.6, 0.3],
          [0.7, 0.6],
          [0.8, 0.35],
          [0.9, 0.55],
        ],
        [
          [0.15, 0.8],
          [0.85, 0.78],
        ],
      ]);
      expect(saved.width).toBeLessThanOrEqual(600);
      expect(saved.height).toBeLessThanOrEqual(200);
      expect(saved.bytes).toBeLessThan(30_000);
    });

    test("aun un garabato que llena el recuadro queda con margen bajo el límite", async ({
      page,
    }) => {
      const zigzag = (y: number) =>
        Array.from({ length: 13 }, (_, step) => [
          0.03 + (step * 0.94) / 12,
          y + (step % 2 ? 0.08 : -0.03),
        ]);
      const saved = await signAndMeasure(
        page,
        [0.12, 0.27, 0.42, 0.57, 0.72, 0.87].map(zigzag),
      );
      expect(saved.bytes).toBeLessThan(80_000);
    });
  });

  test("en horizontal el lienzo usa casi toda la pantalla y al girar pide firmar de nuevo", async ({
    page,
  }) => {
    const { signature, canvas } = await openSignature(page);
    await sign(page, canvas);
    const save = signature.getByRole("button", { name: "Guardar" });
    await expect(save).toBeEnabled();

    await page.setViewportSize({ width: 844, height: 390 });
    await expect(
      signature.getByText("Gira el teléfono para firmar con más espacio."),
    ).toHaveCount(0);
    // Al cambiar de tamaño el lienzo se limpia: no se guarda una firma
    // cortada o deformada.
    await expect(save).toBeDisabled();
    const landscape = (await canvas.boundingBox())!;
    expect(landscape.width).toBeGreaterThan(800);
    expect(landscape.height).toBeGreaterThan(220);

    await sign(page, canvas);
    await expect(save).toBeEnabled();
  });

  test("los equipos agregados se ven en lista, sin tabla ancha", async ({
    page,
  }) => {
    const { dialog } = await openSignature(page);
    await page
      .getByRole("dialog")
      .filter({ hasText: "Firma del colaborador" })
      .getByRole("button", { name: "Cerrar sin firmar" })
      .click();

    const items = dialog.getByRole("list", { name: "Equipos a entregar" });
    await expect(items).toContainText("E2E Guantes");
    await expect(
      items.getByRole("button", { name: "Quitar E2E Guantes" }),
    ).toBeVisible();
    await expect(dialog.getByRole("table")).toHaveCount(0);
  });

  test("el aviso de frecuencia se lee completo y la barra deja ver qué falta", async ({
    page,
  }) => {
    await mockGet(page, "/epps/validate-delivery-frequency", {
      canDeliver: false,
      message: "E2E fuera de frecuencia",
    });
    const { dialog } = await openSignature(page);
    await page
      .getByRole("dialog")
      .filter({ hasText: "Firma del colaborador" })
      .getByRole("button", { name: "Cerrar sin firmar" })
      .click();

    // Se agrega uno con frecuencia (E2E Casco) para ver el aviso.
    await pickOption(page, "Equipo", "E2E Casco");
    await dialog.getByRole("button", { name: "Agregar" }).click();
    const chip = dialog
      .getByRole("listitem")
      .filter({ hasText: "E2E Casco" })
      .locator(".MuiChip-label");
    await expect(chip).toHaveText("Fuera de la frecuencia de entrega");
    // Sin recortar con "…".
    expect(await chip.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    await expect(dialog.getByText("Falta: firma")).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Guardar", exact: true }),
    ).toBeInViewport();
  });
});

// El 201 de la API debe cerrar el diálogo antes de borrar su contenido.
// Limpiarlo durante Slide desmonta la firma y los equipos con el modal vivo.
test("EPP: conserva el contenido hasta terminar el cierre tras un 201", async ({
  page,
}) => {
  const errors = trackPageErrors(page);
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  const writes = await captureWrites(page);
  let failSave = true;
  let attempts = 0;
  let releaseSave: () => void = () => {};
  const held = new Promise<void>((resolve) => (releaseSave = resolve));
  await page.route("**/api/v1/epps", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    attempts++;
    if (failSave) {
      return route.fulfill({
        status: 500,
        json: { message: "Fallo de prueba" },
      });
    }
    await held;
    return route.fallback();
  });
  await mockGet(page, "/equipments", EQUIPMENTS);
  await mockGet(page, "/employees", [
    { id: 9801, code: 501, name: "E2E Colaborador" },
  ]);
  await page.goto("/epp");
  await page.getByRole("button", { name: "Crear registro" }).click();
  const dialog = page.getByRole("dialog");
  const [plant] = await sessionPlants(page);
  await pickOption(page, "Planta", plant.name);
  await pickOption(page, "Colaborador", "501 - E2E Colaborador");
  await pickOption(page, "Equipo", "E2E Guantes");
  await dialog.getByRole("button", { name: "Agregar" }).click();
  await dialog.getByRole("button", { name: "Firmar", exact: true }).click();
  const signature = page
    .getByRole("dialog")
    .filter({ hasText: "Firma del colaborador" });
  await sign(page, signature.locator("canvas"));
  await signature.getByRole("button", { name: "Guardar", exact: true }).click();
  const preview = dialog.getByAltText("Firma del colaborador");
  await expect(preview).toBeVisible();

  const save = dialog.getByRole("button", { name: "Guardar", exact: true });
  await save.click();
  await expect.poll(() => attempts).toBe(1);
  await expect(save).toBeEnabled();
  await expect(preview).toBeVisible();
  await expect(
    dialog.getByRole("list", { name: "Equipos a entregar" }),
  ).toContainText("E2E Guantes");
  await expect(
    dialog.locator(".MuiAutocomplete-root", {
      has: page.getByRole("combobox", { name: "Colaborador", exact: true }),
    }),
  ).toContainText("501 - E2E Colaborador");
  expect(writes).toHaveLength(0);
  failSave = false;

  await dialog.evaluate((element) => {
    const image = element.querySelector('img[alt="Firma del colaborador"]')!;
    const state = window as unknown as { eppClearedBeforeExit: boolean };
    state.eppClearedBeforeExit = false;
    const observer = new MutationObserver(() => {
      if (element.isConnected && !element.contains(image)) {
        state.eppClearedBeforeExit = true;
      }
      if (!element.isConnected || !element.contains(image))
        observer.disconnect();
    });
    observer.observe(element, { childList: true, subtree: true });
  });
  // Dos clics en el mismo turno solo pueden iniciar un envío.
  await save.evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expect.poll(() => attempts).toBe(2);
  await expect(save).toBeDisabled();
  await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(preview).toBeVisible();
  releaseSave();
  await expect(dialog).toHaveCount(0);
  expect(writes).toHaveLength(1);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { eppClearedBeforeExit: boolean })
          .eppClearedBeforeExit,
    ),
  ).toBe(false);

  // Otra entrega empieza vacía, después de terminar el cierre anterior.
  await page.getByRole("button", { name: "Crear registro" }).click();
  await expect(dialog.getByAltText("Firma del colaborador")).toHaveCount(0);
  await expect(
    dialog.getByRole("list", { name: "Equipos a entregar" }),
  ).toHaveCount(0);
  await expect(
    dialog.getByRole("button", { name: "Guardar", exact: true }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
  expect(
    consoleErrors.filter((message) =>
      /NotFoundError|removeChild/.test(message),
    ),
  ).toEqual([]);
});
