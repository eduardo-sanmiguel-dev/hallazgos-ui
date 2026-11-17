import { useState } from "react";

import { useRouter } from "@shared/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList, useTableSort } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { SecondaryTypesService } from "@services";
import TableSecondaryTypes, {
  SECONDARY_TYPE_DEFAULT_SORT,
  SECONDARY_TYPE_SORT_OPTIONS,
} from "./_components/TableSecondaryTypes";
import FiltersSecondaryTypes, { IFiltersSecondaryTypes } from "./_components/FiltersSecondaryTypes";

// Valores iniciales de los filtros (también para "Limpiar filtros").
const defaultFilters = (): IFiltersSecondaryTypes => ({
  name: "",
  mainTypeId: "",
});

const SecondaryTypesPage = () => {
  const [filters, setFilters] = useState<IFiltersSecondaryTypes>(defaultFilters);

  const router = useRouter();

  const sort = useTableSort(
    "secondary-types",
    SECONDARY_TYPE_SORT_OPTIONS,
    SECONDARY_TYPE_DEFAULT_SORT,
  );

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "secondary-types",
    allowAllRows: true,
    filters,
    sort: sort.sort,
    fetcher: (filters, { page, limit, ...sorting }) =>
      SecondaryTypesService.findAllPaginated({
        ...filters,
        page,
        limit,
        ...sorting,
      }),
  });

  return (
    <>
      <PageHeader title="Tipos de criterios">
        <Button
          data-dd-action-name="Crear tipo de criterio"
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/secondary-types/form")}
        >
          Crear tipo
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersSecondaryTypes
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
        <TableSecondaryTypes sorting={sort} rows={data} getData={getData} pagination={pagination} />
      )}
    </>
  );
};

export default SecondaryTypesPage;
