import { createFilterOptions, type FilterOptionsState } from "@mui/material";

/**
 * Máximo de opciones que dibuja un autocompletado. MUI dibuja todas las que
 * coinciden: con los colaboradores de una planta (hasta ~950) abrir la lista
 * o teclear se sentía lento en celular. Con más coincidencias, la última
 * fila avisa cuántas faltan y pide escribir para afinar.
 */
export const AUTOCOMPLETE_OPTION_LIMIT = 100;

const MORE_OPTIONS_ID = "__mas-opciones__";

interface MoreOptions {
  id: typeof MORE_OPTIONS_ID;
  name: string;
}

/** La fila "…y N más": se muestra deshabilitada y no se puede elegir. */
export const isMoreOptions = (option: unknown): boolean =>
  (option as { id?: unknown } | null)?.id === MORE_OPTIONS_ID;

/**
 * `filterOptions` para un Autocomplete de MUI: filtra igual que el de
 * fábrica (por la etiqueta, sin distinguir mayúsculas) y corta en `limit`.
 */
export const limitedFilterOptions = <T>(limit = AUTOCOMPLETE_OPTION_LIMIT) => {
  const filter = createFilterOptions<T>();

  return (options: T[], state: FilterOptionsState<T>): T[] => {
    const matches = filter(options, state);
    if (matches.length <= limit) return matches;

    const more: MoreOptions = {
      id: MORE_OPTIONS_ID,
      name: `…y ${matches.length - limit} más. Escribe para afinar la búsqueda.`,
    };
    return [...matches.slice(0, limit), more as T];
  };
};
