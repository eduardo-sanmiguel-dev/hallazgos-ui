import type { Page } from "@playwright/test";

import { captureWrites, mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import { toast } from "./support/ui";

// Hojas de datos de seguridad: los administradores suben, reemplazan y
// eliminan PDF (antes solo se podían agregar con un commit y un deploy). Las
// escrituras se interceptan (captureWrites); la lista es fija.

const HDS = { id: 7, name: "ACEITE MINERAL.pdf", isActive: true };
const PDF = Buffer.from("%PDF-1.4\nprueba\n%%EOF");

const openPage = async (page: Page) => {
  await mockGet(page, "/safety-data-files", { data: [HDS], count: 1 });
  await page.goto("/hds");
  await expect(page.getByText(HDS.name)).toBeVisible();
};

const fileInput = (page: Page) => page.getByTestId("hds-file-input");

test.describe("HDS: administración", () => {
  test("sube una HDS nueva como PDF (multipart) y avisa", async ({ page }) => {
    const writes = await captureWrites(page, {
      respond: () => ({ id: 8, name: "NUEVA HOJA.pdf" }),
    });
    await openPage(page);

    await page.getByRole("button", { name: "Subir HDS" }).click();
    await fileInput(page).setInputFiles({
      name: "NUEVA HOJA.pdf",
      mimeType: "application/pdf",
      buffer: PDF,
    });

    await expect(toast(page, 'Se subió "NUEVA HOJA.pdf".')).toBeVisible();
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ method: "POST", path: "/safety-data-files" });
    expect(String(writes[0].body)).toContain('filename="NUEVA HOJA.pdf"');
  });

  test("valida en el navegador: solo PDF y hasta 30 MB", async ({ page }) => {
    const writes = await captureWrites(page);
    await openPage(page);

    await fileInput(page).setInputFiles({
      name: "hoja.docx",
      mimeType: "application/msword",
      buffer: Buffer.from("no"),
    });
    await expect(toast(page, "Solo se permiten archivos PDF.")).toBeVisible();

    await fileInput(page).setInputFiles({
      name: "ENORME.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(30 * 1024 * 1024 + 1),
    });
    await expect(toast(page, /el máximo es 30 MB/)).toBeVisible();

    expect(writes).toEqual([]);
  });

  test("reemplaza el PDF de una fila (conserva su nombre)", async ({ page }) => {
    const writes = await captureWrites(page, { respond: () => HDS });
    await openPage(page);

    await page.getByRole("button", { name: "Reemplazar PDF" }).click();
    await fileInput(page).setInputFiles({
      name: "version-2025.pdf",
      mimeType: "application/pdf",
      buffer: PDF,
    });

    await expect(toast(page, `Se reemplazó el PDF de "${HDS.name}".`)).toBeVisible();
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ method: "PUT", path: `/safety-data-files/${HDS.id}/file` });
  });

  test("eliminar pide confirmación; Cancelar no borra nada", async ({ page }) => {
    const writes = await captureWrites(page, { respond: () => ({ id: HDS.id, name: HDS.name }) });
    await openPage(page);

    const dialog = page.getByRole("dialog", { name: "¿Eliminar hoja de datos?" });
    await page.getByRole("button", { name: "Eliminar" }).click();
    await expect(dialog).toContainText(`Se quitará "${HDS.name}" del catálogo`);
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toBeHidden();
    expect(writes).toEqual([]);

    await page.getByRole("button", { name: "Eliminar" }).click();
    await dialog.getByRole("button", { name: "Eliminar" }).click();

    await expect(toast(page, `Se eliminó "${HDS.name}".`)).toBeVisible();
    expect(writes).toEqual([
      expect.objectContaining({ method: "DELETE", path: `/safety-data-files/${HDS.id}` }),
    ]);
  });

  // Regresión (ConfirmDialog): al cancelar, el diálogo tarda en desaparecer y
  // su botón de confirmar seguía activo; un clic en ese momento borraba.
  test("confirmar justo después de cancelar no ejecuta la acción", async ({ page }) => {
    const writes = await captureWrites(page);
    await openPage(page);

    await page.getByRole("button", { name: "Eliminar" }).click();
    const dialog = page.getByRole("dialog", { name: "¿Eliminar hoja de datos?" });
    await expect(dialog).toBeVisible();
    // Cancelar y, enseguida, confirmar (el botón aún se ve).
    await dialog.evaluate((element) => {
      const buttons = [...element.querySelectorAll("button")];
      buttons.find((b) => b.textContent === "Cancelar")!.click();
      buttons.find((b) => b.textContent === "Eliminar")!.click();
    });
    await expect(dialog).toBeHidden();
    await page.waitForTimeout(300);

    expect(writes).toEqual([]);
  });

  test("doble clic en confirmar elimina una sola vez", async ({ page }) => {
    const writes = await captureWrites(page, { respond: () => ({ id: HDS.id, name: HDS.name }) });
    await openPage(page);

    await page.getByRole("button", { name: "Eliminar" }).click();
    const dialog = page.getByRole("dialog", { name: "¿Eliminar hoja de datos?" });
    await dialog.getByRole("button", { name: "Eliminar" }).dblclick();

    await expect(toast(page, `Se eliminó "${HDS.name}".`)).toBeVisible();
    expect(writes).toHaveLength(1);
  });

  test("un usuario general solo puede ver y descargar", async ({ page }) => {
    await mockGet(page, "/users/get-information-current-user", {
      id: 7302,
      name: "E2E General",
      email: "e2e-general-hds@example.com",
      role: "General",
      isActive: true,
      manufacturingPlants: [{ id: 1, name: "Planta" }],
      zones: [],
    });
    await openPage(page);

    await expect(page.getByRole("button", { name: "Ver archivo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Subir HDS" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Reemplazar PDF" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Eliminar" })).toHaveCount(0);
    await expect(fileInput(page)).toHaveCount(0);
  });
});
