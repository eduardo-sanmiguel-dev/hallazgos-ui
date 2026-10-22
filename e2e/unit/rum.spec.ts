import { expect, test } from "@playwright/test";

import { shouldSendRumEvent } from "../../app/_shared/utils/rum";

// Regla `beforeSend` del RUM (instrumentation-client.ts). Solo corre en
// producción, así que se prueba la función directamente, sin navegador.

test.describe("RUM: eventos que se envían", () => {
  test("descarta los clics sobre el trazo de la firma", () => {
    expect(
      shouldSendRumEvent({
        type: "action",
        action: { target: { name: "firma-trazo" } },
      }),
    ).toBe(false);
  });

  test("envía las demás acciones, incluidos los botones de la firma", () => {
    for (const name of ["Guardar", "Limpiar", "Agregar", undefined]) {
      expect(
        shouldSendRumEvent({ type: "action", action: { target: { name } } }),
      ).toBe(true);
    }
    expect(shouldSendRumEvent({ type: "action", action: {} })).toBe(true);
  });

  test("envía los eventos que no son acciones", () => {
    for (const type of ["view", "error", "resource", "long_task"]) {
      expect(shouldSendRumEvent({ type })).toBe(true);
    }
  });
});
