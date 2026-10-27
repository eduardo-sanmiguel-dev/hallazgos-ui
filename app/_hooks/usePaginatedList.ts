import { useState } from "react";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";

import type { ServerPagination } from "@shared/components/TableDefaultServer";
import { useRowsPerPage } from "./useRowsPerPage";

export interface PaginatedResponse<TItem> {
  data: TItem[];
  count: number;
}

export interface PaginationParams {
  /** 1-based, como lo espera la API. */
  page: number;
  /** -1 = todos. */
  limit: number;
}

interface Options<TFilters, TItem> {
  /** Nombre de la lista; también sirve para invalidarla: ["list", key]. */
  key: string;
  filters: TFilters;
  /**
   * Pide la página a la API. Recibe los filtros ya "debounceados"; si hay
   * que transformarlos (fechas, números…), hacerlo aquí.
   */
  fetcher: (
    filters: TFilters,
    pagination: PaginationParams,
  ) => Promise<PaginatedResponse<TItem>>;
  initialRowsPerPage?: number;
  /** Ofrece "Todos" en el selector de filas (solo catálogos chicos). */
  allowAllRows?: boolean;
  debounceMs?: number;
  /** Valida los filtros efectivos tras el debounce antes de pedir datos. */
  enabled?: boolean | ((filters: TFilters) => boolean);
}

const EMPTY_ROWS: never[] = [];

/**
 * Lista paginada en la API con React Query:
 * - Debounce de filtros (no se pide en cada tecla).
 * - Cambiar un filtro vuelve a la página 1 sin una petición intermedia.
 * - Conserva la página anterior mientras llega la nueva (sin parpadeo).
 * - Solo se muestra la respuesta de los filtros vigentes: una respuesta lenta
 *   de filtros viejos nunca pisa a la actual.
 * - Al volver a la pantalla muestra lo que había y revalida en segundo plano.
 */
export function usePaginatedList<TFilters, TItem>({
  key,
  filters,
  fetcher,
  initialRowsPerPage,
  allowAllRows = false,
  debounceMs = 500,
  enabled = true,
}: Options<TFilters, TItem>) {
  const [debouncedFilters] = useDebounce(filters, debounceMs);
  const filtersKey = JSON.stringify(debouncedFilters);
  // Mientras el debounce conserva filtros anteriores, no consultar ni
  // recargar esa consulta por paginación, foco de ventana o refresh.
  const filtersAreCurrent = filtersKey === JSON.stringify(filters);
  const canQuery =
    filtersAreCurrent &&
    (typeof enabled === "function" ? enabled(debouncedFilters) : enabled);
  // Filas por página recordadas por tabla; se espera a leerlas para no
  // pedir dos veces la primera página.
  const {
    rowsPerPage,
    setRowsPerPage: saveRowsPerPage,
    ready: rowsPerPageReady,
    rowsPerPageOptions,
  } = useRowsPerPage(key, {
    allowAll: allowAllRows,
    initial: initialRowsPerPage,
  });
  const isEnabled = canQuery && rowsPerPageReady;

  // La página se guarda junto a los filtros con los que se eligió: si los
  // filtros cambian, la página efectiva vuelve a 0 en el mismo render.
  const [pagination, setPagination] = useState({ page: 0, filtersKey });

  const page = pagination.filtersKey === filtersKey ? pagination.page : 0;

  const setPage = (nextPage: number) =>
    setPagination({ page: nextPage, filtersKey });

  const setRowsPerPage = (nextRowsPerPage: number) => {
    saveRowsPerPage(nextRowsPerPage);
    setPagination({ page: 0, filtersKey });
  };

  const query = useQuery({
    queryKey: ["list", key, debouncedFilters, page, rowsPerPage],
    queryFn: () =>
      fetcher(debouncedFilters, { page: page + 1, limit: rowsPerPage }),
    placeholderData: keepPreviousData,
    // Las listas siempre se revalidan al volver a la pantalla (pudo crearse
    // o editarse algo); mientras, se muestra lo que había.
    staleTime: 0,
    enabled: isEnabled,
  });

  const count = query.data?.count ?? 0;

  return {
    rows: query.data?.data ?? EMPTY_ROWS,
    count,
    /** Listo para `<TableDefaultServer {...pagination} />`. */
    pagination: {
      page,
      setPage,
      rowsPerPage,
      setRowsPerPage,
      rowsPerPageOptions,
      count,
      isFetching: query.isFetching && !query.isPending,
      isError: query.isError,
      onRetry: () => {
        if (isEnabled) query.refetch();
      },
    } satisfies ServerPagination,
    /** Primera carga (aún no hay datos que mostrar). */
    isLoading: query.isPending && canQuery,
    /** Cualquier petición en curso, incluida una recarga con datos visibles. */
    isFetching: query.isFetching,
    /** Vuelve a pedir la página actual (p. ej. tras eliminar un registro). */
    refresh: () => (isEnabled ? query.refetch() : undefined),
  };
}
