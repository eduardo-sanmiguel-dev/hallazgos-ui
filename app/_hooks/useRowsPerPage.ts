import { useEffect, useState } from "react";

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
 * lo que eligió el usuario, por tabla. La preferencia se lee tras montar (en
 * el servidor no hay localStorage y rompería la hidratación); hasta entonces
 * `ready` es false y las listas esperan, para no pedir primero 10 filas y
 * luego las guardadas.
 */
export function useRowsPerPage(
  table: string,
  {
    allowAll = false,
    initial = constants.pagination.defaultRowsPerPage,
  }: Options = {},
) {
  const [rowsPerPage, setRowsPerPageState] = useState(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = parseSavedRowsPerPage(
        localStorage.getItem(rowsPerPageStorageKey(table)),
        allowAll,
      );
      if (saved !== null) setRowsPerPageState(saved);
    } catch {
      // Sin acceso a localStorage: se queda el valor inicial.
    }
    setReady(true);
  }, [table, allowAll]);

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
    ready,
    rowsPerPageOptions: getRowsPerPageOptions(allowAll),
  };
}
