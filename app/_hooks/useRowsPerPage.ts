import { useState } from "react";

import { constants } from "@constants";
import {
  getRowsPerPageOptions,
  parseSavedRowsPerPage,
  rowsPerPageStorageKey,
} from "@shared/utils/pagination";
import { trackRowsPerPageChange } from "@shared/utils/rumActions";

// Acceso a localStorage fuera del hook: React Compiler no optimiza un hook
// con valores condicionales dentro de try/catch (y entonces lo que devuelve es
// nuevo en cada render).
const readSaved = (table: string, allowAll: boolean) => {
  try {
    return parseSavedRowsPerPage(localStorage.getItem(rowsPerPageStorageKey(table)), allowAll);
  } catch {
    // Sin acceso a localStorage: se queda el valor inicial.
    return null;
  }
};

const save = (table: string, rowsPerPage: number) => {
  try {
    localStorage.setItem(rowsPerPageStorageKey(table), String(rowsPerPage));
  } catch {
    // Sin acceso a localStorage: la elección dura solo esta visita.
  }
};

interface Options {
  /** Agrega "Todos" (solo catálogos chicos). */
  allowAll?: boolean;
  initial?: number;
}

/**
 * Filas por página de una tabla: empieza en 10 y recuerda en este navegador
 * lo que eligió el usuario, por tabla. En la SPA la preferencia se lee al
 * inicializar el estado, antes de consultar: no se pide primero 10 filas y
 * luego el valor guardado.
 */
export function useRowsPerPage(
  table: string,
  { allowAll = false, initial = constants.pagination.defaultRowsPerPage }: Options = {},
) {
  const [rowsPerPage, setRowsPerPageState] = useState(() => readSaved(table, allowAll) ?? initial);

  const setRowsPerPage = (next: number) => {
    if (next === rowsPerPage) return;
    trackRowsPerPageChange(table, rowsPerPage, next);
    setRowsPerPageState(next);
    save(table, next);
  };

  return {
    rowsPerPage,
    setRowsPerPage,
    ready: true,
    rowsPerPageOptions: getRowsPerPageOptions(allowAll),
  };
}
