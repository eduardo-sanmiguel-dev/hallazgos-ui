import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { DashboardService } from "@services";

import type { DashboardFilters } from "./DashboardFiltersBar";

// La consulta solo usa planta, fechas y filtros (no el atajo del periodo).
type SummaryFilters = Pick<
  DashboardFilters,
  | "manufacturingPlantId"
  | "startDate"
  | "endDate"
  | "areaIds"
  | "responsibleIds"
  | "mainTypeIds"
>;

/** Planta y periodo completos: sin ellos no se consulta ninguna gráfica. */
export const hasCompleteFilters = (filters: SummaryFilters) =>
  !!filters.manufacturingPlantId && !!filters.startDate && !!filters.endDate;

/** Parámetros de las consultas del dashboard (las listas vacías no se envían). */
const queryParams = (filters: SummaryFilters) => ({
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
});

export type DashboardQueryParams = ReturnType<typeof queryParams>;

/**
 * Datos de una gráfica con los filtros del dashboard: ["dashboard", name,
 * parámetros]. Sin planta y periodo no se consulta (data undefined). Al
 * cambiar un filtro se conserva el resultado anterior hasta tener el nuevo,
 * para no vaciar la gráfica.
 */
export const useDashboardQuery = <T>(
  name: string,
  fetcher: (params: DashboardQueryParams) => Promise<T>,
  filters: SummaryFilters,
) => {
  const params = queryParams(filters);
  const enabled = hasCompleteFilters(filters);

  const query = useQuery({
    queryKey: ["dashboard", name, params],
    queryFn: () => fetcher(params),
    enabled,
    placeholderData: keepPreviousData,
  });

  // Filtros incompletos: sin datos (antes la gráfica se vaciaba igual).
  return enabled ? query : { ...query, data: undefined };
};

// Hallazgos por estatus con los filtros del dashboard. Es la gráfica de
// estatus y, con su total, decide el estado de la pantalla (sin hallazgos o
// error: un solo aviso en lugar de uno por gráfica). Una sola petición: la
// gráfica y la página comparten la caché.
export const useDashboardSummary = (filters: SummaryFilters) =>
  useDashboardQuery(
    "status-by-filters",
    DashboardService.findStatusByFilters,
    filters,
  );
