import { hashKey } from "@tanstack/react-query";
import { describe, expect, test } from "vite-plus/test";

import { catalogKeys, catalogParams } from "../../app/_shared/libs/catalogKeys";

// La llave de un catálogo sigue a la petición: filtros vacíos (que los
// servicios no mandan) no crean otra entrada de caché ni otra petición.

describe("catalogParams", () => {
  test("quita lo que el servicio no manda a la URL", () => {
    expect(
      catalogParams({
        manufacturingPlantId: "",
        zoneIds: [],
        name: undefined,
        areaId: null,
        withArea: false,
        page: 0,
        processNames: ["Producción"],
      }),
    ).toEqual({ withArea: false, page: 0, processNames: ["Producción"] });
  });

  test("sin filtros, objeto vacío", () => {
    expect(catalogParams()).toEqual({});
  });
});

describe("catalogKeys", () => {
  test("la misma petición comparte llave aunque los filtros vacíos difieran", () => {
    expect(hashKey(catalogKeys.areas({ manufacturingPlantId: "" }))).toBe(
      hashKey(catalogKeys.areas()),
    );
    expect(hashKey(catalogKeys.users({ manufacturingPlantId: "4", zoneIds: [] }))).toBe(
      hashKey(catalogKeys.users({ manufacturingPlantId: "4" })),
    );
  });

  test("filtros distintos siguen siendo llaves distintas", () => {
    expect(hashKey(catalogKeys.users({ manufacturingPlantId: "4" }))).not.toBe(
      hashKey(catalogKeys.users({ manufacturingPlantId: "5" })),
    );
  });

  test("se invalidan por prefijo de catálogo", () => {
    expect(catalogKeys.zones({ manufacturingPlantId: "1" }).slice(0, 2)).toEqual([
      "catalogs",
      "zones",
    ]);
  });
});
