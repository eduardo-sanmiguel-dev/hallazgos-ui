import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { DashboardService } from "@services";

import type { DashboardFilters } from "./DashboardFiltersBar";

/** Planta y periodo completos: sin ellos no se consulta ninguna gráfica. */
export const hasCompleteFilters = (filters: DashboardFilters) =>
  !!filters.manufacturingPlantId && !!filters.startDate && !!filters.endDate;

// Hallazgos por estatus con los filtros del dashboard. Es la gráfica de
// estatus y, con su total, decide el estado de la pantalla (sin hallazgos o
// error: un solo aviso en lugar de uno por gráfica). Una sola petición: la
// gráfica y la página comparten la caché. Al cambiar un filtro se conserva el
// resultado anterior hasta tener el nuevo, para no vaciar la pantalla.
export const useDashboardSummary = (filters: DashboardFilters) => {
  const params = {
    manufacturingPlantId: filters.manufacturingPlantId,
    startDate: filters.startDate,
    endDate: filters.endDate,
    ...(filters.areaIds.length > 0 && { areaIds: filters.areaIds }),
    ...(filters.responsibleIds.length > 0 && {
      responsibleIds: filters.responsibleIds,
    }),
    ...(filters.mainTypeIds.length > 0 && {
      mainTypeIds: filters.mainTypeIds,
    }),
  };

  return useQuery({
    queryKey: ["dashboard", "status-by-filters", params],
    queryFn: () => DashboardService.findStatusByFilters(params),
    enabled: hasCompleteFilters(filters),
    placeholderData: keepPreviousData,
  });
};
