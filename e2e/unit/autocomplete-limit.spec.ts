import { describe, expect, test } from "vite-plus/test";

import {
  AUTOCOMPLETE_OPTION_LIMIT,
  isMoreOptions,
  limitedFilterOptions,
} from "../../app/_shared/utils/autocompleteLimit";

// Autocompletados: como mucho 100 opciones dibujadas; con más, una última
// fila (deshabilitada) dice cuántas faltan.

type Option = { id: number; name: string };

const options: Option[] = Array.from({ length: 250 }, (_, i) => ({
  id: i + 1,
  name: `Colaborador ${String(i + 1).padStart(3, "0")}`,
}));

const filterWith = (inputValue: string, limit?: number) =>
  limitedFilterOptions<Option>(limit)(options, {
    inputValue,
    getOptionLabel: (option) => option.name,
  });

describe("limitedFilterOptions", () => {
  test("sin escribir muestra 100 y avisa cuántas faltan", () => {
    const shown = filterWith("");
    expect(AUTOCOMPLETE_OPTION_LIMIT).toBe(100);
    expect(shown).toHaveLength(101);
    expect(shown.slice(0, 100).map(({ id }) => id)).toEqual(
      Array.from({ length: 100 }, (_, i) => i + 1),
    );
    const last = shown[100];
    expect(isMoreOptions(last)).toBe(true);
    expect(last.name).toBe("…y 150 más. Escribe para afinar la búsqueda.");
  });

  test("al escribir filtra por la etiqueta, sin distinguir mayúsculas", () => {
    expect(filterWith("colaborador 249").map(({ id }) => id)).toEqual([249]);
  });

  test("hasta el límite no agrega el aviso", () => {
    // 100-199: exactamente 100 coincidencias.
    const exact = filterWith("Colaborador 1");
    expect(exact).toHaveLength(100);
    expect(exact.some(isMoreOptions)).toBe(false);
    const few = filterWith("Colaborador 00");
    expect(few).toHaveLength(9);
    expect(few.some(isMoreOptions)).toBe(false);
  });

  test("el límite se puede ajustar", () => {
    const shown = filterWith("", 10);
    expect(shown).toHaveLength(11);
    expect(shown[10].name).toBe("…y 240 más. Escribe para afinar la búsqueda.");
  });

  test("solo la fila del aviso cuenta como 'más opciones'", () => {
    expect(isMoreOptions(options[0])).toBe(false);
    expect(isMoreOptions(null)).toBe(false);
  });
});
