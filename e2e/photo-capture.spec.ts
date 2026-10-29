import type { Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";

// Foto de evidencia (PhotoCapture) en el formulario de ICS: en pantalla táctil,
// cámara del teléfono como opción principal y galería; con mouse, un solo
// "Subir foto" y la cámara web. Compresión y mensajes claros.

const preview = (page: Page) =>
  page.getByAltText("Vista previa de la evidencia");

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

test.describe("Foto de evidencia: pantalla táctil", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test("la opción principal abre la cámara trasera; la galería no la fuerza", async ({
    page,
  }) => {
    await page.goto("/ics/form");
    const camera = page.getByLabel("Tomar foto");
    await expect(camera).toHaveAttribute("capture", "environment");
    await expect(camera).toHaveAttribute("accept", "image/*");
    await expect(page.getByLabel("Elegir de galería")).not.toHaveAttribute(
      "capture",
      /.*/,
    );
    await expect(page.getByLabel("Subir foto")).toHaveCount(0);
    // La cámara del teléfono hace lo mismo y mejor: sin la del navegador.
    await expect(
      page.getByRole("button", { name: "Usar cámara del navegador" }),
    ).toHaveCount(0);
  });
});

test.describe("Foto de evidencia: escritorio", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ics/form");
    await expect(page.getByText("Subir foto")).toBeVisible();
  });

  test("un solo botón para subir la foto, más la cámara web", async ({
    page,
  }) => {
    // Con mouse, "Tomar foto" y "Elegir de galería" abrían el mismo selector.
    await expect(page.getByLabel("Subir foto")).not.toHaveAttribute(
      "capture",
      /.*/,
    );
    await expect(page.getByLabel("Subir foto")).toHaveAttribute(
      "accept",
      "image/*",
    );
    await expect(page.getByText("Tomar foto")).toHaveCount(0);
    await expect(page.getByText("Elegir de galería")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Usar cámara del navegador" }),
    ).toBeVisible();
  });

  test("una foto grande se reduce a 1920 px y pesa menos de 2 MB", async ({
    page,
  }) => {
    const buffer = Buffer.from(await bigJpeg(page, 4000, 3000));
    expect(buffer.length).toBeGreaterThan(2 * 1024 * 1024);

    await page.getByLabel("Subir foto").setInputFiles({
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

  test("se puede arrastrar la foto al área de evidencia", async ({ page }) => {
    const bytes = await bigJpeg(page, 800, 600);
    const transfer = await page.evaluateHandle((data) => {
      const dt = new DataTransfer();
      dt.items.add(
        new File([new Uint8Array(data)], "arrastrada.jpg", {
          type: "image/jpeg",
        }),
      );
      return dt;
    }, bytes);
    const area = page
      .getByText("Sube una foto de lo que observaste o arrástrala aquí.")
      .locator("..");
    await area.dispatchEvent("dragover", { dataTransfer: transfer });
    await area.dispatchEvent("drop", { dataTransfer: transfer });

    await expect(preview(page)).toBeVisible();
  });

  test("si el archivo no es una imagen, lo dice", async ({ page }) => {
    await page.getByLabel("Subir foto").setInputFiles({
      name: "notas.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("no es imagen"),
    });
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "El archivo no es una imagen." }),
    ).toBeVisible();
    await expect(preview(page)).toHaveCount(0);
  });

  test("se puede quitar la foto y elegir otra", async ({ page }) => {
    const buffer = Buffer.from(await bigJpeg(page, 800, 600));
    await page
      .getByLabel("Subir foto")
      .setInputFiles({ name: "a.jpg", mimeType: "image/jpeg", buffer });
    await expect(preview(page)).toBeVisible();
    // Con foto ya no se ofrecen las opciones de captura.
    await expect(page.getByText("Subir foto")).toHaveCount(0);

    await page.getByRole("button", { name: "Quitar foto" }).click();
    await expect(preview(page)).toHaveCount(0);
    await expect(page.getByText("Subir foto")).toBeVisible();
  });
});
