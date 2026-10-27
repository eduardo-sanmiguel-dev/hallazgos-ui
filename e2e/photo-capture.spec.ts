import type { Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";

// Foto de evidencia (PhotoCapture) en el formulario de ICS: cámara del
// teléfono como opción principal, compresión y mensajes claros.

const preview = (page: Page) => page.getByAltText("Vista previa de la evidencia");

/** JPG de `width`×`height` generado en el navegador (ruido: pesa más). */
const bigJpeg = (page: Page, width: number, height: number) =>
  page.evaluate(
    async ({ width, height }) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d")!;
      const image = context.createImageData(width, height);
      for (let i = 0; i < image.data.length; i++) {
        image.data[i] = (i * 2654435761) % 256;
      }
      context.putImageData(image, 0, 0);
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.95),
      );
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    },
    { width, height },
  );

test.describe("Foto de evidencia", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ics/form");
    await expect(page.getByText("Tomar foto")).toBeVisible();
  });

  test("la opción principal abre la cámara trasera del teléfono", async ({
    page,
  }) => {
    const camera = page.getByLabel("Tomar foto");
    await expect(camera).toHaveAttribute("capture", "environment");
    await expect(camera).toHaveAttribute("accept", "image/*");
    // La galería no fuerza la cámara.
    await expect(page.getByLabel("Elegir de galería")).not.toHaveAttribute(
      "capture",
      /.*/,
    );
  });

  test("una foto grande se reduce a 1920 px y pesa menos de 2 MB", async ({
    page,
  }) => {
    const buffer = Buffer.from(await bigJpeg(page, 4000, 3000));
    expect(buffer.length).toBeGreaterThan(2 * 1024 * 1024);

    await page.getByLabel("Tomar foto").setInputFiles({
      name: "IMG_0001.jpg",
      mimeType: "image/jpeg",
      buffer,
    });
    await expect(preview(page)).toBeVisible();

    const [width, height] = await preview(page).evaluate(
      async (img: HTMLImageElement) => {
        await img.decode();
        return [img.naturalWidth, img.naturalHeight];
      },
    );
    expect(Math.max(width, height)).toBeLessThanOrEqual(1920);
    expect(Math.max(width, height)).toBeGreaterThan(1000);

    const sizeText = await page.getByText(/^Foto lista · /).innerText();
    const [, amount, unit] = sizeText.match(/([\d.]+) (KB|MB)/)!;
    const bytes = Number(amount) * (unit === "MB" ? 1024 * 1024 : 1024);
    expect(bytes).toBeLessThan(2 * 1024 * 1024);
  });

  test("si el archivo no es una imagen, lo dice", async ({ page }) => {
    await page.getByLabel("Elegir de galería").setInputFiles({
      name: "notas.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("no es imagen"),
    });
    await expect(
      page.getByRole("alert").filter({ hasText: "El archivo no es una imagen." }),
    ).toBeVisible();
    await expect(preview(page)).toHaveCount(0);
  });

  test("se puede quitar la foto y elegir otra", async ({ page }) => {
    const buffer = Buffer.from(await bigJpeg(page, 800, 600));
    await page
      .getByLabel("Elegir de galería")
      .setInputFiles({ name: "a.jpg", mimeType: "image/jpeg", buffer });
    await expect(preview(page)).toBeVisible();
    // Con foto ya no se ofrecen las opciones de captura.
    await expect(page.getByText("Tomar foto")).toHaveCount(0);

    await page.getByRole("button", { name: "Quitar foto" }).click();
    await expect(preview(page)).toHaveCount(0);
    await expect(page.getByText("Tomar foto")).toBeVisible();
  });
});
