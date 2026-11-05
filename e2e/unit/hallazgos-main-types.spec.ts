import { describe, expect, test } from "vite-plus/test";

import {
  activeSecondaryTypes,
  requiresPhotoEvidence,
} from "../../app/features/hallazgos/_constants/mainTypes";

// La foto obligatoria la decide la bandera del catálogo (la misma que valida
// el API), no el nombre de la clasificación.

describe("Foto obligatoria por clasificación", () => {
  test("solo deja de exigirse con la bandera en false", () => {
    expect(requiresPhotoEvidence({ requiresEvidence: false })).toBe(false);
    expect(requiresPhotoEvidence({ requiresEvidence: true })).toBe(true);
  });

  test("sin la bandera en la respuesta se exige la foto", () => {
    for (const mainType of [{}, { requiresEvidence: null }, null, undefined]) {
      expect(requiresPhotoEvidence(mainType), JSON.stringify(mainType) ?? "undefined").toBe(true);
    }
  });

  test("el nombre ya no decide", () => {
    const renamed = { name: "Comportamiento inseguro", requiresEvidence: true };
    expect(requiresPhotoEvidence(renamed)).toBe(true);
    const flagged = { name: "Condición insegura", requiresEvidence: false };
    expect(requiresPhotoEvidence(flagged)).toBe(false);
  });
});

describe("Tipos disponibles para un nuevo hallazgo", () => {
  test("excluye el tipo #23 desactivado sin modificar el catálogo original", () => {
    const inactive = { id: 23, isActive: false };
    const active = { id: 24, isActive: true };
    const catalog = [inactive, active];
    expect(activeSecondaryTypes(catalog)).toEqual([active]);
    expect(catalog).toEqual([inactive, active]);
  });
  test("admite catálogos vacíos y registros anteriores sin bandera", () => {
    expect(activeSecondaryTypes([])).toEqual([]);
    expect(activeSecondaryTypes([{ id: 1 }])).toEqual([{ id: 1 }]);
  });
});
