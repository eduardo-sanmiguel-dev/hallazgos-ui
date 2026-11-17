import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";

import { usePaginatedList, useTableSort } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import FilterBar, { compactFilters } from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";
import { RowActions, ViewAction } from "@shared/components/RowActions";
import ResponsiveTable, { type ResponsiveColumn } from "@shared/components/ResponsiveTable";
import { HdsService } from "@services";
import { Hds } from "@interfaces";
import type { SortOption, SortState } from "@shared/utils";

export interface IFiltersHds {
  name?: string;
}

const DEFAULT_FILTERS_HDS: IFiltersHds = {
  name: "",
};

// Solo hay una columna: el orden (A → Z / Z → A) se elige en el encabezado o
// en la barra de filtros, como en las demás tablas (antes era un filtro).
const HDS_SORT_OPTIONS: SortOption[] = [{ key: "name", label: "Nombre", kind: "text" }];
const HDS_DEFAULT_SORT: SortState = { orderBy: "name", order: "asc" };

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable).
const columns: ResponsiveColumn<Hds>[] = [
  {
    id: "name",
    sortKey: "name",
    header: "Nombre",
    cell: (row) => row.name,
    rowHeader: true,
    card: "title",
  },
];

const HdsPage = () => {
  const [filters, setFilters] = useState<IFiltersHds>(DEFAULT_FILTERS_HDS);
  // Una a la vez: el botón se deshabilita mientras se descarga.
  const download = useMutation({
    mutationFn: (name: string) => HdsService.downloadFile(name),
  });

  const sort = useTableSort("hds", HDS_SORT_OPTIONS, HDS_DEFAULT_SORT);

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "hds",
    filters,
    sort: sort.sort,
    fetcher: (filters, params) => HdsService.findAllPaginated({ ...filters, ...params }),
  });

  return (
    <>
      <PageHeader title="Hoja de datos de seguridad">
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FilterBar
        sort={sort}
        count={count}
        activeFilters={compactFilters(
          !!filters.name && {
            key: "name",
            label: "Nombre",
            value: filters.name,
            onRemove: () => setFilters({ ...filters, name: "" }),
          },
        )}
        onClearAll={() => setFilters(DEFAULT_FILTERS_HDS)}
      >
        <ClearFiltersButton
          visible={!!filters.name}
          onClick={() => setFilters(DEFAULT_FILTERS_HDS)}
        />
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
          }}
        >
          <TextField
            label="Nombre"
            fullWidth
            variant="outlined"
            value={filters.name}
            autoComplete="off"
            onChange={(e) => {
              setFilters({
                ...filters,
                name: e.target.value,
              });
            }}
          />
        </Grid>
      </FilterBar>
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <ResponsiveTable
          sorting={sort}
          rows={data}
          columns={columns}
          getRowKey={(row) => row.name}
          pagination={pagination}
          ariaLabel="Hojas de datos de seguridad"
          emptyTitle="Sin registros de hojas de datos"
          emptyDescription="No hay hojas de datos con los filtros actuales."
          actions={(row) => (
            <RowActions>
              <ViewAction
                label="Ver archivo"
                onClick={() => download.mutate(row.name)}
                disabled={download.isPending}
              />
            </RowActions>
          )}
        />
      )}
    </>
  );
};

export default HdsPage;
