import { expect, test } from "@playwright/test";

import {
  getRowsPerPageOptions,
  parseSavedRowsPerPage,
  rowsPerPageActionContext,
  rowsPerPageLabel,
  rowsPerPageStorageKey,
} from "../../app/_shared/utils/pagination";

// Lógica pura de "Filas por página" (useRowsPerPage), sin navegador. El
// comportamiento en pantalla está en e2e/pagination.spec.ts.

test.describe("Paginación: opciones", () => {
  test("ofrece 10, 25 y 50, sin el 5 de antes", () => {
    expect(getRowsPerPageOptions()).toEqual([10, 25, 50]);
  });

  test("agrega Todos (-1) solo si se permite", () => {
    expect(getRowsPerPageOptions(true)).toEqual([
      10,
      25,
      50,
      { label: "Todos", value: -1 },
    ]);
  });

  test("cada llamada devuelve un arreglo nuevo (no comparte las constantes)", () => {
    const options = getRowsPerPageOptions();
    options.push(99);
    expect(getRowsPerPageOptions()).toEqual([10, 25, 50]);
  });
});

test.describe("Paginación: valor guardado", () => {
  test("acepta las opciones vigentes", () => {
    for (const saved of ["10", "25", "50"]) {
      expect(parseSavedRowsPerPage(saved)).toBe(Number(saved));
    }
  });

  test("Todos solo vale en tablas que lo ofrecen", () => {
    expect(parseSavedRowsPerPage("-1", true)).toBe(-1);
    expect(parseSavedRowsPerPage("-1")).toBeNull();
  });

  test("descarta vacíos, basura y opciones que ya no existen", () => {
    for (const saved of [null, "", "abc", "5", "100", "0", "10.5", " "]) {
      expect(parseSavedRowsPerPage(saved, true)).toBeNull();
    }
  });

  test("la clave es distinta por tabla", () => {
    expect(rowsPerPageStorageKey("users")).toBe("filas-por-pagina:users");
    expect(rowsPerPageStorageKey("evidences")).not.toBe(
      rowsPerPageStorageKey("users"),
    );
  });
});

test.describe("Paginación: acción del RUM", () => {
  test("etiqueta Todos en lugar de -1", () => {
    expect(rowsPerPageLabel(-1)).toBe("Todos");
    expect(rowsPerPageLabel(25)).toBe("25");
  });

  test("envía tabla, filas elegidas y las anteriores", () => {
    expect(rowsPerPageActionContext("users", 10, 25)).toEqual({
      tabla: "users",
      filas: "25",
      anterior: "10",
    });
    expect(rowsPerPageActionContext("zones", 50, -1)).toEqual({
      tabla: "zones",
      filas: "Todos",
      anterior: "50",
    });
  });
});
