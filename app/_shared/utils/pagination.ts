import { constants } from "@constants";

const { rowsPerPageOptions, allRows } = constants.pagination;

export type RowsPerPageOption = number | { label: string; value: number };

/** Opciones del selector "Filas por página". */
export const getRowsPerPageOptions = (allowAll = false): RowsPerPageOption[] =>
  allowAll
    ? [...rowsPerPageOptions, { label: "Todos", value: allRows }]
    : [...rowsPerPageOptions];

/** Clave de localStorage con las filas por página elegidas en una tabla. */
export const rowsPerPageStorageKey = (table: string) =>
  `filas-por-pagina:${table}`;

/**
 * Valor guardado → filas por página, o null si no sirve: vacío, no numérico
 * o una opción que ya no existe (p. ej. el 5 de antes, o "Todos" en una
 * tabla que no lo ofrece).
 */
export const parseSavedRowsPerPage = (
  saved: string | null,
  allowAll = false,
): number | null => {
  if (!saved) return null;
  const value = Number(saved);
  const allowed = [...rowsPerPageOptions, ...(allowAll ? [allRows] : [])];
  return allowed.includes(value) ? value : null;
};

/** Texto de un tamaño de página para el RUM ("Todos" en vez de -1). */
export const rowsPerPageLabel = (value: number) =>
  value === allRows ? "Todos" : String(value);

/** Contexto de la acción "filas_por_pagina" que se envía al RUM. */
export const rowsPerPageActionContext = (
  table: string,
  previous: number,
  rowsPerPage: number,
) => ({
  tabla: table,
  filas: rowsPerPageLabel(rowsPerPage),
  anterior: rowsPerPageLabel(previous),
});
