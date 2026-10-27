import { expect, test } from "@playwright/test";

import {
  getPriorityLabel,
  priorityOptions,
  RISK_LEVEL_ORDER,
} from "../../app/(routes)/hallazgos/_constants/priorityOptions";

// Mismo mapeo que el API (dashboard, correos): Inmediato es el plazo más
// corto y el riesgo más alto. Hasta el 26-jun-2026 el dashboard lo tenía al
// revés.

test.describe("Mapeo de prioridad", () => {
  test("Inmediato = 2 días (Crítico), Corto plazo = 8 días (Alto)", () => {
    expect(
      priorityOptions.map(({ name, days, riskLevel }) => [name, days, riskLevel]),
    ).toEqual([
      ["Inmediato", 2, "Critico"],
      ["Corto plazo", 8, "Alto"],
      ["Mediano plazo", 15, "Medio"],
      ["Largo plazo", 30, "Bajo"],
    ]);
  });

  test("los plazos van del más corto al más largo", () => {
    const days = priorityOptions.map((option) => option.days);
    expect(days).toEqual([...days].sort((a, b) => a - b));
  });

  test("orden de la gráfica de riesgo, del más bajo al más alto", () => {
    expect(RISK_LEVEL_ORDER).toEqual(["Bajo", "Medio", "Alto", "Critico"]);
  });

  test("etiqueta en tabla y detalle", () => {
    expect(getPriorityLabel(2)).toBe("Inmediato (2 días)");
    expect(getPriorityLabel(8)).toBe("Corto plazo (8 días)");
    expect(getPriorityLabel(5)).toBe("5 días");
    expect(getPriorityLabel(null)).toBe("Sin prioridad");
  });
});
