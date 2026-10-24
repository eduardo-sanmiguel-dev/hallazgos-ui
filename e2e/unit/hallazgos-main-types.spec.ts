import { expect, test } from "@playwright/test";

import { isUnsafeBehaviorType } from "../../app/(routes)/hallazgos/_constants/mainTypes";

// Clasificación que no exige foto. Misma regla que el API.

test.describe("Comportamiento inseguro", () => {
  test("se reconoce sin importar mayúsculas", () => {
    for (const name of [
      "Comportamiento inseguro",
      "COMPORTAMIENTO INSEGURO",
      "Riesgo: comportamiento inseguro",
    ]) {
      expect(isUnsafeBehaviorType(name), name).toBe(true);
    }
  });

  test("las demás clasificaciones exigen foto", () => {
    for (const name of [
      "Condición insegura",
      "Incumplimiento",
      "",
      undefined,
    ]) {
      expect(isUnsafeBehaviorType(name), String(name)).toBe(false);
    }
  });
});
