import { openobserveRum } from "@openobserve/browser-rum";

import { rowsPerPageActionContext } from "@shared/utils/pagination";
import { mutationAction } from "./rumActionNames";

export const trackSystemResult = (
  baseURL: string,
  url: string,
  method: string,
  result: "success" | "error",
  status?: number,
  replayed = false,
) => {
  try {
    const action = mutationAction(baseURL, url, method);
    if (!action) return;
    openobserveRum.addAction(
      `${action.module} · ${action.operation} · ${result === "success" ? "Confirmado por servidor" : "Intento fallido"}`,
      {
        ui_module: action.module,
        operation: action.operation,
        result,
        ...(status !== undefined && { http_status: status }),
        replayed,
      },
    );
  } catch {
    // Observability must never change the outcome of the user's operation.
  }
};

/**
 * Registra en el RUM el tamaño de página elegido (el clic en la opción del
 * selector no queda con nombre). Sin RUM iniciado (desarrollo, bots) el SDK
 * ignora la llamada; un fallo del monitoreo nunca afecta la tabla.
 */
export const trackRowsPerPageChange = (table: string, previous: number, rowsPerPage: number) => {
  try {
    openobserveRum.addAction(
      "filas_por_pagina",
      rowsPerPageActionContext(table, previous, rowsPerPage),
    );
  } catch {
    // Sin monitoreo: no hay nada que registrar.
  }
};
