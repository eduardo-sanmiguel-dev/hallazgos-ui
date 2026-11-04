import { useState } from "react";

import { constants } from "@constants";
import {
  getRowsPerPageOptions,
  parseSavedRowsPerPage,
  rowsPerPageStorageKey,
} from "@shared/utils/pagination";
import { trackRowsPerPageChange } from "@shared/utils/rumActions";

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
  const [rowsPerPage, setRowsPerPageState] = useState(() => {
    try {
      const saved = parseSavedRowsPerPage(
        localStorage.getItem(rowsPerPageStorageKey(table)),
        allowAll,
      );
      return saved ?? initial;
    } catch {
      // Sin acceso a localStorage: se queda el valor inicial.
    }
    return initial;
  });

  const setRowsPerPage = (next: number) => {
    if (next === rowsPerPage) return;
    trackRowsPerPageChange(table, rowsPerPage, next);
    setRowsPerPageState(next);
    try {
      localStorage.setItem(rowsPerPageStorageKey(table), String(next));
    } catch {
      // Sin acceso a localStorage: la elección dura solo esta visita.
    }
  };

  return {
    rowsPerPage,
    setRowsPerPage,
    ready: true,
    rowsPerPageOptions: getRowsPerPageOptions(allowAll),
  };
}
