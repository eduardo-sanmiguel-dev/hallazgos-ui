import { expect, test } from "@playwright/test";

import {
  getDeadline,
  getPriorityRiskLevel,
} from "../../app/(routes)/hallazgos/_constants/priorityOptions";
import {
  readLastLocation,
  saveLastLocation,
} from "../../app/(routes)/hallazgos/_constants/lastLocation";

// Plazo de un hallazgo para tarjetas y detalle (misma regla que la tabla) y
// última planta y lugar recordados por usuario.

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60_000).toISOString();

test.describe("getDeadline", () => {
  test("abierto o en progreso: días restantes, o vencido con cuántos días", () => {
    expect(
      getDeadline({
        status: "Abierto",
        createdAt: daysAgo(2),
        priorityDays: 30,
      }),
    ).toEqual({ state: "remaining", days: 28 });
    expect(
      getDeadline({
        status: "En progreso",
        createdAt: daysAgo(10),
        priorityDays: 3,
      }),
    ).toEqual({ state: "overdue", days: 7 });
  });

  test("cerrado: en cuántos días se resolvió y si fue a tiempo", () => {
    expect(
      getDeadline({
        status: "Cerrado",
        createdAt: daysAgo(6),
        solutionDate: daysAgo(3),
        priorityDays: 2,
      }),
    ).toEqual({ state: "resolved", days: 3, isOnTime: false, daysLate: 1 });
  });

  test("sin prioridad o cancelado: sin plazo", () => {
    expect(
      getDeadline({
        status: "Abierto",
        createdAt: daysAgo(1),
        priorityDays: null,
      }),
    ).toBeNull();
    expect(
      getDeadline({
        status: "Cancelado",
        createdAt: daysAgo(1),
        priorityDays: 8,
      }),
    ).toBeNull();
  });

  test("nivel de riesgo de la prioridad (para el tono del detalle)", () => {
    expect(getPriorityRiskLevel(2)).toBe("Critico");
    expect(getPriorityRiskLevel(30)).toBe("Bajo");
    expect(getPriorityRiskLevel(5)).toBeNull();
    expect(getPriorityRiskLevel(null)).toBeNull();
  });
});

test.describe("Última planta y lugar", () => {
  const store = new Map<string, string>();

  test.beforeEach(() => {
    store.clear();
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    };
  });

  test.afterAll(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  test("se guarda por usuario: otro usuario del mismo celular no lo ve", () => {
    saveLastLocation(7, { manufacturingPlantId: "1", zoneId: "12" });

    expect(readLastLocation(7)).toEqual({
      manufacturingPlantId: "1",
      zoneId: "12",
    });
    expect(readLastLocation(8)).toBeNull();
  });

  test("un valor dañado o sin almacenamiento no rompe el formulario", () => {
    store.set("hallazgos:ultimo-lugar:7", "{no es json");
    expect(readLastLocation(7)).toBeNull();

    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("bloqueado");
      },
    };
    expect(readLastLocation(7)).toBeNull();
    expect(() =>
      saveLastLocation(7, { manufacturingPlantId: "1", zoneId: "2" }),
    ).not.toThrow();
  });
});
