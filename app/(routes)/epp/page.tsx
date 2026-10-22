"use client";

import { useEffect, useState } from "react";

import { Button, Grid } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import DialogCreateEpp from "./_components/DialogCreateEpp";
import TableEpps from "./_components/TableEpps";
import FiltersEpp, {
  DEFAULT_FILTERS_EPP,
  type IFiltersEpp,
} from "./_components/FiltersEpp";
import { usePaginatedList } from "@hooks";
import { useUserSessionStore } from "@store";
import { EppService } from "@services";
import { EppSortableColumn } from "@interfaces";
import { SortOrder } from "@shared/utils";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";

export default function EppPage() {
  const [open, setOpen] = useState<boolean>(false);
  const [manufacturingPlantId, setManufacturingPlantId] = useState<string>("");
  const [order, setOrder] = useState<SortOrder>("asc");
  const [orderBy, setOrderBy] = useState<EppSortableColumn | null>(null);
  const [filters, setFilters] = useState<IFiltersEpp>(DEFAULT_FILTERS_EPP);

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  // Planta, filtros y orden forman la consulta: cualquier cambio vuelve a la
  // página 1 y las respuestas viejas se descartan (usePaginatedList).
  const {
    rows,
    count,
    pagination: { page, setPage, rowsPerPage, setRowsPerPage, isFetching },
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "epp",
    filters: { manufacturingPlantId, ...filters, order, orderBy },
    fetcher: ({ order, orderBy, ...query }, { page, limit }) =>
      EppService.findPaginated({
        ...query,
        page,
        limit,
        ...(orderBy && { orderBy, order }),
      }),
    debounceMs: 400,
    // La planta seleccionada debe estar también en los filtros del debounce.
    enabled: (query) =>
      !!query.manufacturingPlantId &&
      query.manufacturingPlantId === manufacturingPlantId,
  });

  // Si la página quedó vacía (p. ej. se borró el último registro), ir a la
  // última con datos.
  useEffect(() => {
    if (!rows.length && count > 0 && page > 0) {
      setPage(Math.max(0, Math.ceil(count / rowsPerPage) - 1));
    }
  }, [rows, count, page, rowsPerPage, setPage]);

  useEffect(() => {
    if (manufacturingPlants.length === 1) {
      setManufacturingPlantId(manufacturingPlants[0].id.toString());
    }
  }, [manufacturingPlants]);

  return (
    <>
      <DialogCreateEpp
        open={open}
        create={(form) => {
          const confirm = Object.keys(form).length > 0;
          if (!confirm) return setOpen(false);
          return EppService.create(form).then(() => {
            setOpen(false);
            getData();
          });
        }}
      />
      <PageHeader title="EPP - Equipos de protección personal">
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
          startIcon={<AddIcon />}
        >
          Crear registro
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
            count={count}
            isLoading={isLoading || isFetching}
            page={page}
            rowsPerPage={rowsPerPage}
            hasFilters={Object.values(filters).some(Boolean)}
            order={order}
            orderBy={orderBy}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
            onSortChange={(nextOrder, nextOrderBy) => {
              setOrder(nextOrder);
              setOrderBy(nextOrderBy);
            }}
            onHistoryDeleted={getData}
          />
        </Grid>
      </Grid>
    </>
  );
}
