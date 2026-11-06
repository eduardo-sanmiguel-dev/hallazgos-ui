import { expect, test } from "./support/fixtures";

// Compact visible labels keep full, stable names for telemetry.
for (const [route, label, actionName = label] of [
  ["/hallazgos", "Crear hallazgo"],
  ["/ics", "Crear ICS"],
  ["/epp", "Registrar entrega", "Registrar entrega de EPP"],
  ["/ciael", "Crear reporte", "Crear reporte CIAEL"],
  ["/users", "Crear usuario"],
  ["/employees", "Crear colaborador"],
  ["/equipments", "Crear equipo", "Crear equipo de EPP"],
  ["/areas", "Crear lugar"],
  ["/zones", "Crear zona"],
  ["/processes", "Crear proceso"],
  ["/manufacturing-plants", "Crear planta"],
  ["/main-types", "Crear criterio"],
  ["/secondary-types", "Crear tipo", "Crear tipo de criterio"],
  ["/emergency-teams", "Crear equipo", "Crear equipo de emergencia"],
  ["/extinguisher-inspection", "Crear inspección"],
  ["/gemba-walk/zones", "Crear zona", "Crear zona de Gemba Walk"],
  ["/gemba-walk/evaluations", "Crear concepto", "Crear concepto de Gemba Walk"],
  ["/gemba-walk/observers", "Asignar observadores", "Asignar observadores de Gemba Walk"],
]) {
  test(`${route}: acción de alta específica`, async ({ page }) => {
    await page.goto(route);
    const action = page.getByRole("button", { name: label, exact: true });
    await expect(action).toBeVisible();
    await expect(action).toHaveAttribute("data-dd-action-name", actionName);
    await expect(
      page.getByRole("button", { name: /^(Crear|Crear registro|Guardar)$/, exact: true }),
    ).toHaveCount(0);
  });
}
