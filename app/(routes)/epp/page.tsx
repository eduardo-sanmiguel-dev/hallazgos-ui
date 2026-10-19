"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";

import { Button, Grid } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import DialogCreateEpp from "./_components/DialogCreateEpp";
import TableEpps from "./_components/TableEpps";
import FiltersEpp, {
  DEFAULT_FILTERS_EPP,
  type IFiltersEpp,
} from "./_components/FiltersEpp";
import { useUserSessionStore } from "@store";
import { EppService } from "@services";
import { Epp, EppSortableColumn } from "@interfaces";
import { SortOrder } from "@shared/utils";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";

export default function EppPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rows, setRows] = useState<Epp[]>([]);
  const [count, setCount] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(false);
  const [manufacturingPlantId, setManufacturingPlantId] = useState<string>("");

  // Estado de la consulta paginada (page es 0-based, como TablePagination).
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<SortOrder>("asc");
  const [orderBy, setOrderBy] = useState<EppSortableColumn | null>(null);
  const [filters, setFilters] = useState<IFiltersEpp>(DEFAULT_FILTERS_EPP);
  // Un solo debounce para todos los filtros (incluida la búsqueda por texto).
  const [debouncedFilters] = useDebounce(filters, 400);

  // Solo se aplica la respuesta de la última petición.
  const lastRequestId = useRef(0);

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  const getData = useCallback(() => {
    const requestId = ++lastRequestId.current;

    if (!manufacturingPlantId) {
      setRows([]);
      setCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    EppService.findPaginated({
      manufacturingPlantId,
      page: page + 1,
      limit: rowsPerPage,
      ...debouncedFilters,
      ...(orderBy && { orderBy, order }),
    })
      .then(({ data, count }) => {
        if (requestId !== lastRequestId.current) return;

        // Si la página quedó vacía (ej. se borró el último registro), ir a la última con datos.
        if (!data.length && count > 0 && page > 0) {
          setPage(Math.max(0, Math.ceil(count / rowsPerPage) - 1));
          return;
        }

        setRows(data);
        setCount(count);
      })
      .finally(() => {
        if (requestId === lastRequestId.current) setIsLoading(false);
      });
  }, [
    manufacturingPlantId,
    page,
    rowsPerPage,
    debouncedFilters,
    order,
    orderBy,
  ]);

  useEffect(() => {
    getData();
  }, [getData]);

  // Cualquier cambio de filtro, orden o tamaño vuelve a la primera página.
  useEffect(() => {
    setPage(0);
  }, [manufacturingPlantId, debouncedFilters, order, orderBy, rowsPerPage]);

  useEffect(() => {
    if (manufacturingPlants.length) {
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
          EppService.create(form).then(() => {
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
            isLoading={isLoading}
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
