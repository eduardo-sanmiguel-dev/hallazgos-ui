import { useState } from "react";

import { useRouter } from "@shared/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList, useTableSort } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { MainTypesService } from "@services";
import TableMainTypes, {
  MAIN_TYPE_DEFAULT_SORT,
  MAIN_TYPE_SORT_OPTIONS,
} from "./_components/TableMainTypes";
import FiltersMainTypes, { IFiltersMainTypes } from "./_components/FiltersMainTypes";

// Valores iniciales de los filtros (también para "Limpiar filtros").
const defaultFilters = (): IFiltersMainTypes => ({
  name: "",
});

const MainTypesPage = () => {
  const [filters, setFilters] = useState<IFiltersMainTypes>(defaultFilters);

  const router = useRouter();

  const sort = useTableSort("main-types", MAIN_TYPE_SORT_OPTIONS, MAIN_TYPE_DEFAULT_SORT);

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "main-types",
    allowAllRows: true,
    filters,
    sort: sort.sort,
    fetcher: (filters, { page, limit, ...sorting }) =>
      MainTypesService.findAllPaginated({
        ...filters,
        page,
        limit,
        ...sorting,
      }),
  });

  return (
    <>
      <PageHeader title="Criterios">
        <Button
          data-dd-action-name="Crear criterio"
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/main-types/form")}
        >
          Crear criterio
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersMainTypes
        sort={sort}
        filters={filters}
        setFilters={setFilters}
        count={count}
        canClear={JSON.stringify(filters) !== JSON.stringify(defaultFilters())}
        onClear={() => setFilters(defaultFilters())}
      />
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <TableMainTypes sorting={sort} rows={data} getData={getData} pagination={pagination} />
      )}
    </>
  );
};

export default MainTypesPage;
