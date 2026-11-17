import { describe, expect, test } from "vite-plus/test";

import {
  directionLabel,
  headerSortHint,
  naturalOrder,
  nextHeaderSort,
  parseSavedSort,
  sortActionContext,
  sortQueryParams,
  sortStorageKey,
  sortSummary,
  type SortOption,
  type SortState,
} from "../../app/_shared/utils/tableSort";

// Lógica pura del orden de tablas (useTableSort, FilterBar y encabezados),
// sin navegador. El comportamiento en pantalla está en e2e/table-sort.spec.ts.

const OPTIONS: SortOption[] = [
  { key: "id", label: "ID", kind: "number" },
  { key: "name", label: "Nombre", kind: "text" },
  { key: "createdAt", label: "Fecha de creación", kind: "date" },
  { key: "isActive", label: "Estado", kind: "status" },
  { key: "isAdditional", label: "Adicional", kind: "boolean" },
];
const DEFAULT: SortState = { orderBy: "id", order: "desc" };

describe("Orden: textos legibles", () => {
  test("la dirección se nombra según el tipo de dato", () => {
    expect(directionLabel("text", "asc")).toBe("A → Z");
    expect(directionLabel("text", "desc")).toBe("Z → A");
    expect(directionLabel("number", "desc")).toBe("Mayor a menor");
    expect(directionLabel("date", "desc")).toBe("Más reciente primero");
    expect(directionLabel("date", "asc")).toBe("Más antiguo primero");
    expect(directionLabel("status", "desc")).toBe("Activos primero");
    expect(directionLabel("boolean", "desc")).toBe("Sí primero");
  });

  test("resumen para la referencia de la barra de filtros", () => {
    expect(sortSummary({ orderBy: "createdAt", order: "desc" }, OPTIONS)).toBe(
      "Fecha de creación · Más reciente primero",
    );
    expect(sortSummary({ orderBy: "otra", order: "asc" }, OPTIONS)).toBe("");
  });
});

describe("Orden: clic en el encabezado", () => {
  test("otra columna empieza en su dirección natural", () => {
    expect(naturalOrder("text")).toBe("asc");
    expect(naturalOrder("date")).toBe("desc");
    expect(nextHeaderSort(DEFAULT, "name", "text", DEFAULT)).toEqual({
      orderBy: "name",
      order: "asc",
    });
    expect(nextHeaderSort(DEFAULT, "createdAt", "date", DEFAULT)).toEqual({
      orderBy: "createdAt",
      order: "desc",
    });
  });

  test("tres pasos: natural, contraria y vuelta al predeterminado", () => {
    const first = nextHeaderSort(DEFAULT, "name", "text", DEFAULT);
    const second = nextHeaderSort(first, "name", "text", DEFAULT);
    const third = nextHeaderSort(second, "name", "text", DEFAULT);

    expect(second).toEqual({ orderBy: "name", order: "desc" });
    expect(third).toEqual(DEFAULT);
  });

  test("la columna predeterminada solo alterna su dirección", () => {
    const flipped = nextHeaderSort(DEFAULT, "id", "number", DEFAULT);
    expect(flipped).toEqual({ orderBy: "id", order: "asc" });
    expect(nextHeaderSort(flipped, "id", "number", DEFAULT)).toEqual(DEFAULT);
  });

  test("el tooltip anticipa lo que hará el clic", () => {
    const [, name] = OPTIONS;
    expect(headerSortHint(name, DEFAULT, DEFAULT)).toBe("Ordenar por Nombre: A → Z");
    expect(headerSortHint(name, { orderBy: "name", order: "desc" }, DEFAULT)).toBe(
      "Restablecer el orden predeterminado",
    );
  });
});

describe("Orden: valor guardado en la sesión", () => {
  test("clave por tabla", () => {
    expect(sortStorageKey("areas")).toBe("orden-tabla:areas");
  });

  test("acepta un orden vigente para la tabla", () => {
    expect(parseSavedSort('{"orderBy":"name","order":"desc"}', OPTIONS)).toEqual({
      orderBy: "name",
      order: "desc",
    });
  });

  test.each([
    ["vacío", null],
    ["JSON inválido", "{"],
    ["columna que ya no existe", '{"orderBy":"password","order":"asc"}'],
    ["dirección inválida", '{"orderBy":"name","order":"up"}'],
  ])("descarta un valor %s", (_case, saved) => {
    expect(parseSavedSort(saved, OPTIONS)).toBeNull();
  });
});

describe("Orden: parámetros y RUM", () => {
  test("solo envía orderBy/order si hay columna", () => {
    expect(sortQueryParams({ orderBy: "name", order: "asc" })).toEqual({
      orderBy: "name",
      order: "asc",
    });
    expect(sortQueryParams({})).toEqual({});
  });

  test("contexto de la acción orden_tabla", () => {
    expect(sortActionContext("areas", DEFAULT, { orderBy: "name", order: "asc" })).toEqual({
      tabla: "areas",
      columna: "name",
      direccion: "asc",
      anterior: "id:desc",
    });
  });
});
