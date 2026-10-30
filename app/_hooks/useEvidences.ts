import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { FiltersEvidences } from "@routes/hallazgos/_components/FiltersEvidence";
import { EvidencesService } from "@services";
import type { EvidenceRow } from "@interfaces";
import { useRowsPerPage } from "./useRowsPerPage";

const EMPTY_ROWS: EvidenceRow[] = [];

/**
 * Lista de hallazgos (GET /evidences) con los filtros, la página y las filas
 * por página. Se vuelve a pedir sola al cambiar cualquiera de ellos; una
 * respuesta vieja que llegue tarde no pisa a la vigente.
 */
export const useEvidences = (filters: FiltersEvidences) => {
  const [page, setPage] = useState(0);
  // Sin "Todos": son miles de hallazgos.
  const {
    rowsPerPage,
    setRowsPerPage,
    ready: rowsPerPageReady,
  } = useRowsPerPage("evidences");

  const query = useQuery({
    queryKey: ["list", "evidences", filters, page, rowsPerPage],
    queryFn: () =>
      EvidencesService.findPaginated(filters, {
        page: page + 1,
        limit: rowsPerPage,
      }),
    // Hasta leer las filas por página guardadas: evita pedir dos veces.
    enabled: rowsPerPageReady,
    // Siempre lo último al volver a la pantalla, sin recargar (ni mostrar el
    // esqueleto) al regresar a la pestaña.
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  return {
    /** Vuelve a pedir la página actual (botón Recargar, tras una acción). */
    refresh: () => void query.refetch(),
    isLoading: query.isFetching,
    // La consulta falló: la página muestra ErrorState con "Reintentar".
    isError: query.isError && !query.isFetching,
    evidences: query.data?.data ?? EMPTY_ROWS,
    countEvidence: query.data?.count ?? 0,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  };
};
