import { expect, test } from "@playwright/test";

import { requiresPhotoEvidence } from "../../app/(routes)/hallazgos/_constants/mainTypes";

// La foto obligatoria la decide la bandera del catálogo (la misma que valida
// el API), no el nombre de la clasificación.

test.describe("Foto obligatoria por clasificación", () => {
  test("solo deja de exigirse con la bandera en false", () => {
    expect(requiresPhotoEvidence({ requiresEvidence: false })).toBe(false);
    expect(requiresPhotoEvidence({ requiresEvidence: true })).toBe(true);
  });

  test("sin la bandera en la respuesta se exige la foto", () => {
    for (const mainType of [{}, { requiresEvidence: null }, null, undefined]) {
      expect(requiresPhotoEvidence(mainType), String(mainType)).toBe(true);
    }
  });

  test("el nombre ya no decide", () => {
    const renamed = { name: "Comportamiento inseguro", requiresEvidence: true };
    expect(requiresPhotoEvidence(renamed)).toBe(true);
    const flagged = { name: "Condición insegura", requiresEvidence: false };
    expect(requiresPhotoEvidence(flagged)).toBe(false);
  });
});
