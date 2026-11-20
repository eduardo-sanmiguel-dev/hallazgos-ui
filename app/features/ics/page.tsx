import { useState } from "react";

import { useRouter } from "@shared/navigation";

import Add from "@mui/icons-material/Add";
import { Button } from "@mui/material";

import { usePaginatedList, useRestoredPlantId, useTableSort } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import FiltersIcs, { DEFAULT_FILTERS_ICS, type IFiltersIcs } from "./_components/FiltersIcs";
import TableIcs, { ICS_DEFAULT_SORT, ICS_SORT_OPTIONS } from "./_components/TableIcs";
import { IcsService } from "@services";

const IcsPage = () => {
  // Con la planta que restaura su filtro: la primera página sale una vez.
  const restoredPlant = useRestoredPlantId();
  const [filters, setFilters] = useState<IFiltersIcs>(() => ({
    ...DEFAULT_FILTERS_ICS,
    manufacturingPlantId: restoredPlant,
  }));

  const router = useRouter();

  const sort = useTableSort("ics", ICS_SORT_OPTIONS, ICS_DEFAULT_SORT);

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "ics",
    filters,
    sort: sort.sort,
    fetcher: (filters, params) => IcsService.findAllPaginated({ ...filters, ...params }),
  });

  return (
    <>
      <PageHeader title="Índice de Comportamiento Seguro">
        <Button
          data-dd-action-name="Crear ICS"
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/ics/form")}
        >
          Crear ICS
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersIcs filters={filters} setFilters={setFilters} count={count} sort={sort} />
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <TableIcs sorting={sort} rows={data} getData={getData} pagination={pagination} />
      )}
    </>
  );
};

export default IcsPage;
