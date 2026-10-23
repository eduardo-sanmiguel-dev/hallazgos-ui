import { expect, test } from "@playwright/test";

import type { BiEppOutOfRangeRow } from "../../app/_interfaces/dashboard.interfaces";
import {
  matchesEmployee,
  rankEmployees,
} from "../../app/(routes)/business-intelligence/epp/_lib/outOfRange";
import {
  DEFAULT_PERIOD,
  presetRange,
} from "../../app/(routes)/business-intelligence/epp/_lib/period";
import {
  formatIsoDate,
  periodLabel,
} from "../../app/(routes)/business-intelligence/epp/_lib/biEpp";

// Lógica pura del periodo y del ranking fuera de rango (sin navegador).

test.describe("Análisis EPP: atajos de periodo", () => {
  const today = new Date(2026, 9, 22); // 22 oct 2026

  test("este mes (por omisión), mes anterior, 3 meses y este año", () => {
    expect(DEFAULT_PERIOD(today)).toEqual({
      preset: "month",
      startDate: "01/10/2026",
      endDate: "22/10/2026",
    });
    expect(presetRange("lastMonth", today)).toMatchObject({
      startDate: "01/09/2026",
      endDate: "30/09/2026",
    });
    expect(presetRange("last3", today)).toMatchObject({
      startDate: "01/08/2026",
      endDate: "22/10/2026",
    });
    expect(presetRange("year", today)).toMatchObject({
      startDate: "01/01/2026",
      endDate: "22/10/2026",
    });
  });

  test("en enero, el mes anterior es diciembre del año pasado", () => {
    expect(presetRange("lastMonth", new Date(2026, 0, 15))).toMatchObject({
      startDate: "01/12/2025",
      endDate: "31/12/2025",
    });
  });
});

test.describe("Análisis EPP: textos de fechas", () => {
  test("rangos de uno o varios meses y años", () => {
    expect(periodLabel({ desde: "2026-08-01", hasta: "2026-10-22" })).toBe(
      "1 ago – 22 oct 2026",
    );
    expect(periodLabel({ desde: "2025-12-01", hasta: "2026-01-22" })).toBe(
      "1 dic 2025 – 22 ene 2026",
    );
    expect(formatIsoDate("2026-10-05")).toBe("5 oct 2026");
  });
});

const row = (overrides: Partial<BiEppOutOfRangeRow>): BiEppOutOfRangeRow => ({
  employeeId: 1,
  name: "Ana Pérez",
  code: "100",
  area: "Producción",
  position: "Operadora",
  equipmentId: 10,
  equipmentName: "Guante",
  deliveries: 1,
  outOfRange: 0,
  averageDaysEarly: null,
  lastDelivery: "2026-10-01",
  ...overrides,
});

const ROWS = [
  // Ana: guante 2 de 3 fuera (10 días antes); bota 1 de 1 (40 días antes).
  row({
    deliveries: 3,
    outOfRange: 2,
    averageDaysEarly: 10,
    lastDelivery: "2026-10-05",
  }),
  row({
    equipmentId: 20,
    equipmentName: "Bota",
    outOfRange: 1,
    averageDaysEarly: 40,
    lastDelivery: "2026-10-09",
  }),
  // Beto: guante 3 de 3 fuera (sin entrega anterior conocida).
  row({
    employeeId: 2,
    name: "Beto Gómez",
    code: "200",
    deliveries: 3,
    outOfRange: 3,
  }),
  // Carla: nada fuera de rango (no debe aparecer).
  row({ employeeId: 3, name: "Carla", code: "300", deliveries: 2 }),
];

test.describe("Análisis EPP: ranking fuera de rango", () => {
  test("todos los equipos: totales, porcentaje, equipos y anticipación", () => {
    const ranking = rankEmployees(ROWS);

    expect(ranking.map(({ name }) => name)).toEqual([
      "Beto Gómez",
      "Ana Pérez",
    ]);
    // Empatan en 3: Beto va primero por porcentaje (100 % vs 75 %).
    expect(ranking[1]).toMatchObject({
      outOfRange: 3,
      deliveries: 4,
      percent: 75,
      equipments: [
        { name: "Guante", count: 2 },
        { name: "Bota", count: 1 },
      ],
      // Ponderado por entregas: (10×2 + 40×1) / 3.
      averageDaysEarly: 20,
      lastDelivery: "2026-10-09",
    });
    expect(ranking[0]).toMatchObject({ percent: 100, averageDaysEarly: null });
  });

  test("con un equipo elegido solo cuenta ese equipo", () => {
    const ranking = rankEmployees(ROWS, 10);

    // Beto (3) supera a Ana (2) en guantes.
    expect(ranking.map(({ name, outOfRange }) => [name, outOfRange])).toEqual([
      ["Beto Gómez", 3],
      ["Ana Pérez", 2],
    ]);
    expect(ranking[1].equipments).toEqual([{ name: "Guante", count: 2 }]);
  });

  test("a igual cantidad desempata el porcentaje", () => {
    const ranking = rankEmployees([
      row({ employeeId: 1, name: "A", deliveries: 4, outOfRange: 2 }),
      row({ employeeId: 2, name: "B", deliveries: 2, outOfRange: 2 }),
    ]);
    expect(ranking.map(({ name }) => name)).toEqual(["B", "A"]);
  });

  test("busca por nombre sin acentos ni mayúsculas, o por cédula", () => {
    const ana = rankEmployees(ROWS).find(({ name }) => name === "Ana Pérez")!;
    expect(matchesEmployee(ana, "perez")).toBe(true);
    expect(matchesEmployee(ana, "ANA")).toBe(true);
    expect(matchesEmployee(ana, "100")).toBe(true);
    expect(matchesEmployee(ana, "beto")).toBe(false);
    expect(matchesEmployee(ana, "  ")).toBe(true);
  });
});
