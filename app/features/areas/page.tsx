import { useState } from "react";

import { useRouter } from "@shared/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList, useTableSort } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { AreasService } from "@services";
import TableAreas, { AREA_DEFAULT_SORT, AREA_SORT_OPTIONS } from "./_components/TableAreas";
import FiltersAreas, {
  DEFAULT_FILTERS_AREAS,
  type IFiltersAreas,
} from "./_components/FiltersAreas";

const AreasPage = () => {
  const [filters, setFilters] = useState<IFiltersAreas>(DEFAULT_FILTERS_AREAS);

  const router = useRouter();

  const sort = useTableSort("areas", AREA_SORT_OPTIONS, AREA_DEFAULT_SORT);

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "areas",
    allowAllRows: true,
    filters,
    sort: sort.sort,
    fetcher: (filters, { page, limit, ...sorting }) =>
      AreasService.findAllPaginated({
        ...filters,
        page,
        limit,
        ...sorting,
      }),
  });

  return (
    <>
      <PageHeader title="Zonas">
        <Button
          data-dd-action-name="Crear lugar"
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/areas/form")}
        >
          Crear lugar
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersAreas sort={sort} filters={filters} setFilters={setFilters} count={count} />
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <TableAreas sorting={sort} rows={data} getData={getData} pagination={pagination} />
      )}
    </>
  );
};

export default AreasPage;
