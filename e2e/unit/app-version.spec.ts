import { describe, expect, test } from "vite-plus/test";

import { appVersionLabel } from "../../app/_shared/utils/appVersion";

// Versión en el menú del usuario: la misma que registra RUM y el dashboard.

describe("Versión de la app en el menú", () => {
  test("una versión legible (fecha + commit) se muestra completa", () => {
    expect(appVersionLabel("20261125-1432-abc1234")).toBe("20261125-1432-abc1234");
  });

  test("un UUID de builds anteriores se recorta a 8 caracteres", () => {
    expect(appVersionLabel("c05cdf63-1d2e-4f5a-9b8c-0123456789ab")).toBe("c05cdf63");
  });

  test("sin versión (modo dev) dice desarrollo", () => {
    expect(appVersionLabel(undefined)).toBe("desarrollo");
    expect(appVersionLabel("")).toBe("desarrollo");
  });
});
