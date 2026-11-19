import type { Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";
import { toast, trackPageErrors } from "./support/ui";

// Formularios de catálogo en edición: si el API rechaza el guardado (400 de
// validación), el aviso lo muestra el interceptor y el formulario se queda
// abierto con lo capturado; "Cancelar" regresa a la lista. Nada se guarda:
// la escritura se responde aquí.

/** Registros viejos con un dato obligatorio vacío: se completa para llegar al API. */
const completeRequired = async (page: Page, label: string) => {
  const select = page.getByRole("combobox", { name: label });
  // Un Select vacío de MUI muestra un espacio de ancho cero.
  if ((await select.innerText()).replace(/[\s​]/g, "")) return;
  await select.click();
  await page.getByRole("listbox").getByRole("option").first().click();
};

const FORMS: [string, ((page: Page) => Promise<void>)?][] = [
  ["/areas"],
  ["/zones"],
  ["/main-types"],
  ["/secondary-types", (page) => completeRequired(page, "Responsable")],
  ["/manufacturing-plants"],
  ["/users"],
  ["/employees"],
  ["/equipments"],
  ["/emergency-teams"],
  ["/gemba-walk/zones"],
  ["/gemba-walk/evaluations"],
];

for (const [list, prepare] of FORMS) {
  test(`${list}: un 400 al guardar deja el formulario abierto; Cancelar regresa`, async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const writes: string[] = [];
    await page.route("**/api/v1/**", async (route) => {
      const method = route.request().method();
      if (!["POST", "PUT", "PATCH"].includes(method)) return route.fallback();
      writes.push(method);
      await route.fulfill({
        status: 400,
        json: {
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: "Nombre: dato no válido.",
          error: "Bad Request",
          errors: { name: "Dato no válido." },
        },
      });
    });

    await page.goto(list);
    const edit = page.getByRole("button", { name: "Editar" }).first();
    await expect(edit).toBeVisible();
    await edit.click();
    await expect(page).toHaveURL(/\/form\?id=\d+/);
    const save = page.locator(".form-actions-save");
    await expect(save).toBeEnabled();
    await prepare?.(page);

    await save.click();

    await expect(toast(page, "Revisa los datos")).toBeVisible();
    expect(writes).toHaveLength(1);
    await expect(page).toHaveURL(/\/form\?id=\d+/);

    await page.locator(".form-actions-cancel").click();
    // Con algo modificado (prepare) pide confirmar antes de salir.
    const discard = page.getByRole("dialog").getByRole("button", { name: "Descartar" });
    if (await discard.isVisible({ timeout: 1000 }).catch(() => false)) await discard.click();
    await expect(page).toHaveURL(new RegExp(`${list}$`));
    expect(errors).toEqual([]);
  });
}
