import { useState } from "react";

import { useRouter } from "@shared/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList, useRestoredPlantId, useTableSort } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { ProcessesService } from "@services";
import TableProcesses, {
  PROCESS_DEFAULT_SORT,
  PROCESS_SORT_OPTIONS,
} from "./_components/TableProcesses";
import FiltersProcesses, {
  DEFAULT_FILTERS_PROCESSES,
  type IFiltersProcesses,
} from "./_components/FiltersProcesses";

const ProcessesPage = () => {
  // Con la planta que restaura su filtro: la primera página sale una vez.
  const restoredPlant = useRestoredPlantId();
  const [filters, setFilters] = useState<IFiltersProcesses>(() => ({
    ...DEFAULT_FILTERS_PROCESSES,
    manufacturingPlantId: restoredPlant,
  }));

  const router = useRouter();

  const sort = useTableSort("processes", PROCESS_SORT_OPTIONS, PROCESS_DEFAULT_SORT);

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "processes",
    allowAllRows: true,
    filters,
    sort: sort.sort,
    fetcher: (filters, { page, limit, ...sorting }) =>
      ProcessesService.findAllPaginated({
        ...filters,
        page,
        limit,
        ...sorting,
      }),
  });

  return (
    <>
      <PageHeader title="Procesos">
        <Button
          data-dd-action-name="Crear proceso"
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/processes/form")}
        >
          Crear proceso
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersProcesses sort={sort} filters={filters} setFilters={setFilters} count={count} />
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <TableProcesses sorting={sort} rows={data} getData={getData} pagination={pagination} />
      )}
    </>
  );
};

export default ProcessesPage;
