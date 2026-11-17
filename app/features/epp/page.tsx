import { useEffect, useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { Button, Grid } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import DialogCreateEpp from "./_components/DialogCreateEpp";
import TableEpps, { EPP_DEFAULT_SORT, EPP_SORT_OPTIONS } from "./_components/TableEpps";
import FiltersEpp, { DEFAULT_FILTERS_EPP, type IFiltersEpp } from "./_components/FiltersEpp";
import { useIdempotencyKey, usePaginatedList, useTableSort } from "@hooks";
import { useUserSessionStore } from "@store";
import { EppService } from "@services";
import { EppSortableColumn } from "@interfaces";
import { notify } from "@shared/utils";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";

export default function EppPage() {
  const manufacturingPlants = useUserSessionStore((state) => state.manufacturingPlants);
  const [open, setOpen] = useState<boolean>(false);
  const [manufacturingPlantId, setManufacturingPlantId] = useState<string>("");
  const sort = useTableSort("epp", EPP_SORT_OPTIONS, EPP_DEFAULT_SORT);
  const [filters, setFilters] = useState<IFiltersEpp>(DEFAULT_FILTERS_EPP);
  // Una clave por entrega: un reintento tras un corte no la duplica.
  const submission = useIdempotencyKey();

  // Planta, filtros y orden forman la consulta: cualquier cambio vuelve a la
  // página 1 y las respuestas viejas se descartan (usePaginatedList).
  const {
    rows,
    count,
    pagination: { page, setPage, rowsPerPage, setRowsPerPage, isFetching, isError, onRetry },
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "epp",
    filters: { manufacturingPlantId, ...filters },
    sort: sort.sort,
    fetcher: (query, { page, limit, orderBy, order }) =>
      EppService.findPaginated({
        ...query,
        page,
        limit,
        orderBy: orderBy as EppSortableColumn | undefined,
        order,
      }),
    debounceMs: 400,
    // La planta seleccionada debe estar también en los filtros del debounce.
    enabled: (query) =>
      !!query.manufacturingPlantId && query.manufacturingPlantId === manufacturingPlantId,
  });

  // Si la página quedó vacía (p. ej. se borró el último registro), ir a la
  // última con datos.
  useEffect(() => {
    if (!rows.length && count > 0 && page > 0) {
      setPage(Math.max(0, Math.ceil(count / rowsPerPage) - 1));
    }
  }, [rows, count, page, rowsPerPage, setPage]);

  const createMutation = useMutation({
    mutationFn: (form: Parameters<typeof EppService.create>[0]) =>
      EppService.create(form, { idempotencyKey: submission.key() }),
    onSuccess: () => {
      submission.settle();
      // Antes se cerraba sin avisar: no quedaba claro si se guardó.
      notify("Entrega de EPP registrada correctamente", true);
      setOpen(false);
      return getData();
    },
    onError: (error) => submission.settle(error),
  });

  return (
    <>
      <DialogCreateEpp
        open={open}
        create={(form) => {
          const confirm = Object.keys(form).length > 0;
          if (!confirm) {
            // Se descartó lo capturado: la próxima entrega es otra.
            submission.settle();
            return setOpen(false);
          }
          // El diálogo muestra el error: se propaga.
          return createMutation.mutateAsync(form);
        }}
      />
      <PageHeader title="EPP - Equipos de protección personal">
        <Button
          data-dd-action-name="Registrar entrega de EPP"
          variant="contained"
          onClick={() => setOpen(true)}
          startIcon={<AddIcon />}
        >
          Registrar entrega
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersEpp
        manufacturingPlantId={manufacturingPlantId}
        onManufacturingPlantChange={(nextPlantId) => {
          if (nextPlantId === manufacturingPlantId) return;
          setManufacturingPlantId(nextPlantId);
          // Los equipos son por planta.
          setFilters((prev) => ({ ...prev, equipmentId: "" }));
        }}
        manufacturingPlants={manufacturingPlants}
        filters={filters}
        setFilters={setFilters}
        count={count}
        sort={sort}
      />
      <Grid container spacing={2}>
        <Grid
          size={{
            xs: 12,
            sm: 12,
            md: 12,
          }}
        >
          <TableEpps
            rows={rows}
            manufacturingPlantId={manufacturingPlantId}
            count={count}
            isLoading={isLoading || isFetching}
            page={page}
            rowsPerPage={rowsPerPage}
            hasFilters={Object.values(filters).some(Boolean)}
            sorting={sort}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
            onHistoryDeleted={getData}
            isError={isError}
            onRetry={onRetry}
          />
        </Grid>
      </Grid>
    </>
  );
}
