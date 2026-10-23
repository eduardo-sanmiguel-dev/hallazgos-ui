import { expect, test } from "@playwright/test";

import {
  computeKpis,
  periodLabel,
  periodNames,
  type BiData,
} from "../../app/(routes)/business-intelligence/epp/_lib/biEpp";

// Indicadores del análisis EPP (lógica pura, sin navegador). El SQL "a la
// fecha" se prueba en hallazgos-api/test/db/bi-epp.int-spec.ts.

const zeros = {
  gasto: 0,
  unidades: 0,
  entregas: 0,
  fueraDeRango: 0,
  empleados: 0,
  primeraVez: 0,
};

const data = (overrides: Partial<BiData["kpis"]> = {}) =>
  ({
    hasPrices: true,
    kpis: {
      periodo: {
        actual: { desde: "2026-10-01", hasta: "2026-10-22" },
        anterior: { desde: "2026-09-01", hasta: "2026-09-22" },
      },
      actual: zeros,
      anterior: zeros,
      promedioGlobal: 0,
      ...overrides,
    },
    chart1: [],
    chart3: [],
    chart4: [],
    chart8: [],
    chart9: [],
  }) as BiData;

test.describe("Análisis EPP: periodos", () => {
  test("rango de días del mes", () => {
    expect(periodLabel({ desde: "2026-10-01", hasta: "2026-10-22" })).toBe(
      "1–22 oct 2026",
    );
  });

  test("un solo día (primer día del mes)", () => {
    expect(periodLabel({ desde: "2026-11-01", hasta: "2026-11-01" })).toBe(
      "1 nov 2026",
    );
  });

  test("febrero recortado al final del mes", () => {
    expect(periodLabel({ desde: "2026-02-01", hasta: "2026-02-28" })).toBe(
      "1–28 feb 2026",
    );
  });

  test("nombres de ambos periodos desde la API", () => {
    expect(periodNames(data())).toEqual({
      currentName: "1–22 oct 2026",
      previousName: "1–22 sep 2026",
    });
  });
});

test.describe("Análisis EPP: indicadores", () => {
  test("porcentaje fuera de rango y promedio por colaborador", () => {
    const kpis = computeKpis(
      data({
        actual: {
          ...zeros,
          gasto: 1200,
          entregas: 8,
          fueraDeRango: 2,
          empleados: 4,
        },
        anterior: {
          ...zeros,
          gasto: 300,
          entregas: 4,
          fueraDeRango: 1,
          empleados: 3,
        },
        promedioGlobal: 250,
      }),
    );
    expect(kpis.outOfRange).toEqual({
      current: 25,
      previous: 25,
      deliveries: 8,
    });
    expect(kpis.averagePerEmployee).toEqual({
      current: 300,
      previous: 100,
      globalAverage: 250,
    });
    expect(kpis.spend).toEqual({ current: 1200, previous: 300 });
  });

  test("sin entregas ni colaboradores no divide entre cero", () => {
    const kpis = computeKpis(data());
    expect(kpis.outOfRange).toEqual({ current: 0, previous: 0, deliveries: 0 });
    expect(kpis.averagePerEmployee.current).toBe(0);
  });
});
