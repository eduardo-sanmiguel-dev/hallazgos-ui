import { expect, test } from "@playwright/test";

import { pickOption, recordCount, toast, trackPageErrors } from "./support/ui";

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

    const create = page.getByRole("button", { name: "Crear hallazgo" });
    await expect(create).toBeDisabled();

    await pickOption(page, "Planta");
    // Un tipo que no sea "comportamiento inseguro": exige evidencia.
    await pickOption(page, "Hallazgo", /^(?!.*[Cc]omportamiento inseguro)/);
    await pickOption(page, "Tipo");
    await pickOption(page, "Lugar");
    await pickOption(page, "Proceso");
    await pickOption(page, "Supervisor");
    await page
      .locator("#description-multiline")
      .fill("Hallazgo de prueba e2e (no se guarda)");

    // Sin evidencia el botón sigue deshabilitado.
    await expect(create).toBeDisabled();

    await page.locator('input[type="file"]').first().setInputFiles({
      name: "evidencia.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    });
    await expect(create).toBeEnabled();
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
});
