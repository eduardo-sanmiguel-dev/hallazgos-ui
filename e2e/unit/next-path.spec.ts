import { expect, test } from "@playwright/test";

import { loginPathFor, safeNextPath } from "../../app/_shared/utils/nextPath";

// Ruta de regreso después del login (`/?next=`): solo rutas de la app.

test.describe("Ruta de regreso al iniciar sesión", () => {
  test("acepta rutas internas con su búsqueda", () => {
    expect(safeNextPath("/hallazgos?evidenceId=42")).toBe(
      "/hallazgos?evidenceId=42",
    );
    expect(safeNextPath("/gemba-walk/view?id=3")).toBe("/gemba-walk/view?id=3");
  });

  test("descarta otros sitios, el login y valores vacíos", () => {
    for (const value of [
      "https://otro.sitio/hallazgos",
      "//otro.sitio",
      "/\\otro.sitio",
      "javascript:alert(1)",
      "hallazgos",
      "/",
      "",
      null,
      undefined,
    ]) {
      expect(safeNextPath(value), String(value)).toBeNull();
    }
  });

  test("el login lleva la ruta pedida codificada", () => {
    expect(loginPathFor("/hallazgos", "?evidenceId=42")).toBe(
      "/?next=%2Fhallazgos%3FevidenceId%3D42",
    );
    expect(loginPathFor("/", "")).toBe("/");
  });
});
