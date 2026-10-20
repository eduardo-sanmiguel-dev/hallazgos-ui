import { readFileSync } from "fs";

import { expect, test, type Download } from "@playwright/test";

import { recordCount, toast } from "./support/ui";

/** Un .xlsx es un zip: debe empezar con "PK" y no estar vacío. */
const expectXlsx = async (download: Download) => {
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  const bytes = readFileSync((await download.path()) as string);
  expect(bytes.length).toBeGreaterThan(1000);
  expect(bytes.subarray(0, 2).toString("latin1")).toBe("PK");
};

test.describe("Exportaciones", () => {
  test("descarga el Excel de hallazgos", async ({ page }) => {
    await page.goto("/hallazgos");
    await expect
      .poll(() => recordCount(page), { timeout: 30_000 })
      .toBeGreaterThan(0);

    const download = page.waitForEvent("download", { timeout: 120_000 });
    await page.getByRole("button", { name: "Excel" }).click();
    const file = await download;

    await expectXlsx(file);
    expect(file.suggestedFilename()).toMatch(/^Hallazgos_/);
  });

  test("el PDF de hallazgos pide planta antes de descargar", async ({
    page,
  }) => {
    let pdfCalls = 0;
    page.on("request", (request) => {
      if (request.url().includes("/download/pdf")) pdfCalls++;
    });

    await page.goto("/hallazgos");
    await page.getByRole("button", { name: "PDF" }).click();

    await expect(toast(page, "Seleccione una planta")).toBeVisible();
    expect(pdfCalls).toBe(0);
  });

  test("descarga el Excel de CIAEL", async ({ page }) => {
    await page.goto("/ciael");
    await expect(page.getByRole("heading", { name: "CIAEL" })).toBeVisible();

    const download = page.waitForEvent("download", { timeout: 120_000 });
    await page.getByRole("button", { name: "Excel" }).click();

    await expectXlsx(await download);
  });
});
