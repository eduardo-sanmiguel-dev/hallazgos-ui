import type { Page } from "@playwright/test";

import { captureWrites } from "./support/api";
import { expect, test } from "./support/fixtures";

import {
  pickOption,
  recordCount,
  sessionPlants,
  toast,
  trackPageErrors,
} from "./support/ui";

/** Descripción del hallazgo (campo con contorno, con su etiqueta). */
const descriptionField = (page: Page) =>
  page.getByRole("textbox", { name: "Describe lo que observaste" });

// PNG de 1x1 para la evidencia.
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("Hallazgos", () => {
  test("lista los hallazgos y filtra por planta", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/hallazgos");

    await expect
      .poll(() => recordCount(page), { timeout: 30_000 })
      .toBeGreaterThan(0);
    const total = await recordCount(page);

    await pickOption(page, "Planta");
    await expect
      .poll(() => recordCount(page), { timeout: 30_000 })
      .toBeLessThanOrEqual(total);
    await expect(page.getByText("Limpiar filtros")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("crea un hallazgo con evidencia (sin guardar en la base)", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);

    // El alta se intercepta: se valida lo que el UI envía y se responde
    // como el API, sin crear registros.
    const sent: { contentType: string; body: string }[] = [];
    await page.route("**/api/v1/evidences", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      sent.push({
        contentType: route.request().headers()["content-type"] ?? "",
        body: route.request().postDataBuffer()?.toString("latin1") ?? "",
      });
      await route.fulfill({ status: 201, json: { id: 999999 } });
    });

    await page.goto("/hallazgos/form");
    // Al cargar la sesión el formulario reinicia la planta: se espera antes.
    await sessionPlants(page);

    const create = page.getByRole("button", { name: "Crear hallazgo" });
    // Sin errores en rojo al abrir (A5): aparecen al intentar guardar.
    await expect(page.locator(".Mui-error")).toHaveCount(0);

    await pickOption(page, "Planta");
    // Clasificación conocida que exige foto y tiene tipos (la primera de la
    // lista puede ser una recién creada sin tipos).
    await pickOption(page, "Hallazgo", /^Condición insegura$/);
    await pickOption(page, "Tipo");
    await pickOption(page, "Lugar");
    await pickOption(page, "Proceso");
    await pickOption(page, "Supervisor");
    await descriptionField(page).fill("Hallazgo de prueba e2e (no se guarda)");

    // Sin evidencia: al guardar se marca la foto y no se envía nada.
    await create.click();
    await expect(page.locator('[data-error-for="photo"]')).toBeVisible();
    expect(sent).toEqual([]);

    await page.locator('input[type="file"]').first().setInputFiles({
      name: "evidencia.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    });
    await expect(page.locator('[data-error-for="photo"]')).toHaveCount(0);
    await create.click();

    await expect(page).toHaveURL(/\/hallazgos$/);
    await expect(toast(page, "Hallazgo creado correctamente")).toBeVisible();

    expect(sent).toHaveLength(1);
    const [{ contentType, body }] = sent;
    expect(contentType).toContain("multipart/form-data");
    for (const field of [
      "manufacturingPlantId",
      "typeHallazgo",
      "type",
      "zone",
      "process",
      "description",
      "supervisor",
      "file",
    ]) {
      expect(body).toContain(`name="${field}"`);
    }
    expect(body).toContain("Hallazgo de prueba e2e (no se guarda)");
    expect(body).toMatch(/filename="[0-9a-f-]{36}-evidence\.png"/);

    expect(errors).toEqual([]);
  });

  test("un comportamiento inseguro con prioridad no exige imagen (sin guardar)", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    await page.goto("/hallazgos/form");
    // Al cargar la sesión el formulario reinicia la planta: se espera antes.
    await sessionPlants(page);
    const create = page.getByRole("button", { name: "Crear hallazgo" });

    await pickOption(page, "Planta");
    await pickOption(page, "Hallazgo", /[Cc]omportamiento inseguro/);
    await pickOption(page, "Tipo");
    await pickOption(page, "Lugar");
    await pickOption(page, "Proceso");
    await pickOption(page, "Supervisor");
    const priority = await pickOption(
      page,
      "Prioridad (opcional)",
      /Corto plazo/,
    );
    expect(priority).toMatch(/Corto plazo/);
    await descriptionField(page).fill(
      "Comportamiento inseguro e2e (no se guarda)",
    );

    await expect(create).toBeEnabled();
    await create.click();
    await expect(toast(page, "Hallazgo creado correctamente")).toBeVisible();

    const body = String(writes[0].body);
    expect(body).toMatch(/name="priorityDays"\r\n\r\n8\r\n/);
    expect(body).not.toContain('name="file"');
  });

  // Antes "comportamiento inseguro" solo se activaba: al cambiar a otra
  // clasificación la foto dejaba de ser obligatoria.
  test("al cambiar de comportamiento inseguro a otra clasificación vuelve a exigir la foto", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    await page.goto("/hallazgos/form");
    await sessionPlants(page);
    const create = page.getByRole("button", { name: "Crear hallazgo" });

    await pickOption(page, "Planta");
    await pickOption(page, "Hallazgo", /[Cc]omportamiento inseguro/);
    await pickOption(page, "Tipo");
    await pickOption(page, "Lugar");
    await pickOption(page, "Proceso");
    await pickOption(page, "Supervisor");
    await descriptionField(page).fill(
      "Clasificación cambiada e2e (no se guarda)",
    );
    await expect(create).toBeEnabled();

    await pickOption(page, "Hallazgo", /^Condición insegura$/);
    await pickOption(page, "Tipo");
    await create.click();
    await expect(page.locator('[data-error-for="photo"]')).toBeVisible();
    expect(writes).toEqual([]);
  });

  /** Supervisores simulados: uno por lugar, con el id del lugar en el nombre. */
  const SUPERVISORS = /\/api\/v1\/users\/supervisors/;
  const supervisorOf = (zoneId: string) => ({
    id: 7000 + Number(zoneId),
    name: `E2E Supervisor del lugar ${zoneId}`,
    email: `e2e-${zoneId}@example.com`,
  });
  const escapeRegex = (text: string) =>
    text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // El valor elegido se dibuja fuera del <input> (renderValue de
  // SelectDefault): se revisa el texto del campo completo.
  const supervisorField = (page: Page) =>
    page.locator(".MuiAutocomplete-root").filter({
      has: page.getByRole("combobox", { name: "Supervisor", exact: true }),
    });

  test("pide los supervisores del lugar y quita el elegido al cambiar de lugar", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const requests: URL[] = [];
    await page.route(SUPERVISORS, (route) => {
      const url = new URL(route.request().url());
      requests.push(url);
      return route.fulfill({
        json: [supervisorOf(url.searchParams.get("zoneId") ?? "0")],
      });
    });
    // El catálogo de lugares se pide en su versión ligera.
    const zonesRequest = page.waitForRequest(
      (request) =>
        new URL(request.url()).pathname.endsWith("/api/v1/zones") &&
        request.method() === "GET",
    );
    await page.goto("/hallazgos/form");
    await sessionPlants(page);
    expect(new URL((await zonesRequest).url()).searchParams.get("view")).toBe(
      "options",
    );

    const plant = await pickOption(page, "Planta");
    // Nada se pide hasta elegir planta y lugar (antes: todos al abrir).
    expect(requests).toEqual([]);
    const firstZone = await pickOption(page, "Lugar");
    const first = await pickOption(page, "Supervisor", /E2E Supervisor/);
    await expect(supervisorField(page)).toContainText(first);

    const params = requests.at(-1)!.searchParams;
    expect(params.get("zoneId")).toMatch(/^\d+$/);
    expect(params.get("manufacturingPlantId")).toMatch(/^\d+$/);
    expect(plant).toBeTruthy();

    // Otro lugar: el supervisor anterior ya no aplica y se quita.
    await pickOption(
      page,
      "Lugar",
      new RegExp(`^(?!${escapeRegex(firstZone)}$)`),
    );
    await expect(supervisorField(page)).not.toContainText("E2E Supervisor");
    const second = await pickOption(page, "Supervisor", /E2E Supervisor/);
    expect(second).not.toBe(first);
    expect(requests.every((url) => url.searchParams.has("zoneId"))).toBe(true);
    expect(errors).toEqual([]);
  });

  test("muestra la carga de supervisores, el error y el lugar sin supervisores", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    let calls = 0;
    await page.route(SUPERVISORS, async (route) => {
      calls++;
      if (calls === 1) {
        await held;
        return route.fulfill({ status: 500, json: { message: "Caída" } });
      }
      return route.fulfill({ json: [] });
    });
    await page.goto("/hallazgos/form");
    await sessionPlants(page);

    await pickOption(page, "Planta");
    const firstZone = await pickOption(page, "Lugar");
    await expect(page.getByLabel("Cargando Supervisor")).toBeVisible();

    release();
    await expect(
      page.getByText(
        "No se pudieron cargar los supervisores; vuelva a elegir el lugar",
      ),
    ).toBeVisible();

    await pickOption(
      page,
      "Lugar",
      new RegExp(`^(?!${escapeRegex(firstZone)}$)`),
    );
    await expect(
      page.getByText("Este lugar no tiene supervisores asignados"),
    ).toBeVisible();
    // El aviso del lugar sin supervisores no se acompaña de errores en rojo
    // hasta intentar guardar.
    await expect(page.getByText("Selecciona el supervisor.")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("al guardar incompleto marca el primer campo que falta y lo enfoca", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    await page.goto("/hallazgos/form");
    const plants = await sessionPlants(page);
    // Con una sola planta ya viene elegida: falta la clasificación.
    const expected =
      plants.length === 1 ? "Selecciona el hallazgo." : "Selecciona la planta.";
    const field = plants.length === 1 ? "Hallazgo" : "Planta";

    await page.getByRole("button", { name: "Crear hallazgo" }).click();

    await expect(
      page.locator("#contenido").getByText(expected, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: field, exact: true }),
    ).toBeFocused();
    expect(writes).toEqual([]);

    // Al corregir, el error se quita.
    await pickOption(page, field);
    await expect(
      page.locator("#contenido").getByText(expected, { exact: true }),
    ).toHaveCount(0);
  });

  test("recuerda la última planta y el último lugar del usuario en este dispositivo", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    await page.goto("/hallazgos/form");
    await sessionPlants(page);

    const plant = await pickOption(page, "Planta");
    await pickOption(page, "Hallazgo", /[Cc]omportamiento inseguro/);
    await pickOption(page, "Tipo");
    const zone = await pickOption(page, "Lugar");
    await pickOption(page, "Proceso");
    await pickOption(page, "Supervisor");
    await descriptionField(page).fill("Recordar lugar e2e (no se guarda)");
    await page.getByRole("button", { name: "Crear hallazgo" }).click();
    await expect(toast(page, "Hallazgo creado correctamente")).toBeVisible();
    expect(writes).toHaveLength(1);

    // Ligado al usuario con sesión (hay celulares compartidos).
    const stored = await page.evaluate(() =>
      Object.keys(localStorage).filter((key) =>
        key.startsWith("hallazgos:ultimo-lugar:"),
      ),
    );
    expect(stored).toHaveLength(1);

    await page.goto("/hallazgos/form");
    await sessionPlants(page);
    // El valor elegido se dibuja fuera del <input> (renderValue).
    const fieldText = (label: string) =>
      page.locator(".MuiAutocomplete-root").filter({
        has: page.getByRole("combobox", { name: label, exact: true }),
      });
    await expect(fieldText("Planta")).toContainText(plant);
    await expect(fieldText("Lugar")).toContainText(zone);
  });
});

test("Nuevo hallazgo con señal lenta: 'Cargando…' en Hallazgo y Lugar mientras llegan", async ({
  page,
}) => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route(
    (url) =>
      url.pathname.endsWith("/api/v1/main-types") ||
      url.pathname.endsWith("/api/v1/zones"),
    async (route) => {
      await held;
      await route.fallback();
    },
  );
  await page.goto("/hallazgos/form");
  const [plant] = await sessionPlants(page);
  await pickOption(page, "Planta", plant.name);

  await expect(page.getByLabel("Cargando Hallazgo")).toBeVisible();
  await expect(page.getByLabel("Cargando Lugar")).toBeVisible();

  release();
  await expect(page.getByLabel("Cargando Hallazgo")).toHaveCount(0);
  await expect(page.getByLabel("Cargando Lugar")).toHaveCount(0);
});
