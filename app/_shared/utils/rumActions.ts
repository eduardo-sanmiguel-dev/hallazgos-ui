import { openobserveRum } from "@openobserve/browser-rum";

import { rowsPerPageActionContext } from "@shared/utils/pagination";

/**
 * Registra en el RUM el tamaño de página elegido (el clic en la opción del
 * selector no queda con nombre). Sin RUM iniciado (desarrollo, bots) el SDK
 * ignora la llamada; un fallo del monitoreo nunca afecta la tabla.
 */
export const trackRowsPerPageChange = (
  table: string,
  previous: number,
  rowsPerPage: number,
) => {
  try {
    openobserveRum.addAction(
      "filas_por_pagina",
      rowsPerPageActionContext(table, previous, rowsPerPage),
    );
  } catch {
    // Sin monitoreo: no hay nada que registrar.
  }
};
