import { describe, expect, test } from "vite-plus/test";

import {
  defaultExportPeriod,
  exportPeriodError,
  initialExportPeriod,
  initialExportPlant,
  parseDdMmYyyy,
} from "../../app/_shared/utils/exportPeriod";

// Período del Excel de hallazgos: mismas reglas que valida la API.

const TODAY = new Date(2026, 10, 10); // 10/11/2026

describe("Período del Excel de hallazgos", () => {
  test("propone los últimos 90 días, con hoy incluido", () => {
    expect(defaultExportPeriod(TODAY)).toEqual({
      startDate: "13/08/2026",
      endDate: "10/11/2026",
    });
  });

  test("solo acepta fechas reales en DD/MM/YYYY", () => {
    expect(parseDdMmYyyy("29/02/2028")?.getDate()).toBe(29);
    expect(parseDdMmYyyy("31/02/2026")).toBeNull();
    expect(parseDdMmYyyy("2026-02-01")).toBeNull();
  });

  test.each([
    [{ startDate: "", endDate: "10/11/2026" }, "Seleccione"],
    [{ startDate: "01/01/2026", endDate: "" }, "Seleccione"],
    [{ startDate: "32/01/2026", endDate: "10/11/2026" }, "fechas válidas"],
    [{ startDate: "02/01/2026", endDate: "01/01/2026" }, "no puede ser mayor"],
    [{ startDate: "01/01/2026", endDate: "01/01/2027" }, "no puede superar 12 meses"],
  ])("rechaza %o", (period, message) => {
    expect(exportPeriodError(period)).toContain(message);
  });

  test("acepta hasta 12 meses exactos y un solo día", () => {
    expect(exportPeriodError({ startDate: "01/01/2026", endDate: "31/12/2026" })).toBeNull();
    expect(exportPeriodError({ startDate: "10/11/2026", endDate: "10/11/2026" })).toBeNull();
  });

  test("parte del período de la lista si es válido; si no, de los últimos 90 días", () => {
    const list = { startDate: "01/10/2026", endDate: "31/10/2026" };
    expect(initialExportPeriod(list, TODAY)).toEqual(list);
    expect(initialExportPeriod({ startDate: "", endDate: "" }, TODAY)).toEqual(
      defaultExportPeriod(TODAY),
    );
    expect(initialExportPeriod({ startDate: "01/01/2020", endDate: "31/10/2026" }, TODAY)).toEqual(
      defaultExportPeriod(TODAY),
    );
  });

  test("planta: la de la lista; con una sola planta, esa; si no, todas", () => {
    expect(initialExportPlant("7", [{ id: 1 }, { id: 7 }])).toBe("7");
    expect(initialExportPlant("", [{ id: 3 }])).toBe("3");
    expect(initialExportPlant("", [{ id: 1 }, { id: 2 }])).toBe("");
  });
});
