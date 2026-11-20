import { useEffect } from "react";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

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
  | "states"
>;

/** Planta y periodo completos: sin ellos no se consulta ninguna gráfica. */
export const hasCompleteFilters = (filters: SummaryFilters) =>
  !!filters.manufacturingPlantId && !!filters.startDate && !!filters.endDate;

/** Parámetros de las consultas del dashboard (las listas vacías no se envían). */
const queryParams = (filters: SummaryFilters) => ({
  manufacturingPlantId: filters.manufacturingPlantId,
  startDate: filters.startDate,
  endDate: filters.endDate,
  ...(filters.states.length > 0 && { states: filters.states }),
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
  useDashboardQuery("status-by-filters", DashboardService.findStatusByFilters, filters);

/**
 * Consulta de cada gráfica (nombre de su llave → servicio). Una sola lista
 * para las gráficas y para la precarga: así la llave es siempre la misma.
 */
export const DASHBOARD_CHART_QUERIES = {
  areas: DashboardService.findAreasByFilters,
  "main-types": DashboardService.findMainTypesByFilters,
  "solid-gauge-kpi": DashboardService.findSolidGaugeKpiByFilters,
  "priority-intervention": DashboardService.findPriorityInterventionByFilters,
  "risk-level": DashboardService.findRiskLevelByFilters,
  "area-range-line": DashboardService.findAreaRangeLineByFilters,
  "packed-bubble": DashboardService.findPackedBubbleByFilters,
  sankey: DashboardService.findSankeyByFilters,
  "assigned-responsibles": DashboardService.findAssignedResponsiblesByFilters,
} as const;

export type DashboardChartName = keyof typeof DASHBOARD_CHART_QUERIES;

/** Respuesta de la consulta de la gráfica `N`. */
type ChartData<N extends DashboardChartName> = Awaited<
  ReturnType<(typeof DASHBOARD_CHART_QUERIES)[N]>
>;

/** Datos de una gráfica con los filtros del dashboard. */
export const useDashboardChart = <N extends DashboardChartName>(name: N, filters: SummaryFilters) =>
  useDashboardQuery<ChartData<N>>(
    name,
    DASHBOARD_CHART_QUERIES[name] as (params: DashboardQueryParams) => Promise<ChartData<N>>,
    filters,
  );

/**
 * Pide los datos de las gráficas a la vez que el resumen. Las gráficas se
 * montan cuando llega el resumen (y solo si hay hallazgos), y hasta entonces
 * no pedían sus datos: un viaje de ida y vuelta más en la primera carga. Si
 * al montarse su consulta sigue en camino, React Query la reutiliza; si el
 * periodo no tiene hallazgos, esas consultas no se usan.
 */
export const usePrefetchDashboardCharts = (filters: SummaryFilters, enabled: boolean) => {
  const queryClient = useQueryClient();
  const active = enabled && hasCompleteFilters(filters);
  // Llave estable: los filtros llegan como objeto nuevo en cada render.
  const paramsKey = JSON.stringify(queryParams(filters));

  useEffect(() => {
    if (!active) return;
    const params = JSON.parse(paramsKey) as DashboardQueryParams;
    for (const [name, fetcher] of Object.entries(DASHBOARD_CHART_QUERIES)) {
      const fetchChart = fetcher as (params: DashboardQueryParams) => Promise<unknown>;
      void queryClient.prefetchQuery({
        queryKey: ["dashboard", name, params],
        queryFn: () => fetchChart(params),
      });
    }
  }, [queryClient, active, paramsKey]);
};
