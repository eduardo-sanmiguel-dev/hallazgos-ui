"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";

import { Button, ButtonGroup, Grid } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";

import DialogCreateEpp from "./_components/DialogCreateEpp";
import SelectDefault from "@components/SelectDefault";
import TableEpps from "./_components/TableEpps";
import { useUserSessionStore } from "@store";
import { EppService } from "@services";
import { Epp, EppSortableColumn } from "@interfaces";
import { SortOrder } from "@shared/utils";

export default function EppPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rows, setRows] = useState<Epp[]>([]);
  const [count, setCount] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(false);
  const [manufacturingPlantId, setManufacturingPlantId] = useState<string>("");

  // Estado de la consulta paginada (page es 0-based, como TablePagination).
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 400);
  const [order, setOrder] = useState<SortOrder>("asc");
  const [orderBy, setOrderBy] = useState<EppSortableColumn | null>(null);

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
      search: debouncedSearch,
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
    debouncedSearch,
    order,
    orderBy,
  ]);

  useEffect(() => {
    getData();
  }, [getData]);

  // Cualquier cambio de filtro, orden o tamaño vuelve a la primera página.
  useEffect(() => {
    setPage(0);
  }, [manufacturingPlantId, debouncedSearch, order, orderBy, rowsPerPage]);

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
      <Grid container spacing={2}>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <SelectDefault
            data={manufacturingPlants}
            label="Planta"
            value={manufacturingPlantId}
            onChange={(e) => setManufacturingPlantId(e.target.value)}
            validationEmpty
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 9,
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "center", md: "flex-end" },
            mt: { xs: 0.5, sm: 0 },
          }}
        >
          <ButtonGroup variant="contained" aria-label="Basic button group">
            <Button
              variant="contained"
              onClick={() => setOpen(true)}
              startIcon={<AddIcon />}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Crear registro
            </Button>
            <Button
              variant="contained"
              onClick={() => getData()}
              startIcon={<RefreshIcon />}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Recargar
            </Button>
          </ButtonGroup>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 12,
            md: 12,
          }}
        >
          {/* La tabla no se desmonta al cargar: así la búsqueda conserva el foco. */}
          <TableEpps
            rows={rows}
            count={count}
            isLoading={isLoading}
            page={page}
            rowsPerPage={rowsPerPage}
            search={search}
            order={order}
            orderBy={orderBy}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
            onSearchChange={setSearch}
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
